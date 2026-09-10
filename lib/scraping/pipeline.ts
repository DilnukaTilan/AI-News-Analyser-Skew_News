import "server-only";

import { fetchHtmlThroughOxylabs } from "@/lib/oxylabs/client";
import { parseArticlePage } from "@/lib/scraping/article-parser";
import { extractHomepageCandidates } from "@/lib/scraping/homepage-parser";
import { parseSourceStrategy } from "@/lib/scraping/source-strategy";
import {
  emptySummary,
  ScrapeInputError,
  type ArticleParseResult,
  type RejectionCounts,
  type ScrapeRequest,
  type ScrapeResult,
  type ScrapeSummary,
} from "@/lib/scraping/types";
import {
  findExistingArticleUrls,
  insertArticle,
} from "@/lib/supabase/queries/articles";
import { createLog } from "@/lib/supabase/queries/logs";
import { listActiveSources } from "@/lib/supabase/queries/sources";
import type { Json, Source } from "@/lib/supabase/types";

const DETAIL_CONCURRENCY = 3;

function increment(counts: RejectionCounts, reason: string, amount = 1): void {
  counts[reason] = (counts[reason] ?? 0) + amount;
}

function mergeCounts(target: RejectionCounts, source: RejectionCounts): void {
  for (const [reason, count] of Object.entries(source)) increment(target, reason, count);
}

async function writeLog(
  event: string,
  message: string,
  options: {
    context?: Record<string, Json>;
    level?: "debug" | "error" | "info" | "warn";
    sourceId?: string;
  } = {},
): Promise<void> {
  const context = options.context ?? {};
  const method = options.level === "error" ? console.error : options.level === "warn" ? console.warn : console.info;
  method(`[scrape] ${event}`, { ...context, sourceId: options.sourceId });

  try {
    await createLog({
      event,
      message,
      level: options.level ?? "info",
      source_id: options.sourceId ?? null,
      context,
    });
  } catch (error) {
    console.warn("[scrape] log_write_failed", {
      event,
      reason: error instanceof Error ? error.message : "Unknown logging error",
    });
  }
}

function selectSources(allSources: Source[], request: ScrapeRequest): Source[] {
  if (request.sourceIds?.length) {
    const requested = new Set(request.sourceIds);
    const selected = allSources.filter((source) => requested.has(source.id));
    const found = new Set(selected.map((source) => source.id));
    const missing = request.sourceIds.filter((id) => !found.has(id));
    if (missing.length) throw new ScrapeInputError(`Unknown or inactive source IDs: ${missing.join(", ")}`);
    return selected;
  }

  if (request.sourceNames?.length) {
    const requested = new Set(request.sourceNames);
    const selected = allSources.filter((source) => requested.has(source.name));
    const found = new Set(selected.map((source) => source.name));
    const missing = request.sourceNames.filter((name) => !found.has(name));
    if (missing.length) throw new ScrapeInputError(`Unknown or inactive source names: ${missing.join(", ")}`);
    return selected;
  }

  return allSources;
}

function finishSummary(summary: ScrapeSummary, startedAt: number, partial: boolean): void {
  summary.totalDurationMs = Date.now() - startedAt;
  summary.status = partial ? "partial" : "completed";
}

