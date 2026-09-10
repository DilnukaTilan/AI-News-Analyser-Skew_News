import "server-only";

import {
  AIConfigurationError,
  ArticleAnalysisGenerationError,
  ArticleEmbeddingGenerationError,
  ANALYSIS_DISCLAIMER,
  ANALYSIS_MODEL,
  assertAIConfigured,
  generateArticleAnalysis,
  generateArticleEmbedding,
} from "@/lib/ai/article-analysis";
import {
  emptyAnalysisSummary,
  type AnalysisRequest,
  type AnalysisResult,
  type AnalysisSummary,
} from "@/lib/analysis/types";
import {
  listAnalysisWork,
  markArticleAnalysisComplete,
  saveArticleAnalysis,
  saveArticleEmbedding,
  type AnalysisWorkItem,
} from "@/lib/supabase/queries/articles";
import { createLog } from "@/lib/supabase/queries/logs";
import type { Json } from "@/lib/supabase/types";

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 20;
const ANALYSIS_CONCURRENCY = 2;

type ProcessingStage = "analysis" | "embedding" | "persistence" | "completion";

function getBatchSize(): number {
  const raw = process.env.ANALYSIS_BATCH_SIZE?.trim();
  if (!raw) return DEFAULT_BATCH_SIZE;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_BATCH_SIZE) {
    throw new AIConfigurationError(
      `ANALYSIS_BATCH_SIZE must be an integer between 1 and ${MAX_BATCH_SIZE}.`,
    );
  }
  return parsed;
}

function increment(counts: Record<string, number>, reason: string): void {
  counts[reason] = (counts[reason] ?? 0) + 1;
}

async function writeAnalysisLog(
  event: string,
  message: string,
  options: {
    articleId?: string;
    context?: Record<string, Json>;
    level?: "debug" | "error" | "info" | "warn";
    sourceId?: string;
  } = {},
): Promise<void> {
  const context = options.context ?? {};
  const logMethod =
    options.level === "error"
      ? console.error
      : options.level === "warn"
        ? console.warn
        : console.info;
  logMethod(`[analysis] ${event}`, {
    ...context,
    articleId: options.articleId,
    sourceId: options.sourceId,
  });

  try {
    await createLog({
      article_id: options.articleId ?? null,
      source_id: options.sourceId ?? null,
      event,
      message,
      level: options.level ?? "info",
      context,
    });
  } catch {
    console.warn("[analysis] log_write_failed", { event });
  }
}

function failureReason(error: unknown, stage: ProcessingStage): string {
  if (error instanceof ArticleAnalysisGenerationError) return "analysis_generation_failed";
  if (error instanceof ArticleEmbeddingGenerationError) return "embedding_generation_failed";
  if (stage === "completion") return "completion_update_failed";
  return "analysis_persistence_failed";
}

async function processWorkItem(
  item: AnalysisWorkItem,
  summary: AnalysisSummary,
): Promise<void> {
  let stage: ProcessingStage = item.kind === "analysis" ? "analysis" : item.kind;

  try {
    if (item.kind === "completion") {
      await markArticleAnalysisComplete(item.article.id);
      summary.completionTimestampsRepaired += 1;
      await writeAnalysisLog(
        "analysis_completion_repaired",
        "Repaired an article analysis completion timestamp.",
        { articleId: item.article.id, sourceId: item.article.source_id },
      );
      return;
    }

    if (item.kind === "embedding") {
      const embedding = await generateArticleEmbedding(item.article);
      stage = "persistence";
      await saveArticleEmbedding(item.article.id, embedding);
      stage = "completion";
      await markArticleAnalysisComplete(item.article.id);
      summary.embedded += 1;
      await writeAnalysisLog(
        "article_embedded",
        "Generated a missing article embedding.",
        { articleId: item.article.id, sourceId: item.article.source_id },
      );
      return;
    }

    const generated = await generateArticleAnalysis(item.article);
    stage = "embedding";
    const embedding = await generateArticleEmbedding(item.article);
    stage = "persistence";
    await saveArticleAnalysis({
      article_id: item.article.id,
      summary: generated.summary,
      sentiment_score: generated.sentimentScore,
      sentiment_label: generated.sentimentLabel,
      bias_score:
        (generated.rightPercentage - generated.leftPercentage) / 100,
      bias_label: generated.politicalFramingLabel,
      left_percentage: generated.leftPercentage,
      center_percentage: generated.centerPercentage,
      right_percentage: generated.rightPercentage,
      confidence: generated.confidence,
      framing_notes: generated.framingNotes,
      loaded_terms: generated.loadedTerms,
      disclaimer: ANALYSIS_DISCLAIMER,
      model: ANALYSIS_MODEL,
      embedding,
    });
    stage = "completion";
    await markArticleAnalysisComplete(item.article.id);
    summary.analyzed += 1;
    summary.embedded += 1;
    await writeAnalysisLog("article_analyzed", "Analyzed and embedded an article.", {
      articleId: item.article.id,
      sourceId: item.article.source_id,
      context: { model: ANALYSIS_MODEL },
    });
  } catch (error) {
    const reason = failureReason(error, stage);
    summary.failed += 1;
    increment(summary.failureReasons, reason);
    await writeAnalysisLog("article_analysis_failed", "Article analysis work failed.", {
      articleId: item.article.id,
      sourceId: item.article.source_id,
      level: "error",
      context: { reason, stage },
    });
  }
}

