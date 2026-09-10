import "server-only";

import { z } from "zod";

const MAX_SELECTED_ARTICLES = 100;
const MAX_ANALYSIS_LIMIT = 500;

export const analysisRequestSchema = z
  .object({
    articleIds: z
      .array(z.string().trim().uuid())
      .max(MAX_SELECTED_ARTICLES)
      .transform((values) => [...new Set(values)])
      .optional(),
    limit: z.number().int().min(1).max(MAX_ANALYSIS_LIMIT).optional(),
  })
  .strict();

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type AnalysisStatus = "completed" | "partial";

export type AnalysisSummary = {
  status: AnalysisStatus;
  batchesProcessed: number;
  analyzed: number;
  embedded: number;
  completionTimestampsRepaired: number;
  skipped: number;
  failed: number;
  totalDurationMs: number;
  failureReasons: Record<string, number>;
};

export type AnalysisResult = {
  message: string;
  summary: AnalysisSummary;
};

export function emptyAnalysisSummary(): AnalysisSummary {
  return {
    status: "completed",
    batchesProcessed: 0,
    analyzed: 0,
    embedded: 0,
    completionTimestampsRepaired: 0,
    skipped: 0,
    failed: 0,
    totalDurationMs: 0,
    failureReasons: {},
  };
}
