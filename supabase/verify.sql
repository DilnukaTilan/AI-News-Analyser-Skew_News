-- Read-only verification for the Skew News initial schema.
-- Run after supabase/schema.sql in Supabase Dashboard -> SQL Editor.

-- This first query must return zero rows. Any row describes a failed security check.
with expected_tables(table_name) as (
  values
    ('sources'),
    ('articles'),
    ('article_analyses'),
    ('logs'),
    ('oxylabs_schedules'),
    ('oxylabs_schedule_runs')
), table_security as (
  select c.relname as table_name, c.relrowsecurity as rls_enabled
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
), forbidden_client_grants as (
  select grantee, table_name, privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (select table_name from expected_tables)
    and grantee in ('anon', 'authenticated')
    and (
      privilege_type <> 'SELECT'
      or table_name in ('logs', 'oxylabs_schedules', 'oxylabs_schedule_runs')
    )
)
select 'missing table or RLS disabled' as failed_check, expected_tables.table_name as detail
from expected_tables
left join table_security using (table_name)
where table_security.table_name is null or not table_security.rls_enabled
union all
select 'forbidden client grant', concat(grantee, ':', table_name, ':', privilege_type)
from forbidden_client_grants;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'sources',
    'articles',
    'article_analyses',
    'logs',
    'oxylabs_schedules',
    'oxylabs_schedule_runs'
  )
order by c.relname;

select
  tablename,
  policyname,
  roles,
  cmd,
  qual
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('sources', 'articles', 'article_analyses')
order by tablename, policyname;

select
  grantee,
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'sources',
    'articles',
    'article_analyses',
    'logs',
    'oxylabs_schedules',
    'oxylabs_schedule_runs'
  )
  and grantee in ('anon', 'authenticated', 'service_role')
group by grantee, table_name
order by table_name, grantee;

select
  c.relname as table_name,
  conname as constraint_name,
  pg_get_constraintdef(pc.oid) as definition
from pg_catalog.pg_constraint pc
join pg_catalog.pg_class c on c.oid = pc.conrelid
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'sources',
    'articles',
    'article_analyses',
    'logs',
    'oxylabs_schedules',
    'oxylabs_schedule_runs'
  )
order by table_name, constraint_name;

select
  tablename,
  indexname,
  indexdef
from pg_catalog.pg_indexes
where schemaname = 'public'
  and tablename in (
    'sources',
    'articles',
    'article_analyses',
    'logs',
    'oxylabs_schedules',
    'oxylabs_schedule_runs'
  )
order by tablename, indexname;

select id, name, listing_url, logo_url
from public.sources
where is_active
order by name, id
limit 10;

select id, source_id, title, image_url, published_at, analyzed_at
from public.articles
where analyzed_at is not null
order by published_at desc, id desc
limit 10;
