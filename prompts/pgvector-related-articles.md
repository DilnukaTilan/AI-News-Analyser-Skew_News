# pgvector and Related Articles implementation prompt

## Goal

Complete section 20 of `AGENTS.md`: make pgvector-backed article embeddings and cosine
similarity an end-to-end feature, then render up to five real Related Articles on the
news details page. Preserve the existing analysis behavior, generate embeddings with
OpenAI `text-embedding-3-small`, backfill missing embeddings without rerunning valid
analysis, and never expose vectors or privileged credentials to browser code.

## Skills read

- `.agents/skills/supabase/SKILL.md`
  - Reviewed current schema-change, verification, RLS, service-role, and pgvector
    guidance.
  - Checked the current Supabase changelog for relevant breaking changes. Extension
    version pinning is deprecated, so SQL must enable `vector` without a version clause.
  - Checked the current Supabase Vector Columns, Semantic Search, and Vector Indexes
    documentation. Cosine distance uses `<=>`; the repository requirement explicitly
    calls for an IVFFlat cosine index even though current Supabase guidance generally
    prefers HNSW for changing datasets.
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - Keep database reads and secrets in server-only code and render the related list from
    the existing Server Component page.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`
  - Preserve the Next.js 16 async `params` contract for `app/news/[slug]/page.tsx`.

## Existing code inspected

- `app/api/analyze/route.ts`
- `lib/ai/article-analysis.ts`
- `lib/analysis/pipeline.ts`
- `lib/analysis/types.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/client.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/types.ts`
- `supabase/schema.sql`
- `supabase/analysis-vector.sql`
- `supabase/migrations/20260909000000_initial_schema.sql`
- `supabase/verify.sql`
- `app/news/[slug]/page.tsx`
- `components/news/related-stories.tsx`
- `components/ui/article-card.tsx`
- `app/page.tsx`
- `README.md`
- `package.json`

## Current state and decisions

- The working tree is clean at prompt creation time.
- The repository already has the vector extension declaration, nullable
  `article_analyses.embedding extensions.vector(1536)`, a partial IVFFlat cosine index,
  hand-maintained embedding types, `text-embedding-3-small` generation, finite-length
  validation, embedding-only backfill, and completion timestamp handling.
- Do not rewrite this working pipeline. Review it for completeness and make only the
  changes required to close gaps found by checks.
- The database does not currently define a typed similarity RPC/function and
  `lib/supabase/queries/articles.ts` has no `getRelatedArticles` query.
- The existing `components/news/related-stories.tsx` is demo-data-specific and is not
  wired into the real details page. Replace or adapt it to accept a small real related
  article view model.
- Use an SQL function for the `<=>` ordering because PostgREST/supabase-js cannot express
  this arbitrary vector distance ordering safely through the standard query builder.
- The similarity function must be `SECURITY INVOKER`, have a fixed safe `search_path`,
  and be callable only by `service_role`. Revoke the default `PUBLIC` execute grant and
  do not expose it to `anon` or `authenticated`.
- Keep the public article projections free of embeddings. Fetch the current article's
  embedding only through the server-only service-role query used by the details page.
- Related candidates must have a non-null embedding, a non-null `analyzed_at`, an active
  source, and an article ID different from the current article. Order by cosine distance
  ascending and cap results at five.
- Keep the required IVFFlat index rather than changing index type. The existing partial
  index should remain compatible with the query predicate `embedding is not null`.
- No Supabase project link/configuration or authenticated Supabase MCP tool is available
  in this workspace. Prepare idempotent SQL for an existing database and exact Dashboard
  instructions; do not claim the hosted database is changed until that SQL is run.
- `.env.example` is referenced by `README.md` and required by `AGENTS.md` but is missing.
  Since this feature introduces no new variable, create it only if necessary to restore
  the documented canonical environment template, containing the existing canonical
  variables with empty/example-safe values and no secrets.

## Files likely to change

- `supabase/schema.sql`
- `supabase/analysis-vector.sql`
- `supabase/verify.sql`
- `lib/supabase/types.ts`
- `lib/supabase/queries/articles.ts`
- `lib/ai/article-analysis.ts` only if verification finds a gap in the existing embedding
  call or validation
- `lib/analysis/pipeline.ts` only if verification finds a gap in pending-embedding or
  completion behavior
- `components/news/related-stories.tsx`
- `app/news/[slug]/page.tsx`
- `README.md`
- `.env.example` only as described above

Do not edit the original initial migration merely to retrofit an already-deployed
database. `supabase/schema.sql` describes a fresh database; `supabase/analysis-vector.sql`
is the idempotent upgrade path for an existing database.

## Database implementation requirements

1. Preserve or add `create extension if not exists vector with schema extensions;`
   without extension version pinning.
2. Preserve or add nullable `embedding extensions.vector(1536)` on
   `public.article_analyses`.
3. Preserve or add the partial IVFFlat cosine index on non-null embeddings using
   `extensions.vector_cosine_ops` and the repository-required list count.
4. Add a typed SQL similarity function that accepts:
   - the current article UUID,
   - the current 1536-dimension embedding,
   - a bounded result count whose application call is five.
5. The function must return only fields needed to render related cards: article ID,
   title, image URL, published timestamp, source name, sentiment label, framing label,
   left/center/right percentages, confidence, and optionally cosine distance/similarity
   for server-side diagnostics. Do not return raw article text or embeddings.
6. Join `article_analyses`, `articles`, and `sources`; require non-null candidate
   embeddings, completed articles, active sources, and exclude the current article.
7. Order with `candidate.embedding <=> query_embedding` ascending and return no more
   than five results from the application path.
8. Define the function as `SECURITY INVOKER`, set an explicit safe `search_path`, revoke
   execute from `PUBLIC`, `anon`, and `authenticated`, and grant execute to
   `service_role` only.
9. Add the function signature/result to the hand-maintained Supabase `Database` types so
   `.rpc(...)` is fully typed without `any`.
10. Add read-only verification SQL for extension presence, vector dimensions, index
    definition, function definition/security mode, and execute grants. The security
    verification must make accidental client execution visible.

## Analysis and embedding requirements

1. Keep the current `POST /api/analyze` admin-secret protection and request schema.
2. Use OpenAI `text-embedding-3-small` at exactly 1536 dimensions through the installed
   AI SDK/provider API.
3. Embed a deterministic title-plus-cleaned-body input, validate exactly 1536 finite
   numeric values, and never log the vector or article body.
4. A missing analysis row requires structured analysis plus embedding before setting
   `articles.analyzed_at`.
5. A valid analysis row with `embedding is null` requires embedding only; do not rerun
   the full analysis.
6. A complete analysis and embedding with a missing completion timestamp may repair only
   `analyzed_at`.
7. Continue using the actual joined analysis state instead of relying on
   `analyzed_at is null` alone.
8. Preserve batch processing, retry/error isolation, and analyzed/embedded/skipped/failed
   logging. Mark completion only after all required persistence succeeds.

## Application query requirements

1. Add `getRelatedArticles(articleId, embedding)` to
   `lib/supabase/queries/articles.ts` using `getSupabaseAdmin()`.
2. Validate the current article UUID and the embedding shape before invoking the RPC.
3. Clamp the result count internally to five and return a narrow typed view model.
4. Add a server-only way to load the current published article's embedding without
   adding embeddings to the normal public list/detail projection or serialized UI props.
5. Treat a missing current embedding as an empty related result, not an error.
6. Surface real database failures with contextual server errors; do not silently replace
   a query failure with demo stories.

## Related Articles UI requirements

### Visual interpretation

- Reuse the existing understated editorial visual language: warm off-white page,
  near-black type, thin black borders, compact metadata, small-radius images, and no
  decorative gradients or new accent system.
- Place the section after the article/analysis grid and before the newsletter signup so
  it reads as a continuation path after the story.
- Use the existing `Related Stories` component as the visual starting point but rename
  the user-facing heading to `Related Articles`.

### Layout and spacing

- Separate the section from the article with a thin top rule and comfortable top/bottom
  spacing consistent with the current details page.
- Render up to five cards in a responsive grid: one column on narrow screens, two columns
  where space allows, and a balanced desktop layout without introducing horizontal
  scrolling.
- Each card must show image, source, published date, title, sentiment, AI-estimated
  framing label, framing percentages, and confidence when present.
- Make the image/title navigate to `/news/<article-id>` with visible keyboard focus.

### Typography, colors, and accessibility

- Match existing font sizes, weights, tracking, muted metadata color, border color, and
  focus-ring treatment from `ArticleCard` and the details page.
- Use semantic `<section>`, heading, article, link, image alt text, and `<time>` markup.
- Political framing must remain explicitly labeled `AI-estimated`.
- Do not render the entire section when the current article has no embedding or the
  related result array is empty.

### Pixel-perfect expectations

- Avoid layout shift by reserving a consistent image aspect ratio.
- Long headlines and publisher names must wrap without overflowing.
- Cards should align cleanly at common mobile, tablet, and desktop widths and fit the
  existing `max-w-app` content width.

## Security requirements

- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `BIASLY_ADMIN_SECRET`,
  Oxylabs credentials, or `CRON_SECRET` to browser code, logs, props, or error responses.
- Keep vector retrieval and similarity queries in modules marked `server-only`.
- Never send embeddings to Client Components or include them in public feed/detail
  projections.
- Keep RLS enabled on all public tables and do not broaden existing table grants or
  public policies.
- The RPC must not be executable by `PUBLIC`, `anon`, or `authenticated`.
- Do not use `SECURITY DEFINER` for the similarity function.

## Acceptance criteria

- Fresh-schema SQL enables vector support, defines the 1536-dimension embedding column,
  creates the IVFFlat cosine index, and defines the locked-down related-article function.
- Existing-database upgrade SQL idempotently adds the same objects and permissions.
- `lib/supabase/types.ts` represents the vector column and typed RPC.
- The current AI analysis pipeline generates and saves valid
  `text-embedding-3-small` vectors and supports embedding-only backfill without rerunning
  analysis.
- `analyzed_at` is written only after all required analysis and embedding data exists.
- The server query returns at most five other analyzed articles with embeddings from
  active sources, nearest first by cosine distance.
- The news details page shows a responsive `Related Articles` section backed only by
  real Supabase data.
- The section is absent when the current embedding is null or no matches exist.
- Embeddings and privileged keys never reach public projections or browser bundles.
- Existing homepage and news-details behavior remains intact.
- Typecheck, lint, and production build pass.

## Checks to run

From the project root:

```powershell
npm run typecheck
npm run lint
npm run build
```

After applying the SQL to Supabase, run `supabase/verify.sql` in Dashboard -> SQL Editor
and confirm:

- vector extension is enabled;
- `article_analyses.embedding` is `extensions.vector(1536)`;
- the IVFFlat cosine index exists;
- the related-article function is `SECURITY INVOKER`;
- only `service_role` has execute access;
- sampled non-null embeddings report 1536 dimensions;
- a direct function call for an analyzed article returns at most five different,
  analyzed, active-source articles ordered by ascending cosine distance.

## Exact manual test steps expected after implementation

1. In Supabase Dashboard -> Database -> Extensions, enable **Vector** if it is not
   already enabled.
2. For an existing database, open SQL Editor and run the completed contents of
   `supabase/analysis-vector.sql`. For a fresh database, run `supabase/schema.sql`.
3. Run `supabase/verify.sql` and confirm every security/vector/function check has the
   expected result.
4. Ensure `.env.local` contains valid `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and
   `BIASLY_ADMIN_SECRET` values. Do not paste their values into terminal output.
5. Start the app:

   ```powershell
   npm run dev
   ```

6. In a second PowerShell window, set only the local test-shell secret placeholder to
   the same value already configured in `.env.local`:

   ```powershell
   $env:BIASLY_ADMIN_SECRET = "<same value as .env.local>"
   ```

7. Backfill every pending analysis or embedding and watch the Next.js dev terminal for
   per-batch and final counts:

   ```powershell
   curl.exe -X POST "http://localhost:3000/api/analyze" `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
     -d "{}"
   ```

8. Confirm the response reports analyzed/embedded/failed counts and that no article is
   marked complete before its embedding is saved.
9. Open `http://localhost:3000`, choose an analyzed article, and confirm its details page
   displays up to five real `Related Articles` in nearest-first order.
10. Open a related card and confirm it routes to the correct `/news/<uuid>` page.
11. Test a current article with `embedding is null` and confirm the entire Related
    Articles section is absent.
12. Resize to mobile, tablet, and desktop widths; confirm there is no overflow, long
    titles wrap, images retain their aspect ratio, and keyboard focus is visible.
13. Inspect the rendered page/network payload and confirm no embedding vector or
    privileged server-only credential is present.
