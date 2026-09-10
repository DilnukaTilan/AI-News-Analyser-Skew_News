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

1. Open **Dashboard -> SQL Editor** and run `supabase/schema.sql` once.
2. Run `supabase/verify.sql` and confirm all six application tables have RLS enabled,
   the three public read policies exist, and client roles have no operational-table
   access.
3. Copy `.env.example` to `.env.local` if needed and set:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`.

Only the first two variables are public. The service-role key bypasses RLS and must
remain server-only. The checked-in initial migration mirrors `supabase/schema.sql`
for future environment setup. This initial schema intentionally excludes pgvector
and article embeddings; those are added with the related-articles phase.

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

## Checks

```powershell
npm run typecheck
npm run lint
npx -y clerk@latest doctor
npm run build
```
