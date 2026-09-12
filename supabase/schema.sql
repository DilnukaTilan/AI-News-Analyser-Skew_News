-- Skew News Supabase schema.
-- Apply once to a new Supabase project from Dashboard -> SQL Editor.

create extension if not exists vector with schema extensions;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint sources_name_not_blank check (length(btrim(name)) > 0),
  listing_url text not null unique
    constraint sources_listing_url_not_blank check (length(btrim(listing_url)) > 0),
  parser_strategy jsonb,
  is_active boolean not null default true,
  logo_url text constraint sources_logo_url_not_blank
    check (logo_url is null or length(btrim(logo_url)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  original_url text not null unique
    constraint articles_original_url_not_blank check (length(btrim(original_url)) > 0),
  canonical_url text constraint articles_canonical_url_not_blank
    check (canonical_url is null or length(btrim(canonical_url)) > 0),
  title text not null constraint articles_title_not_blank check (length(btrim(title)) > 0),
  image_url text not null
    constraint articles_image_url_not_blank check (length(btrim(image_url)) > 0),
  published_at timestamptz not null,
  raw_text text not null
    constraint articles_raw_text_not_blank check (length(btrim(raw_text)) > 0),
  scraped_at timestamptz not null default now(),
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.article_analyses (
  article_id uuid primary key references public.articles(id) on delete cascade,
  summary text not null
    constraint article_analyses_summary_not_blank check (length(btrim(summary)) > 0),
  sentiment_score numeric(5, 4) not null
    constraint article_analyses_sentiment_score_range check (sentiment_score between -1 and 1),
  sentiment_label text not null
    constraint article_analyses_sentiment_label_valid
      check (sentiment_label in ('positive', 'neutral', 'negative')),
  bias_score numeric(5, 4) not null
    constraint article_analyses_bias_score_range check (bias_score between -1 and 1),
  bias_label text not null
    constraint article_analyses_bias_label_valid
      check (bias_label in ('left', 'center', 'right', 'mixed', 'unclear')),
  left_percentage smallint not null
    constraint article_analyses_left_percentage_range check (left_percentage between 0 and 100),
  center_percentage smallint not null
    constraint article_analyses_center_percentage_range check (center_percentage between 0 and 100),
  right_percentage smallint not null
    constraint article_analyses_right_percentage_range check (right_percentage between 0 and 100),
  confidence numeric(5, 4) not null
    constraint article_analyses_confidence_range check (confidence between 0 and 1),
  framing_notes text not null
    constraint article_analyses_framing_notes_not_blank check (length(btrim(framing_notes)) > 0),
  loaded_terms text[] not null default '{}'::text[],
  disclaimer text not null
    constraint article_analyses_disclaimer_not_blank check (length(btrim(disclaimer)) > 0),
  model text not null
    constraint article_analyses_model_not_blank check (length(btrim(model)) > 0),
  embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_analyses_percentages_total
    check (left_percentage + center_percentage + right_percentage = 100),
  constraint article_analyses_bias_score_derived
    check (
      abs(bias_score - ((right_percentage - left_percentage)::numeric / 100)) < 0.000001
    )
);

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info'
    constraint logs_level_valid check (level in ('debug', 'info', 'warn', 'error')),
  event text not null constraint logs_event_not_blank check (length(btrim(event)) > 0),
  message text not null constraint logs_message_not_blank check (length(btrim(message)) > 0),
  source_id uuid references public.sources(id) on delete set null,
  article_id uuid references public.articles(id) on delete set null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.oxylabs_schedules (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null unique references public.sources(id) on delete restrict,
  schedule_id text not null unique
    constraint oxylabs_schedules_schedule_id_not_blank check (length(btrim(schedule_id)) > 0),
  status text not null default 'active'
    constraint oxylabs_schedules_status_not_blank check (length(btrim(status)) > 0),
  last_synced_at timestamptz not null default now(),
  last_run_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.oxylabs_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_record_id uuid not null references public.oxylabs_schedules(id) on delete cascade,
  run_id text constraint oxylabs_schedule_runs_run_id_not_blank
    check (run_id is null or length(btrim(run_id)) > 0),
  job_id text not null constraint oxylabs_schedule_runs_job_id_not_blank
    check (length(btrim(job_id)) > 0),
  result_status text not null default 'pending'
    constraint oxylabs_schedule_runs_result_status_valid
      check (result_status in ('pending', 'done', 'faulted', 'unknown')),
  processing_status text not null default 'pending'
    constraint oxylabs_schedule_runs_processing_status_valid
      check (processing_status in ('pending', 'processing', 'processed', 'failed', 'skipped')),
  result_created_at timestamptz,
  processed_at timestamptz,
  error_message text,
  summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_record_id, job_id)
);

create index sources_active_idx on public.sources (name, id) where is_active;
create unique index articles_canonical_url_unique_idx
  on public.articles (canonical_url) where canonical_url is not null;
create index articles_analyzed_feed_idx
  on public.articles (published_at desc, id desc) where analyzed_at is not null;
create index articles_pending_analysis_idx
  on public.articles (created_at, id) where analyzed_at is null;
create index articles_source_published_idx
  on public.articles (source_id, published_at desc, id desc);
create index article_analyses_embedding_ivfflat_idx
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

create index logs_created_idx on public.logs (created_at desc, id desc);
create index logs_event_created_idx on public.logs (event, created_at desc);
create index oxylabs_schedules_status_idx on public.oxylabs_schedules (status, updated_at desc);
create unique index oxylabs_schedule_runs_run_unique_idx
  on public.oxylabs_schedule_runs (schedule_record_id, run_id) where run_id is not null;
create index oxylabs_schedule_runs_status_idx
  on public.oxylabs_schedule_runs
  (schedule_record_id, result_status, processing_status, created_at desc);

alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_analyses enable row level security;
alter table public.logs enable row level security;
alter table public.oxylabs_schedules enable row level security;
alter table public.oxylabs_schedule_runs enable row level security;

revoke all on table public.sources from anon, authenticated;
revoke all on table public.articles from anon, authenticated;
revoke all on table public.article_analyses from anon, authenticated;
revoke all on table public.logs from anon, authenticated;
revoke all on table public.oxylabs_schedules from anon, authenticated;
revoke all on table public.oxylabs_schedule_runs from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant select on table public.sources to anon, authenticated;
grant select on table public.articles to anon, authenticated;
grant select on table public.article_analyses to anon, authenticated;
grant select, insert, update, delete on table public.sources to service_role;
grant select, insert, update, delete on table public.articles to service_role;
grant select, insert, update, delete on table public.article_analyses to service_role;
grant select, insert, update, delete on table public.logs to service_role;
grant select, insert, update, delete on table public.oxylabs_schedules to service_role;
grant select, insert, update, delete on table public.oxylabs_schedule_runs to service_role;

revoke execute on function public.get_related_articles(uuid, extensions.vector, integer)
  from public, anon, authenticated;
grant execute on function public.get_related_articles(uuid, extensions.vector, integer)
  to service_role;

create policy "Public can read active sources"
  on public.sources for select
  to anon, authenticated
  using (is_active);

create policy "Public can read analyzed articles from active sources"
  on public.articles for select
  to anon, authenticated
  using (
    analyzed_at is not null
    and exists (
      select 1 from public.sources
      where sources.id = articles.source_id and sources.is_active
    )
  );

create policy "Public can read analyses for public articles"
  on public.article_analyses for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.articles
      join public.sources on sources.id = articles.source_id
      where articles.id = article_analyses.article_id
        and articles.analyzed_at is not null
        and sources.is_active
    )
  );
