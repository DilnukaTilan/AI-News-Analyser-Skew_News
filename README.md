# Skew News

Skew is a Next.js news experience that presents AI-assisted sentiment and political-framing analysis.

## Local setup

Install dependencies:

```powershell
npm install
```

Initialize Clerk with the official CLI:

```powershell
npx -y clerk@latest init
```

Alternatively, copy `.env.example` to `.env.local` and populate the Clerk publishable and secret keys from your Clerk application. Keep `.env.local` private.

## Supabase setup

The database schema is not applied automatically. Create a Supabase project, then:

1. Enable the **Vector** extension in the Supabase Dashboard.
2. Open **Dashboard -> SQL Editor** and run `supabase/schema.sql` once for a new
   database. For a database that already has the initial schema, run
   `supabase/analysis-vector.sql` instead.
3. Run `supabase/verify.sql` and confirm all six application tables have RLS enabled,
   the three public read policies exist, and client roles have no operational-table
   access. Also confirm the vector extension, embedding column, and IVFFlat index checks
   return results. The related-article function checks should show `security_invoker`
   and `stable` as true, `anon_can_execute` and `authenticated_can_execute` as false,
   and `service_role_can_execute` as true.
4. Copy `.env.example` to `.env.local` if needed and set:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`.

Only the first two variables are public. The service-role key bypasses RLS and must
remain server-only. The checked-in initial migration captures the original schema;
`supabase/analysis-vector.sql` upgrades existing databases with article embeddings.

Start the development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Signed-out users can browse news and use the header to sign up or log in. Signed-in users see their Clerk account menu.

## Manual scraping

Add active news sources to the Supabase `sources` table. Each source must have a
publisher homepage in `listing_url`; scraping never invents or crawls additional
listing pages. Then set `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, and
`BIASLY_ADMIN_SECRET` in `.env.local`.

Inspect the active source IDs, names, and homepage URLs:

```powershell
curl.exe "http://localhost:3000/api/sources"
```

For the curl examples, also set the same secret in the current PowerShell session:

```powershell
$env:BIASLY_ADMIN_SECRET = "<same value as .env.local>"
```

Start a scrape for all active sources (up to five valid articles per source):

```powershell
curl.exe -X POST "http://localhost:3000/api/scrape" `
  -H "Content-Type: application/json" `
  -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
  -d "{}"
```

To select a source and a smaller limit, use its exact active Supabase name:

```powershell
curl.exe -X POST "http://localhost:3000/api/scrape" `
  -H "Content-Type: application/json" `
  -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
  -d '{"sourceNames":["SOURCE_NAME"],"limitPerSource":2}'
```

Watch the `npm run dev` terminal for progress and the final summary. Scraping is
append-only; valid new articles are stored with `analyzed_at` left null.

## AI article analysis

Set `OPENAI_API_KEY` and `BIASLY_ADMIN_SECRET` in `.env.local`. The optional
`ANALYSIS_BATCH_SIZE` controls the number of work items per batch and defaults to 5.
Apply `supabase/analysis-vector.sql` before running analysis against a database created
from the original schema.

Process all pending analysis and embedding work:

```powershell
curl.exe -X POST "http://localhost:3000/api/analyze" `
  -H "Content-Type: application/json" `
  -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
  -d "{}"
```

Limit a run to one pending article:

```powershell
curl.exe -X POST "http://localhost:3000/api/analyze" `
  -H "Content-Type: application/json" `
  -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
  -d '{"limit":1}'
```

Process selected pending article IDs:

```powershell
curl.exe -X POST "http://localhost:3000/api/analyze" `
  -H "Content-Type: application/json" `
  -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
  -d '{"articleIds":["ARTICLE_UUID"]}'
```

Watch the `npm run dev` terminal for per-batch progress and the final summary. A full
analysis is not rerun for rows that only need an embedding backfill.

## Related articles

After the vector upgrade SQL is applied and embeddings have been generated, each news
details page queries up to five other analyzed articles by cosine distance. Related
results must have an embedding, belong to an active source, and never include the
current article. The section stays hidden until the current article has an embedding or
when no related matches exist.

## Checks

```powershell
npm run typecheck
npm run lint
npx -y clerk@latest doctor
npm run build
```
