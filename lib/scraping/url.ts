import "server-only";

import { isIP } from "node:net";

import type { SourceStrategy } from "@/lib/scraping/types";

const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
]);

const REJECTED_PATH_SEGMENTS = new Set([
  "about",
  "author",
  "authors",
  "category",
  "contact",
  "corporate",
  "game",
  "games",
  "help",
  "live",
  "menu",
  "newsletter",
  "newsletters",
  "podcast",
  "podcasts",
  "privacy",
  "product",
  "products",
  "review",
  "reviews",
  "search",
  "section",
  "sections",
  "shop",
  "shopping",
  "show",
  "shows",
  "subscribe",
  "subscription",
  "support",
  "tag",
  "tags",
  "terms",
  "topic",
  "topics",
  "video",
  "videos",
]);

function normalizedHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isPublicHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized !== "localhost" &&
    !normalized.endsWith(".localhost") &&
    isIP(normalized) === 0
  );
}

function parseSafeHttpUrl(value: string, base?: string): URL | null {
  try {
    const url = base ? new URL(value, base) : new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password || !isPublicHostname(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function isSamePublisherHost(left: string, right: string): boolean {
  const leftUrl = parseSafeHttpUrl(left);
  const rightUrl = parseSafeHttpUrl(right);
  if (!leftUrl || !rightUrl) return false;
  return normalizedHostname(leftUrl.hostname) === normalizedHostname(rightUrl.hostname);
}

export function normalizePublisherUrl(value: string, listingUrl: string): string | null {
  const url = parseSafeHttpUrl(value, listingUrl);
  const listing = parseSafeHttpUrl(listingUrl);
  if (!url || !listing) return null;
  if (normalizedHostname(url.hostname) !== normalizedHostname(listing.hostname)) return null;

  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMETERS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export function normalizeAssetUrl(value: string, pageUrl: string): string | null {
  return parseSafeHttpUrl(value, pageUrl)?.toString() ?? null;
}

export function getArticleUrlRejectionReason(
  value: string,
  listingUrl: string,
  strategy: SourceStrategy,
): string | null {
  const normalized = normalizePublisherUrl(value, listingUrl);
  if (!normalized) return "unsafe_or_external_url";

  const url = new URL(normalized);
  const path = decodeURIComponent(url.pathname).toLowerCase();
  const segments = path.split("/").filter(Boolean);
  if (segments.length < 2) return "non_article_path";
  if (segments.some((segment) => REJECTED_PATH_SEGMENTS.has(segment))) {
    return "non_article_page_type";
  }

  const comparable = `${path}${url.search}`.toLowerCase();
  if (strategy.articleUrlRejectPatterns.some((part) => comparable.includes(part.toLowerCase()))) {
    return "source_rejected_url";
  }
  if (
    strategy.articleUrlAllowPatterns.length > 0 &&
    !strategy.articleUrlAllowPatterns.some((part) => comparable.includes(part.toLowerCase()))
  ) {
    return "source_url_not_allowed";
  }

  const hasDatePath = /\/(?:19|20)\d{2}\/(?:0?[1-9]|1[0-2])(?:\/|$)/.test(path);
  const hasArticleId = /(?:^|[-_/])(?:\d{5,}|[a-f\d]{8,})(?:[-_/]|$)/i.test(path);
  const hasStoryPath = /\/(?:article|articles|news|story|stories)\//.test(path);
  const finalSegment = segments.at(-1) ?? "";
  const hasLongSlug = finalSegment.split(/[-_]/).filter(Boolean).length >= 5;

  return hasDatePath || hasArticleId || hasStoryPath || hasLongSlug
    ? null
    : "uncertain_article_url";
}