async function processSource(
  source: Source,
  limitPerSource: number,
  summary: ScrapeSummary,
): Promise<boolean> {
  summary.sourcesChecked += 1;
  await writeLog("scrape_source_started", `Scraping source ${source.name}.`, {
    sourceId: source.id,
    context: { sourceName: source.name },
  });

  let strategy;
  try {
    strategy = parseSourceStrategy(source.parser_strategy);
  } catch (error) {
    increment(summary.rejectionReasons, "invalid_source_strategy");
    await writeLog("scrape_source_failed", `Source ${source.name} has an invalid parser strategy.`, {
      level: "error",
      sourceId: source.id,
      context: { reason: error instanceof Error ? error.message : "Invalid strategy" },
    });
    return true;
  }

  let homepageHtml: string;
  try {
    homepageHtml = await fetchHtmlThroughOxylabs(source.listing_url, {
      render: strategy.homepageRender,
    });
    await writeLog("scrape_homepage_fetched", `Fetched homepage for ${source.name}.`, {
      sourceId: source.id,
    });
  } catch (error) {
    await writeLog("scrape_source_failed", `Unable to fetch homepage for ${source.name}.`, {
      level: "error",
      sourceId: source.id,
      context: { reason: error instanceof Error ? error.message : "Homepage fetch failed" },
    });
    return true;
  }

  let extraction;
  try {
    extraction = extractHomepageCandidates(homepageHtml, source.listing_url, strategy);
  } catch (error) {
    await writeLog("scrape_source_failed", `Unable to parse homepage for ${source.name}.`, {
      level: "error",
      sourceId: source.id,
      context: { reason: error instanceof Error ? error.message : "Homepage parse failed" },
    });
    return true;
  }

  summary.candidatesFound += extraction.found;
  summary.candidatesRejected += extraction.rejected;
  mergeCounts(summary.rejectionReasons, extraction.rejectionReasons);
  await writeLog("scrape_candidates_found", `Found candidates for ${source.name}.`, {
    sourceId: source.id,
    context: {
      accepted: extraction.candidates.length,
      found: extraction.found,
      rejected: extraction.rejected,
    },
  });
  if (extraction.rejected > 0) {
    await writeLog("scrape_candidates_rejected", `Rejected non-article candidates for ${source.name}.`, {
      sourceId: source.id,
      context: {
        count: extraction.rejected,
        reasons: extraction.rejectionReasons,
      },
    });
  }

  const existing = await findExistingArticleUrls(extraction.candidates);
  const pending = extraction.candidates.filter((url) => !existing.has(url));
  const duplicateCount = extraction.candidates.length - pending.length;
  summary.duplicatesSkipped += duplicateCount;
  if (duplicateCount > 0) {
    await writeLog("scrape_duplicates_skipped", `Skipped existing URLs for ${source.name}.`, {
      sourceId: source.id,
      context: { count: duplicateCount },
    });
  }

  let insertedForSource = 0;
  let detailsForSource = 0;
  let partial = false;
  for (let index = 0; index < pending.length && insertedForSource < limitPerSource; index += DETAIL_CONCURRENCY) {
    const batch = pending.slice(index, index + DETAIL_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (url) => {
        try {
          const html = await fetchHtmlThroughOxylabs(url, { render: strategy.detailRender });
          return { url, html } as const;
        } catch (error) {
          return { url, error } as const;
        }
      }),
    );

    for (const result of results) {
      if (insertedForSource >= limitPerSource) break;
      if ("error" in result) {
        summary.articlesFailed += 1;
        partial = true;
        await writeLog("scrape_article_failed", "Unable to fetch article detail page.", {
          level: "warn",
          sourceId: source.id,
          context: {
            reason: result.error instanceof Error ? result.error.message : "Detail fetch failed",
          },
        });
        continue;
      }

      summary.detailPagesScraped += 1;
      detailsForSource += 1;
      let parsed: ArticleParseResult;
      try {
        parsed = parseArticlePage(result.html, result.url, source.listing_url, strategy);
      } catch (error) {
        summary.articlesFailed += 1;
        partial = true;
        await writeLog("scrape_article_failed", "Unable to parse article detail page.", {
          level: "warn",
          sourceId: source.id,
          context: { reason: error instanceof Error ? error.message : "Article parse failed" },
        });
        continue;
      }
      if (!parsed.accepted) {
        summary.articlesRejected += 1;
        increment(summary.rejectionReasons, parsed.reason);
        await writeLog("scrape_article_rejected", "Rejected article after validation.", {
          level: "warn",
          sourceId: source.id,
          context: { reason: parsed.reason },
        });
        continue;
      }

      const finalExisting = await findExistingArticleUrls(
        [result.url, parsed.article.canonicalUrl].filter((url): url is string => Boolean(url)),
      );
      if (finalExisting.size > 0) {
        summary.duplicatesSkipped += 1;
        continue;
      }

      try {
        const article = await insertArticle({
          source_id: source.id,
          original_url: result.url,
          canonical_url: parsed.article.canonicalUrl,
          title: parsed.article.title,
          image_url: parsed.article.imageUrl,
          published_at: parsed.article.publishedAt,
          raw_text: parsed.article.rawText,
        });
        insertedForSource += 1;
        summary.articlesInserted += 1;
        await writeLog("scrape_article_inserted", "Inserted a validated article.", {
          sourceId: source.id,
          context: { articleId: article.id },
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Article insert failed";
        if (reason.includes("duplicate article URL")) {
          summary.duplicatesSkipped += 1;
        } else {
          summary.articlesFailed += 1;
          partial = true;
          await writeLog("scrape_article_failed", "Unable to insert a validated article.", {
            level: "error",
            sourceId: source.id,
            context: { reason },
          });
        }
      }
    }
  }

  await writeLog("scrape_details_completed", `Completed article detail scraping for ${source.name}.`, {
    sourceId: source.id,
    context: { detailPagesScraped: detailsForSource },
  });
  await writeLog("scrape_source_completed", `Completed source ${source.name}.`, {
    sourceId: source.id,
    context: { articlesInserted: insertedForSource },
  });
  return partial;
}

export async function runManualScrape(request: ScrapeRequest): Promise<ScrapeResult> {
  const startedAt = Date.now();
  const summary = emptySummary();
  const allSources = await listActiveSources();
  const sources = selectSources(allSources, request);

  await writeLog("scrape_started", "Manual scrape started.", {
    context: {
      limitPerSource: request.limitPerSource,
      selectedSources: sources.map((source) => source.name),
    },
  });

  if (sources.length === 0) {
    finishSummary(summary, startedAt, false);
    await writeLog("scrape_completed", "No active sources were available.", {
      context: { summary },
    });
    return { message: "No active sources were available.", summary };
  }

  let partial = false;
  for (const source of sources) {
    try {
      partial = (await processSource(source, request.limitPerSource, summary)) || partial;
    } catch (error) {
      partial = true;
      await writeLog("scrape_source_failed", `Source ${source.name} failed.`, {
        level: "error",
        sourceId: source.id,
        context: { reason: error instanceof Error ? error.message : "Source processing failed" },
      });
    }
  }

  finishSummary(summary, startedAt, partial);
  await writeLog("scrape_completed", "Manual scrape completed.", {
    level: partial ? "warn" : "info",
    context: { summary },
  });
  return { message: partial ? "Scrape completed with some failures." : "Scrape completed.", summary };
}
