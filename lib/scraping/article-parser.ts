import "server-only";

import * as cheerio from "cheerio";

import type {
  ArticleParseResult,
  SourceStrategy,
} from "@/lib/scraping/types";
import {
  getArticleUrlRejectionReason,
  normalizeAssetUrl,
  normalizePublisherUrl,
} from "@/lib/scraping/url";

const BASE_EXCLUDES = [
  "script",
  "style",
  "noscript",
  "template",
  "form",
  "nav",
  "footer",
  "aside",
  "[hidden]",
  "[aria-hidden='true']",
  "[class*='advert']",
  "[class*='promo']",
  "[class*='sponsor']",
  "[class*='newsletter']",
  "[class*='subscribe']",
  "[class*='related']",
  "[class*='most-viewed']",
  "[class*='social']",
  "[class*='share']",
  "[class*='load-more']",
  "[class*='caption']",
];

const GENERIC_TITLES = new Set([
  "home",
  "latest news",
  "live",
  "news",
  "politics",
  "search",
  "sports",
  "world",
]);

const CONTENT_NOISE = [
  /^(advertisement|sponsored|read more|related stories|load more)$/i,
  /^(sign up|subscribe)\b/i,
  /javascript (?:is disabled|required)/i,
];

type JsonLdArticle = {
  datePublished?: string;
  headline?: string;
  image?: string | string[] | { url?: string };
};

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function attributeOrText(
  $: cheerio.CheerioAPI,
  selectors: readonly string[],
  attributes: readonly string[],
): string | null {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length === 0) continue;
    for (const attribute of attributes) {
      const value = element.attr(attribute)?.trim();
      if (value) return value;
    }
    const text = cleanText(element.text());
    if (text) return text;
  }
  return null;
}

function findJsonLdArticle($: cheerio.CheerioAPI): JsonLdArticle | null {
  const candidates: unknown[] = [];
  $("script[type='application/ld+json']").each((_, element) => {
    try {
      const parsed: unknown = JSON.parse($(element).text());
      candidates.push(parsed);
    } catch {
      // Ignore malformed third-party metadata.
    }
  });

  const queue = [...candidates];
  while (queue.length > 0) {
    const value = queue.shift();
    if (Array.isArray(value)) {
      queue.push(...value);
      continue;
    }
    if (!value || typeof value !== "object") continue;

    const record = value as Record<string, unknown>;
    const type = record["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (
      types.some(
        (entry) =>
          typeof entry === "string" &&
          ["Article", "NewsArticle", "ReportageNewsArticle"].includes(entry),
      )
    ) {
      return {
        datePublished:
          typeof record.datePublished === "string" ? record.datePublished : undefined,
        headline: typeof record.headline === "string" ? record.headline : undefined,
        image:
          typeof record.image === "string" ||
          Array.isArray(record.image) ||
          (record.image !== null && typeof record.image === "object")
            ? (record.image as JsonLdArticle["image"])
            : undefined,
      };
    }
    if (Array.isArray(record["@graph"])) queue.push(...record["@graph"]);
  }
  return null;
}

function jsonLdImage(value: JsonLdArticle["image"]): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") ?? null;
  return value && typeof value.url === "string" ? value.url : null;
}

