import "server-only";

import * as cheerio from "cheerio";
import { z } from "zod";

import type { Json } from "@/lib/supabase/types";
import type { SourceStrategy } from "@/lib/scraping/types";

const selectorList = z.array(z.string().trim().min(1).max(300)).max(20);
const literalPatternList = z.array(z.string().trim().min(1).max(150)).max(20);

const strategySchema = z
  .object({
    homepageLinkSelectors: selectorList.optional(),
    titleSelectors: selectorList.optional(),
    bodySelectors: selectorList.optional(),
    imageSelectors: selectorList.optional(),
    publishedAtSelectors: selectorList.optional(),
    canonicalSelectors: selectorList.optional(),
    excludeSelectors: selectorList.optional(),
    articleUrlAllowPatterns: literalPatternList.optional(),
    articleUrlRejectPatterns: literalPatternList.optional(),
    homepageRender: z.boolean().optional(),
    detailRender: z.boolean().optional(),
  })
  .strict();

const DEFAULT_STRATEGY: SourceStrategy = {
  homepageLinkSelectors: [
    "article a[href]",
    "main [class*='story'] a[href]",
    "main [class*='article'] a[href]",
    "main [class*='card'] a[href]",
  ],
  titleSelectors: ["h1", "article h1", "main h1"],
  bodySelectors: [
    "[itemprop='articleBody']",
    "article [class*='body']",
    "article [class*='content']",
    "main article",
    "article",
  ],
  imageSelectors: [
    "article img",
    "main article img",
    "main figure img",
  ],
  publishedAtSelectors: [
    "time[datetime]",
    "[itemprop='datePublished']",
    "article time",
  ],
  canonicalSelectors: ["link[rel='canonical']"],
  excludeSelectors: [],
  articleUrlAllowPatterns: [],
  articleUrlRejectPatterns: [],
  homepageRender: false,
  detailRender: false,
};

export function parseSourceStrategy(input: Json | null): SourceStrategy {
  if (input === null) return DEFAULT_STRATEGY;

  const parsed = strategySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Source parser_strategy is invalid.");
  }

  const strategy = {
    ...DEFAULT_STRATEGY,
    ...parsed.data,
  };

  const $ = cheerio.load("<main><article><a href='/story'>Story</a></article></main>");
  for (const selector of [
    ...strategy.homepageLinkSelectors,
    ...strategy.titleSelectors,
    ...strategy.bodySelectors,
    ...strategy.imageSelectors,
    ...strategy.publishedAtSelectors,
    ...strategy.canonicalSelectors,
    ...strategy.excludeSelectors,
  ]) {
    try {
      $(selector);
    } catch {
      throw new Error(`Source parser_strategy contains an invalid CSS selector: ${selector}`);
    }
  }

  return strategy;
}
