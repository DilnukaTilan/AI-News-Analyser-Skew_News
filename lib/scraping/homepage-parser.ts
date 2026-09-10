import "server-only";

import * as cheerio from "cheerio";

import type {
  CandidateExtraction,
  RejectionCounts,
  SourceStrategy,
} from "@/lib/scraping/types";
import {
  getArticleUrlRejectionReason,
  normalizePublisherUrl,
} from "@/lib/scraping/url";

const BASE_EXCLUDES = [
  "nav",
  "footer",
  "aside",
  "[hidden]",
  "[aria-hidden='true']",
  "[style*='display:none']",
  "[style*='display: none']",
  "[class*='menu']",
  "[class*='navigation']",
  "[class*='newsletter']",
  "[class*='subscribe']",
  "[class*='promo']",
  "[class*='related']",
];

const MAX_HOMEPAGE_CANDIDATES = 150;

function increment(counts: RejectionCounts, reason: string): void {
  counts[reason] = (counts[reason] ?? 0) + 1;
}

export function extractHomepageCandidates(
  html: string,
  listingUrl: string,
  strategy: SourceStrategy,
): CandidateExtraction {
  const $ = cheerio.load(html);
  for (const selector of [...BASE_EXCLUDES, ...strategy.excludeSelectors]) {
    $(selector).remove();
  }

  const hrefs: string[] = [];
  for (const selector of strategy.homepageLinkSelectors) {
    $(selector).each((_, element) => {
      if (hrefs.length >= MAX_HOMEPAGE_CANDIDATES) return false;
      const href = $(element).attr("href")?.trim();
      if (href) hrefs.push(href);
    });
    if (hrefs.length >= MAX_HOMEPAGE_CANDIDATES) break;
  }

  const candidates: string[] = [];
  const seen = new Set<string>();
  const rejectionReasons: RejectionCounts = {};

  for (const href of hrefs) {
    const normalized = normalizePublisherUrl(href, listingUrl);
    if (!normalized) {
      increment(rejectionReasons, "unsafe_or_external_url");
      continue;
    }
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const reason = getArticleUrlRejectionReason(normalized, listingUrl, strategy);
    if (reason) {
      increment(rejectionReasons, reason);
      continue;
    }
    candidates.push(normalized);
  }

  const rejected = Object.values(rejectionReasons).reduce((sum, count) => sum + count, 0);
  return {
    candidates,
    found: seen.size,
    rejected,
    rejectionReasons,
  };
}
