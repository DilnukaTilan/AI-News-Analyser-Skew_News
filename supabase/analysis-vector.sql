-- Apply to an existing Skew News database before running POST /api/analyze.
-- This is intentionally idempotent so it can be reviewed and run in the
-- Supabase Dashboard -> SQL Editor.

create extension if not exists vector with schema extensions;

alter table public.article_analyses
  add column if not exists embedding extensions.vector(1536);

create index if not exists article_analyses_embedding_ivfflat_idx
  on public.article_analyses
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100)
  where embedding is not null;

create or replace function public.get_related_articles(
  p_article_id uuid,
  p_query_embedding extensions.vector(1536),
  p_match_count integer default 5
)
returns table (
  id uuid,
  title text,
  image_url text,
  published_at timestamptz,
  source_name text,
  sentiment_label text,
  bias_label text,
  left_percentage smallint,
  center_percentage smallint,
  right_percentage smallint,
  confidence numeric,
  cosine_distance double precision
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    articles.id,
    articles.title,
    articles.image_url,
    articles.published_at,
    sources.name as source_name,
    analyses.sentiment_label,
    analyses.bias_label,
    analyses.left_percentage,
    analyses.center_percentage,
    analyses.right_percentage,
    analyses.confidence,
    (
      analyses.embedding OPERATOR(extensions.<=>) p_query_embedding
    )::double precision as cosine_distance
  from public.article_analyses as analyses
  join public.articles as articles on articles.id = analyses.article_id
  join public.sources as sources on sources.id = articles.source_id
  where analyses.embedding is not null
    and articles.analyzed_at is not null
    and sources.is_active
    and articles.id <> p_article_id
  order by
    analyses.embedding OPERATOR(extensions.<=>) p_query_embedding,
    articles.published_at desc,
    articles.id
  limit least(greatest(p_match_count, 0), 5);
$function$;

revoke execute on function public.get_related_articles(uuid, extensions.vector, integer)
  from public, anon, authenticated;
grant execute on function public.get_related_articles(uuid, extensions.vector, integer)
  to service_role;
