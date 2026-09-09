import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  Article,
  ArticleAnalysis,
  Source,
  TablesInsert,
} from "@/lib/supabase/types";

const URL_FILTER_CHUNK_SIZE = 15;
const DEFAULT_ARTICLE_LIMIT = 30;
const MAX_ARTICLE_LIMIT = 100;

const ARTICLE_PROJECTION = `
  id,
  source_id,
  original_url,
  canonical_url,
  title,
  image_url,
  published_at,
  raw_text,
  scraped_at,
  analyzed_at,
  created_at,
  updated_at,
  sources!articles_source_id_fkey (
    id,
    name,
    listing_url,
    parser_strategy,
    is_active,
    logo_url,
    created_at,
    updated_at
  ),
  article_analyses!article_analyses_article_id_fkey (
    article_id,
    summary,
    sentiment_score,
    sentiment_label,
    bias_score,
    bias_label,
    left_percentage,
    center_percentage,
    right_percentage,
    confidence,
    framing_notes,
    loaded_terms,
    disclaimer,
    model,
    created_at,
    updated_at
  )
`;

type ArticleProjection = Article & {
  article_analyses: ArticleAnalysis | ArticleAnalysis[] | null;
  sources: Source | Source[] | null;
};

export type ArticleWithAnalysis = Article & {
  analysis: ArticleAnalysis;
  source: Source;
};

export type NewArticle = Omit<
  TablesInsert<"articles">,
  "analyzed_at" | "created_at" | "id" | "updated_at"
>;

export type SavedAnalysis = Omit<
  TablesInsert<"article_analyses">,
  "created_at" | "updated_at"
>;

function clampLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_ARTICLE_LIMIT;
  return Math.min(MAX_ARTICLE_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_ARTICLE_LIMIT)));
}

function firstOrNull<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizePublicArticle(row: ArticleProjection): ArticleWithAnalysis | null {
  const analysis = firstOrNull(row.article_analyses);
  const source = firstOrNull(row.sources);
  if (!analysis || !source || !row.analyzed_at) return null;

  const article: Article = {
    analyzed_at: row.analyzed_at,
    canonical_url: row.canonical_url,
    created_at: row.created_at,
    id: row.id,
    image_url: row.image_url,
    original_url: row.original_url,
    published_at: row.published_at,
    raw_text: row.raw_text,
    scraped_at: row.scraped_at,
    source_id: row.source_id,
    title: row.title,
    updated_at: row.updated_at,
  };

  return { ...article, analysis, source };
}

function chunks<T>(values: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function normalizeUrls(urls: readonly string[]): string[] {
  return [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
}

export async function listPublishedArticles(
  limit?: number,
): Promise<ArticleWithAnalysis[]> {
  const { data, error } = await getSupabaseClient()
    .from("articles")
    .select(ARTICLE_PROJECTION)
    .not("analyzed_at", "is", null)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(clampLimit(limit));

  if (error) {
    throw new Error(`Unable to list published articles: ${error.message}`);
  }

  return data
    .map(normalizePublicArticle)
    .filter((article): article is ArticleWithAnalysis => article !== null);
}

export async function getPublishedArticleById(
  articleId: string,
): Promise<ArticleWithAnalysis | null> {
  const id = articleId.trim();
  if (!id) return null;

  const { data, error } = await getSupabaseClient()
    .from("articles")
    .select(ARTICLE_PROJECTION)
    .eq("id", id)
    .not("analyzed_at", "is", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load published article: ${error.message}`);
  }

  return data ? normalizePublicArticle(data) : null;
}

export async function findExistingArticleUrls(
  urls: readonly string[],
): Promise<Set<string>> {
  const normalizedUrls = normalizeUrls(urls);
  const existing = new Set<string>();

  for (const urlChunk of chunks(normalizedUrls, URL_FILTER_CHUNK_SIZE)) {
    const [originalResult, canonicalResult] = await Promise.all([
      getSupabaseAdmin()
        .from("articles")
        .select("original_url,canonical_url")
        .in("original_url", urlChunk),
      getSupabaseAdmin()
        .from("articles")
        .select("original_url,canonical_url")
        .in("canonical_url", urlChunk),
    ]);

    const error = originalResult.error ?? canonicalResult.error;
    if (error) {
      throw new Error(`Unable to check existing article URLs: ${error.message}`);
    }

    for (const row of [
      ...(originalResult.data ?? []),
      ...(canonicalResult.data ?? []),
    ]) {
      existing.add(row.original_url);
      if (row.canonical_url) existing.add(row.canonical_url);
    }
  }

  return existing;
}

export async function insertArticle(input: NewArticle): Promise<Article> {
  const { data, error } = await getSupabaseAdmin()
    .from("articles")
    .insert(input)
    .select("id,source_id,original_url,canonical_url,title,image_url,published_at,raw_text,scraped_at,analyzed_at,created_at,updated_at")
    .single();

  if (error) {
    const reason = error.code === "23505" ? "duplicate article URL" : error.message;
    throw new Error(`Unable to insert article: ${reason}`);
  }

  return data;
}

export async function saveArticleAnalysis(
  input: SavedAnalysis,
): Promise<ArticleAnalysis> {
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("article_analyses")
    .upsert({ ...input, updated_at: now }, { onConflict: "article_id" })
    .select("article_id,summary,sentiment_score,sentiment_label,bias_score,bias_label,left_percentage,center_percentage,right_percentage,confidence,framing_notes,loaded_terms,disclaimer,model,created_at,updated_at")
    .single();

  if (error) {
    throw new Error(`Unable to save article analysis: ${error.message}`);
  }

  return data;
}

export async function markArticleAnalysisComplete(
  articleId: string,
  analyzedAt = new Date().toISOString(),
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("articles")
    .update({ analyzed_at: analyzedAt, updated_at: analyzedAt })
    .eq("id", articleId)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Unable to mark article analysis complete: ${error.message}`);
  }
}