async function processWithConcurrency(
  items: AnalysisWorkItem[],
  summary: AnalysisSummary,
): Promise<void> {
  let nextIndex = 0;
  const workerCount = Math.min(ANALYSIS_CONCURRENCY, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await processWorkItem(item, summary);
      }
    }),
  );
}

function summaryContext(summary: AnalysisSummary): Record<string, Json> {
  return {
    status: summary.status,
    batchesProcessed: summary.batchesProcessed,
    analyzed: summary.analyzed,
    embedded: summary.embedded,
    completionTimestampsRepaired: summary.completionTimestampsRepaired,
    skipped: summary.skipped,
    failed: summary.failed,
    totalDurationMs: summary.totalDurationMs,
    failureReasons: summary.failureReasons,
  };
}

export async function runArticleAnalysis(
  request: AnalysisRequest,
): Promise<AnalysisResult> {
  const startedAt = Date.now();
  const summary = emptyAnalysisSummary();
  const batchSize = getBatchSize();
  const attemptedIds = new Set<string>();
  let remaining = request.limit ?? Number.POSITIVE_INFINITY;
  let selectedSkipCountRecorded = false;

  assertAIConfigured();
  await writeAnalysisLog("analysis_started", "Article analysis started.", {
    context: {
      batchSize,
      requestedArticleCount: request.articleIds?.length ?? 0,
      requestedLimit: request.limit ?? null,
    },
  });

  while (remaining > 0) {
    const available = await listAnalysisWork(request.articleIds);

    if (request.articleIds && !selectedSkipCountRecorded) {
      summary.skipped += Math.max(0, request.articleIds.length - available.length);
      selectedSkipCountRecorded = true;
    }

    const pending = available.filter((item) => !attemptedIds.has(item.article.id));
    if (pending.length === 0) break;

    const allowedCount = Math.min(pending.length, remaining);
    const currentRun = pending.slice(0, allowedCount);

    for (let index = 0; index < currentRun.length; index += batchSize) {
      const batch = currentRun.slice(index, index + batchSize);
      batch.forEach((item) => attemptedIds.add(item.article.id));
      summary.batchesProcessed += 1;
      const countsBefore = {
        analyzed: summary.analyzed,
        embedded: summary.embedded,
        failed: summary.failed,
      };
      await writeAnalysisLog("analysis_batch_started", "Analysis batch started.", {
        context: {
          batchNumber: summary.batchesProcessed,
          itemCount: batch.length,
        },
      });
      await processWithConcurrency(batch, summary);
      await writeAnalysisLog("analysis_batch_completed", "Analysis batch completed.", {
        context: {
          batchNumber: summary.batchesProcessed,
          itemCount: batch.length,
          analyzed: summary.analyzed - countsBefore.analyzed,
          embedded: summary.embedded - countsBefore.embedded,
          skipped: 0,
          failed: summary.failed - countsBefore.failed,
        },
      });
    }

    remaining -= currentRun.length;
    if (request.articleIds || request.limit !== undefined) break;
  }

  summary.totalDurationMs = Date.now() - startedAt;
  summary.status = summary.failed > 0 ? "partial" : "completed";
  await writeAnalysisLog(
    "analysis_completed",
    summary.status === "partial"
      ? "Article analysis completed with some failures."
      : "Article analysis completed.",
    {
      level: summary.status === "partial" ? "warn" : "info",
      context: summaryContext(summary),
    },
  );

  return {
    message:
      summary.status === "partial"
        ? "Analysis completed with some failures."
        : "Analysis completed.",
    summary,
  };
}
