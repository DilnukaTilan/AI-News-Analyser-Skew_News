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
