import "server-only";

import { openai } from "@ai-sdk/openai";
import { embed, generateText, Output } from "ai";
import { z } from "zod";

import type { Article } from "@/lib/supabase/types";

export const ANALYSIS_MODEL = "gpt-4o-mini";
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const ANALYSIS_DISCLAIMER =
  "This AI-generated political framing analysis is an estimate based only on the article text and may contain errors.";

const ANALYSIS_TEXT_LIMIT = 40_000;
const EMBEDDING_TEXT_LIMIT = 24_000;
const EMBEDDING_DIMENSIONS = 1_536;
const MAX_LOADED_TERMS = 12;
const GENERATION_ATTEMPTS = 2;

const framingLabels = ["left", "center", "right", "mixed", "unclear"] as const;

const articleAnalysisSchema = z
  .object({
    summary: z.string().trim().min(1).max(2_000),
    sentimentScore: z.number().min(-1).max(1),
    sentimentLabel: z.enum(["positive", "neutral", "negative"]),
    politicalFramingLabel: z.enum(framingLabels),
    leftPercentage: z.number().int().min(0).max(100),
    centerPercentage: z.number().int().min(0).max(100),
    rightPercentage: z.number().int().min(0).max(100),
    confidence: z.number().min(0).max(1),
    framingNotes: z.string().trim().min(1).max(2_000),
    loadedTerms: z
      .array(z.string().trim().min(1).max(120))
      .max(MAX_LOADED_TERMS),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.leftPercentage +
        value.centerPercentage +
        value.rightPercentage !==
      100
    ) {
      context.addIssue({
        code: "custom",
        message: "Political framing percentages must total 100.",
        path: ["leftPercentage"],
      });
    }

    if (value.sentimentLabel === "positive" && value.sentimentScore <= 0.05) {
      context.addIssue({
        code: "custom",
        message: "Positive sentiment requires a positive score.",
        path: ["sentimentLabel"],
      });
    }
    if (value.sentimentLabel === "negative" && value.sentimentScore >= -0.05) {
      context.addIssue({
        code: "custom",
        message: "Negative sentiment requires a negative score.",
        path: ["sentimentLabel"],
      });
    }
    if (value.sentimentLabel === "neutral" && Math.abs(value.sentimentScore) > 0.2) {
      context.addIssue({
        code: "custom",
        message: "Neutral sentiment requires a score near zero.",
        path: ["sentimentLabel"],
      });
    }

    const distributions = [
      ["left", value.leftPercentage],
      ["center", value.centerPercentage],
      ["right", value.rightPercentage],
    ] as const;
    const ranked = [...distributions].sort((left, right) => right[1] - left[1]);
    const topGap = ranked[0][1] - ranked[1][1];
    const label = value.politicalFramingLabel;

    if (label === "left" || label === "center" || label === "right") {
      if (label !== ranked[0][0]) {
        context.addIssue({
          code: "custom",
          message: "Political framing label must match the strongest percentage.",
          path: ["politicalFramingLabel"],
        });
      }
    } else if (topGap >= 10 && value.confidence >= 0.5) {
      context.addIssue({
        code: "custom",
        message: "Mixed or unclear framing requires close percentages or low confidence.",
        path: ["politicalFramingLabel"],
      });
    }
  });

export type GeneratedArticleAnalysis = z.infer<typeof articleAnalysisSchema>;

export class AIConfigurationError extends Error {}
export class ArticleAnalysisGenerationError extends Error {}
export class ArticleEmbeddingGenerationError extends Error {}

export function assertAIConfigured(): void {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new AIConfigurationError("Missing required environment variable: OPENAI_API_KEY");
  }
}

function normalizedArticleText(article: Article, limit: number): string {
  const body = article.raw_text.replace(/\s+/g, " ").trim();
  return `Title: ${article.title.trim()}\n\nArticle text:\n${body}`.slice(0, limit);
}

function retainGroundedTerms(
  terms: readonly string[],
  articleText: string,
): string[] {
  const haystack = articleText.toLocaleLowerCase().replace(/\s+/g, " ");
  return [
    ...new Set(
      terms
        .map((term) => term.trim())
        .filter(Boolean)
        .filter((term) => haystack.includes(term.toLocaleLowerCase().replace(/\s+/g, " "))),
    ),
  ].slice(0, MAX_LOADED_TERMS);
}

async function generateOnce(article: Article): Promise<GeneratedArticleAnalysis> {
  const articleText = normalizedArticleText(article, ANALYSIS_TEXT_LIMIT);
  const result = await generateText({
    model: openai(ANALYSIS_MODEL),
    maxOutputTokens: 1_600,
    maxRetries: 0,
    output: Output.object({
      name: "ArticleAnalysis",
      description: "Sentiment and AI-estimated political framing analysis of one article.",
      schema: articleAnalysisSchema,
    }),
    providerOptions: { openai: { store: false } },
    system: [
      "Analyze only the supplied article text.",
      "Do not infer sentiment or political framing from the publisher or source.",
      "Political framing is an estimate about language, emphasis, omissions, and presentation, not objective truth.",
      "Use unclear with low confidence when textual evidence is weak.",
      "Use mixed when the strongest two framing percentages differ by less than 10 points and both are supported.",
      "The three integer framing percentages must sum to exactly 100.",
      "Loaded terms must be exact words or phrases present in the article text.",
    ].join(" "),
    prompt: articleText,
  });

  const parsed = articleAnalysisSchema.parse(result.output);
  return {
    ...parsed,
    loadedTerms: retainGroundedTerms(parsed.loadedTerms, articleText),
  };
}

export async function generateArticleAnalysis(
  article: Article,
): Promise<GeneratedArticleAnalysis> {
  for (let attempt = 1; attempt <= GENERATION_ATTEMPTS; attempt += 1) {
    try {
      return await generateOnce(article);
    } catch {
      if (attempt === GENERATION_ATTEMPTS) {
        throw new ArticleAnalysisGenerationError(
          "Unable to generate a valid article analysis.",
        );
      }
    }
  }

  throw new ArticleAnalysisGenerationError("Unable to generate a valid article analysis.");
}

export async function generateArticleEmbedding(article: Article): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: normalizedArticleText(article, EMBEDDING_TEXT_LIMIT),
      maxRetries: 1,
      providerOptions: { openai: { dimensions: EMBEDDING_DIMENSIONS } },
    });

    if (
      embedding.length !== EMBEDDING_DIMENSIONS ||
      embedding.some((value) => !Number.isFinite(value))
    ) {
      throw new Error("Invalid embedding shape");
    }

    return embedding;
  } catch {
    throw new ArticleEmbeddingGenerationError("Unable to generate a valid embedding.");
  }
}