function isMeaningfulBlock(value: string): boolean {
  if (value.length < 40) return false;
  if (CONTENT_NOISE.some((pattern) => pattern.test(value))) return false;
  const braces = (value.match(/[{}]/g) ?? []).length;
  const cssSignals = (value.match(/[.#][a-z][\w-]*\s*\{/gi) ?? []).length;
  return braces < 6 && cssSignals < 2;
}

function splitLargeBlock(value: string): string[] {
  if (value.length < 900) return [value];
  const sentences = value.match(/[^.!?]+[.!?]+(?:["'”’)]*)|[^.!?]+$/g) ?? [value];
  const blocks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const next = cleanText(`${current} ${sentence}`);
    if (current && next.length > 450) {
      blocks.push(current);
      current = cleanText(sentence);
    } else {
      current = next;
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function extractBodyBlocks(
  $: cheerio.CheerioAPI,
  selectors: readonly string[],
): string[] {
  for (const selector of selectors) {
    const roots = $(selector);
    if (roots.length === 0) continue;

    const blocks: string[] = [];
    roots.each((_, root) => {
      const paragraphs = $(root).find("p");
      if (paragraphs.length > 0) {
        paragraphs.each((__, paragraph) => {
          blocks.push(cleanText($(paragraph).text()));
        });
      } else {
        blocks.push(...splitLargeBlock(cleanText($(root).text())));
      }
    });

    const seen = new Set<string>();
    const meaningful = blocks.filter((block) => {
      if (!isMeaningfulBlock(block) || seen.has(block)) return false;
      seen.add(block);
      return true;
    });
    if (meaningful.length > 0) return meaningful;
  }
  return [];
}

function hasClearSubject(title: string, rawText: string): boolean {
  const words = title
    .toLowerCase()
    .match(/[a-z]{4,}/g)
    ?.filter((word) => !["after", "from", "have", "into", "that", "this", "with"].includes(word));
  if (!words || words.length < 2) return false;
  const body = rawText.toLowerCase();
  return new Set(words.filter((word) => body.includes(word))).size >= 2;
}

function firstImageValue(
  $: cheerio.CheerioAPI,
  selectors: readonly string[],
): string | null {
  const meta =
    $("meta[property='og:image']").attr("content") ??
    $("meta[name='twitter:image']").attr("content");
  if (meta?.trim()) return meta.trim();

  for (const selector of selectors) {
    const image = $(selector).first();
    const direct = image.attr("src") ?? image.attr("data-src");
    if (direct?.trim()) return direct.trim();
    const srcset = image.attr("srcset") ?? image.attr("data-srcset");
    const first = srcset?.split(",")[0]?.trim().split(/\s+/)[0];
    if (first) return first;
  }
  return null;
}

export function parseArticlePage(
  html: string,
  originalUrl: string,
  listingUrl: string,
  strategy: SourceStrategy,
): ArticleParseResult {
  const $ = cheerio.load(html);
  const jsonLd = findJsonLdArticle($);
  for (const selector of [...BASE_EXCLUDES, ...strategy.excludeSelectors]) {
    $(selector).remove();
  }

  const title = cleanText(
    attributeOrText($, strategy.titleSelectors, []) ??
      $("meta[property='og:title']").attr("content") ??
      jsonLd?.headline ??
      "",
  );
  if (title.length < 12 || GENERIC_TITLES.has(title.toLowerCase())) {
    return { accepted: false, reason: "generic_or_missing_title" };
  }

  const canonicalValue = attributeOrText($, strategy.canonicalSelectors, ["href"]);
  const canonicalUrl = canonicalValue
    ? normalizePublisherUrl(canonicalValue, listingUrl)
    : null;
  if (canonicalValue && !canonicalUrl) {
    return { accepted: false, reason: "invalid_canonical_url" };
  }
  if (
    canonicalUrl &&
    getArticleUrlRejectionReason(canonicalUrl, listingUrl, strategy)
  ) {
    return { accepted: false, reason: "non_article_canonical_url" };
  }

  const imageValue = firstImageValue($, strategy.imageSelectors) ?? jsonLdImage(jsonLd?.image);
  const imageUrl = imageValue ? normalizeAssetUrl(imageValue, originalUrl) : null;
  if (!imageUrl) return { accepted: false, reason: "missing_image" };

  const publishedValue =
    attributeOrText($, strategy.publishedAtSelectors, ["datetime", "content"]) ??
    $("meta[property='article:published_time']").attr("content") ??
    $("meta[name='date']").attr("content") ??
    jsonLd?.datePublished;
  const publishedDate = publishedValue ? new Date(publishedValue) : null;
  if (!publishedDate || Number.isNaN(publishedDate.getTime())) {
    return { accepted: false, reason: "missing_published_date" };
  }

  const blocks = extractBodyBlocks($, strategy.bodySelectors);
  const rawText = blocks.join("\n\n");
  if (blocks.length < 3 && rawText.length < 900) {
    return { accepted: false, reason: "insufficient_article_body" };
  }
  if (!hasClearSubject(title, rawText)) {
    return { accepted: false, reason: "unclear_article_subject" };
  }

  return {
    accepted: true,
    article: {
      canonicalUrl,
      imageUrl,
      publishedAt: publishedDate.toISOString(),
      rawText,
      title,
    },
  };
}
