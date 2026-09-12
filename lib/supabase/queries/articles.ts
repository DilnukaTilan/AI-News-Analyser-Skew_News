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
const MAX_ARTICLE_LIMIT = 100;
const ANALYSIS_QUERY_PAGE_SIZE = 200;
const ARTICLE_ID_FILTER_CHUNK_SIZE = 100;
const EMBEDDING_DIMENSIONS = 1_536;
const RELATED_ARTICLE_LIMIT = 5;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

type PublicArticleAnalysis = Omit<ArticleAnalysis, "embedding">;

type ArticleProjection = Article & {
  article_analyses: PublicArticleAnalysis | PublicArticleAnalysis[] | null;
  sources: Source | Source[] | null;
};

export type ArticleWithAnalysis = Omit<Article, "analyzed_at"> & {
  analyzed_at: string;
  analysis: PublicArticleAnalysis;
  source: Source;
};

export type AnalysisWorkItem = {
  analysis: ArticleAnalysis | null;
  article: Article;
  kind: "analysis" | "embedding" | "completion";
};

export type RelatedArticle = {
  biasLabel: "left" | "center" | "right" | "mixed" | "unclear";
  centerPercentage: number;
  confidence: number;
  id: string;
  imageUrl: string;
  leftPercentage: number;
  publishedAt: string;
  rightPercentage: number;
  sentimentLabel: "positive" | "neutral" | "negative";
  sourceName: string;
  title: string;
};

export type NewArticle = Omit<
  TablesInsert<"articles">,
  "analyzed_at" | "created_at" | "id" | "updated_at"
>;

export type SavedAnalysis = Omit<
  TablesInsert<"article_analyses">,
  "created_at" | "updated_at"
>;

