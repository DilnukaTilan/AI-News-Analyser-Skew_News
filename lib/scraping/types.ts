import "server-only";

import { z } from "zod";

export const DEFAULT_LIMIT_PER_SOURCE = 5;
export const MAX_LIMIT_PER_SOURCE = 20;
export const MAX_SOURCE_SELECTION = 25;

const trimmedValues = z
  .array(z.string().trim().min(1).max(200))
  .max(MAX_SOURCE_SELECTION)
  .transform((values) => [...new Set(values)]);

export const scrapeRequestSchema = z
  .object({
    sourceIds: trimmedValues.optional(),
    sourceNames: trimmedValues.optional(),
    limitPerSource: z
      .number()
      .int()
      .min(1)
      .max(MAX_LIMIT_PER_SOURCE)
      .default(DEFAULT_LIMIT_PER_SOURCE),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.sourceIds?.length && value.sourceNames?.length) {
      context.addIssue({
        code: "custom",
        message: "Choose sourceIds or sourceNames, not both.",
      });
    }
  });

export type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;

export type ScrapeStatus = "completed" | "partial" | "failed";

export type ScrapeSummary = {
  status: ScrapeStatus;
  sourcesChecked: number;
  candidatesFound: number;
  candidatesRejected: number;
  duplicatesSkipped: number;
  detailPagesScraped: number;
  articlesInserted: number;
  articlesRejected: number;
  articlesFailed: number;
  totalDurationMs: number;
  rejectionReasons: Record<string, number>;
};

export type ScrapeResult = {
  message: string;
  summary: ScrapeSummary;
};

export type SourceStrategy = {
  homepageLinkSelectors: string[];
  titleSelectors: string[];
  bodySelectors: string[];
  imageSelectors: string[];
  publishedAtSelectors: string[];
  canonicalSelectors: string[];
  excludeSelectors: string[];
  articleUrlAllowPatterns: string[];
  articleUrlRejectPatterns: string[];
  homepageRender: boolean;
  detailRender: boolean;
};

export type RejectionCounts = Record<string, number>;

export type CandidateExtraction = {
  candidates: string[];
  found: number;
  rejected: number;
  rejectionReasons: RejectionCounts;
};

export type ParsedArticle = {
  canonicalUrl: string | null;
  imageUrl: string;
  publishedAt: string;
  rawText: string;
  title: string;
};

export type ArticleParseResult =
  | { accepted: true; article: ParsedArticle }
  | { accepted: false; reason: string };

export class ScrapeInputError extends Error {}

export function emptySummary(): ScrapeSummary {
  return {
    status: "completed",
    sourcesChecked: 0,
    candidatesFound: 0,
    candidatesRejected: 0,
    duplicatesSkipped: 0,
    detailPagesScraped: 0,
    articlesInserted: 0,
    articlesRejected: 0,
    articlesFailed: 0,
    totalDurationMs: 0,
    rejectionReasons: {},
  };
}
