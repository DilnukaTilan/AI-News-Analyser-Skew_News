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

## Checks

```powershell
npm run typecheck
npm run lint
npx -y clerk@latest doctor
npm run build
```