function firstOrNull<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizePublicArticle(row: ArticleProjection): ArticleWithAnalysis | null {
  const analysis = firstOrNull(row.article_analyses);
  const source = firstOrNull(row.sources);
  if (!analysis || !source || !row.analyzed_at) return null;

  const article: Omit<Article, "analyzed_at"> & { analyzed_at: string } = {
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

function normalizeEmbedding(value: number[] | string): number[] | null {
  if (Array.isArray(value)) return value;

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !Array.isArray(parsed) ||
      !parsed.every((entry: unknown): entry is number => typeof entry === "number")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function normalizeAnalysis(
  value: ArticleAnalysis | ArticleAnalysis[] | null,
): ArticleAnalysis | null {
  return firstOrNull(value);
}

function classifyAnalysisWork(
  article: Article,
  analysis: ArticleAnalysis | null,
): AnalysisWorkItem | null {
  if (!analysis) return { analysis: null, article, kind: "analysis" };
  if (!analysis.embedding) return { analysis, article, kind: "embedding" };
  if (!article.analyzed_at) return { analysis, article, kind: "completion" };
  return null;
}

export const DEFAULT_PAGE_SIZE = 15;

export type ListPublishedArticlesOptions = {
  page?: number;
  pageSize?: number;
};

export type PaginatedPublishedArticles = {
  articles: ArticleWithAnalysis[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listPublishedArticles(
  optionsOrPage: number | ListPublishedArticlesOptions = {},
  limitOption?: number,
): Promise<PaginatedPublishedArticles> {
  let requestedPage = 1;
  let pageSize = DEFAULT_PAGE_SIZE;

  if (typeof optionsOrPage === "number") {
    if (typeof limitOption === "number") {
      requestedPage = Math.max(1, Math.trunc(optionsOrPage));
      pageSize = Math.min(MAX_ARTICLE_LIMIT, Math.max(1, Math.trunc(limitOption)));
    } else {
      pageSize = Math.min(MAX_ARTICLE_LIMIT, Math.max(1, Math.trunc(optionsOrPage)));
    }
  } else if (optionsOrPage && typeof optionsOrPage === "object") {
    if (typeof optionsOrPage.page === "number" && Number.isFinite(optionsOrPage.page)) {
      requestedPage = Math.max(1, Math.trunc(optionsOrPage.page));
    }
    if (typeof optionsOrPage.pageSize === "number" && Number.isFinite(optionsOrPage.pageSize)) {
      pageSize = Math.min(
        MAX_ARTICLE_LIMIT,
        Math.max(1, Math.trunc(optionsOrPage.pageSize)),
      );
    }
  }

  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const client = getSupabaseClient();
  const { data, error, count } = await client
    .from("articles")
    .select(ARTICLE_PROJECTION, { count: "exact" })
    .not("analyzed_at", "is", null)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    if (error.code === "PGRST103" || error.message.toLowerCase().includes("range")) {
      const { count: exactCount } = await client
        .from("articles")
        .select("id", { count: "exact", head: true })
        .not("analyzed_at", "is", null);

      const totalCount = exactCount ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const clampedPage = totalPages;
      const clampedFrom = (clampedPage - 1) * pageSize;
      const clampedTo = clampedFrom + pageSize - 1;

      const clampedResult = await client
        .from("articles")
        .select(ARTICLE_PROJECTION)
        .not("analyzed_at", "is", null)
        .order("published_at", { ascending: false })
        .order("id", { ascending: false })
        .range(clampedFrom, clampedTo);

      const articles = (clampedResult.data ?? [])
        .map(normalizePublicArticle)
        .filter((article): article is ArticleWithAnalysis => article !== null);

      return {
        articles,
        totalCount,
        page: clampedPage,
        pageSize,
        totalPages,
      };
    }

    throw new Error(`Unable to list published articles: ${error.message}`);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalCount > 0 && from >= totalCount && requestedPage > totalPages) {
    const clampedPage = totalPages;
    const clampedFrom = (clampedPage - 1) * pageSize;
    const clampedTo = clampedFrom + pageSize - 1;

    const clampedResult = await client
      .from("articles")
      .select(ARTICLE_PROJECTION)
      .not("analyzed_at", "is", null)
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .range(clampedFrom, clampedTo);

    if (!clampedResult.error && clampedResult.data) {
      const articles = clampedResult.data
        .map(normalizePublicArticle)
        .filter((article): article is ArticleWithAnalysis => article !== null);

      return {
        articles,
        totalCount,
        page: clampedPage,
        pageSize,
        totalPages,
      };
    }
  }

  const articles = (data ?? [])
    .map(normalizePublicArticle)
    .filter((article): article is ArticleWithAnalysis => article !== null);

  return {
    articles,
    totalCount,
    page: requestedPage,
    pageSize,
    totalPages,
  };
}

export async function getPublishedArticleById(
  articleId: string,
): Promise<ArticleWithAnalysis | null> {
  const id = articleId.trim();
  if (!UUID_PATTERN.test(id)) return null;

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

export async function getPublishedArticleEmbedding(
  articleId: string,
): Promise<number[] | null> {
  const id = articleId.trim();
  if (!UUID_PATTERN.test(id)) return null;

  const publishedResult = await getSupabaseClient()
    .from("articles")
    .select("id")
    .eq("id", id)
    .not("analyzed_at", "is", null)
    .maybeSingle();

  if (publishedResult.error) {
    throw new Error(
      `Unable to verify published article embedding access: ${publishedResult.error.message}`,
    );
  }
  if (!publishedResult.data) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("article_analyses")
    .select("embedding")
    .eq("article_id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load published article embedding: ${error.message}`);
  }

  const storedEmbedding = data?.embedding ?? null;
  if (!storedEmbedding) return null;
  const embedding = normalizeEmbedding(storedEmbedding);
  if (
    !embedding ||
    embedding.length !== EMBEDDING_DIMENSIONS ||
    embedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("Unable to load published article embedding: invalid vector shape");
  }

  return embedding;
}

export async function getRelatedArticles(
  articleId: string,
  embedding: number[],
): Promise<RelatedArticle[]> {
  const id = articleId.trim();
  if (!UUID_PATTERN.test(id)) return [];
  if (
    embedding.length !== EMBEDDING_DIMENSIONS ||
    embedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("Unable to list related articles: invalid embedding");
  }

  const { data, error } = await getSupabaseAdmin().rpc("get_related_articles", {
    p_article_id: id,
    p_query_embedding: embedding,
    p_match_count: RELATED_ARTICLE_LIMIT,
  });

  if (error) {
    throw new Error(`Unable to list related articles: ${error.message}`);
  }

  return (data ?? []).slice(0, RELATED_ARTICLE_LIMIT).map((article) => ({
    biasLabel: article.bias_label,
    centerPercentage: article.center_percentage,
    confidence: article.confidence,
    id: article.id,
    imageUrl: article.image_url,
    leftPercentage: article.left_percentage,
    publishedAt: article.published_at,
    rightPercentage: article.right_percentage,
    sentimentLabel: article.sentiment_label,
    sourceName: article.source_name,
    title: article.title,
  }));
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
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await getSupabaseAdmin()
    .from("article_analyses")
    .upsert({ ...input, updated_at: now }, { onConflict: "article_id" });

  if (error) {
    throw new Error(`Unable to save article analysis: ${error.message}`);
  }
}

export async function saveArticleEmbedding(
  articleId: string,
  embedding: number[],
): Promise<void> {
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("article_analyses")
    .update({ embedding, updated_at: now })
    .eq("article_id", articleId)
    .select("article_id")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to save article embedding: ${error.message}`);
  }
  if (!data) {
    throw new Error("Unable to save article embedding: analysis row not found");
  }
}

const ANALYSIS_WORK_PROJECTION = `
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
    embedding,
    created_at,
    updated_at
  )
`;

type AnalysisCandidateProjection = Article & {
  article_analyses: ArticleAnalysis | ArticleAnalysis[] | null;
};

function normalizeAnalysisWorkRows(
  rows: AnalysisCandidateProjection[],
): AnalysisWorkItem[] {
  return rows
    .map((row) => {
      const analysis = normalizeAnalysis(row.article_analyses);
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
      return classifyAnalysisWork(article, analysis);
    })
    .filter((item): item is AnalysisWorkItem => item !== null);
}

export async function listAnalysisWork(
  articleIds?: readonly string[],
): Promise<AnalysisWorkItem[]> {
  const admin = getSupabaseAdmin();
  const normalizedIds = articleIds
    ? [...new Set(articleIds.map((id) => id.trim()).filter(Boolean))]
    : undefined;
  const rows: AnalysisCandidateProjection[] = [];

  if (normalizedIds) {
    for (const idChunk of chunks(normalizedIds, ARTICLE_ID_FILTER_CHUNK_SIZE)) {
      const { data, error } = await admin
        .from("articles")
        .select(ANALYSIS_WORK_PROJECTION)
        .in("id", idChunk)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      if (error) {
        throw new Error(`Unable to list selected analysis work: ${error.message}`);
      }
      rows.push(...(data as AnalysisCandidateProjection[]));
    }
  } else {
    for (let from = 0; ; from += ANALYSIS_QUERY_PAGE_SIZE) {
      const { data, error } = await admin
        .from("articles")
        .select(ANALYSIS_WORK_PROJECTION)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + ANALYSIS_QUERY_PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Unable to list analysis work: ${error.message}`);
      }

      rows.push(...(data as AnalysisCandidateProjection[]));
      if (data.length < ANALYSIS_QUERY_PAGE_SIZE) break;
    }
  }

  return normalizeAnalysisWorkRows(rows);
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
