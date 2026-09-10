# AI Article Analysis Pipeline

## Goal

Implement the server-only AI article analysis pipeline for biasly. Add an authenticated
`POST /api/analyze` route that finds valid Supabase articles with missing analysis or
embedding work, generates and validates structured sentiment and AI-estimated political
framing data with the Vercel AI SDK and OpenAI provider, creates a 1536-dimension
`text-embedding-3-small` embedding, persists the result through the Supabase service-role
client, and marks an article analyzed only after all required analysis and embedding data
has been saved.

This prompt includes pgvector schema/type/persistence work because the current project
requirements define embedding completion as part of the analysis pipeline. It does not
implement related-article similarity queries or the Related Articles UI; those remain a
separate feature.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`

The Supabase changelog and current joins documentation were consulted. No relevant
breaking change blocks the planned service-role queries; the project already runs Node
24, which satisfies Supabase's current Node support direction. Current AI SDK structured
output and embedding documentation was consulted because the packages are not installed
yet and their APIs must not be inferred from memory.

## Existing code and documentation inspected

- `AGENTS.md`, especially sections 5, 7, 14, 15, 17, 19, 20, 21, and 22.
- `package.json` and `package-lock.json` — `ai` and `@ai-sdk/openai` are not installed.
- `.gitignore` and `.env.local` variable names — local secrets are ignored and
  `OPENAI_API_KEY` already exists locally; `.env.example` is currently missing.
- `supabase/schema.sql` and
  `supabase/migrations/20260909000000_initial_schema.sql` — the analysis table and its
  constraints exist, while pgvector and `embedding` are intentionally absent.
- `supabase/verify.sql` — current read-only schema/security checks.
- `lib/supabase/types.ts` — hand-maintained database types without an embedding column.
- `lib/supabase/admin.ts` — server-only typed service-role client.
- `lib/supabase/queries/articles.ts` — public projections, article insert helpers,
  analysis upsert, and explicit completion timestamp helper.
- `lib/supabase/queries/logs.ts` — best-effort persistent operational logging primitive.
- `lib/security/admin-secret.ts` and `app/api/scrape/route.ts` — constant-time admin
  secret validation and the established action-route error handling pattern.
- `lib/scraping/types.ts` and `lib/scraping/pipeline.ts` — current typed summary,
  batching, console logging, and database logging conventions.
- `README.md` — current local setup and PowerShell `curl.exe` testing style.
- Installed Next.js 16.3.4 documentation:
  `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`,
  `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md`, and
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`.
- Current official AI SDK documentation for `generateText` with `Output.object`, the
  OpenAI provider, and `embed`/`text-embedding-3-small`.
- Current official Supabase documentation for nested relationship queries and the
  Supabase changelog's relevant breaking/deprecation notices.

## Decisions and assumptions

- Use the direct OpenAI provider required by the project, not AI Gateway.
- Install `ai` and `@ai-sdk/openai`, then read their newly installed bundled docs/source
  before writing SDK calls. Use APIs confirmed for those exact installed versions.
- Use a current OpenAI small language model supported by the installed provider for the
  analysis call. Prefer `gpt-5-mini` if it is still documented and available at
  implementation time; define the chosen model in one server-only constant and save its
  exact ID in `article_analyses.model`.
- Use `text-embedding-3-small` with its default 1536 dimensions, matching the required
  pgvector column.
- Generate the embedding from a deterministic combination of article title and cleaned
  article text so initial analysis and embedding-only backfill use the same input.
- Default to all pending work. Accept an optional overall `limit` and optional selected
  `articleIds`; use `ANALYSIS_BATCH_SIZE` only for batch sizing, defaulting to 5.
- A selected ID that does not exist, is already fully complete, or is not a valid stored
  article is counted as skipped rather than causing unrelated work to fail.
- Full runs continue batch-by-batch until no applicable work remains or an explicit
  overall limit is reached. Failed rows are not immediately selected forever in the same
  invocation; track attempted IDs for that run.
- Retry invalid/failed structured model output once. Do not save partial or invalid
  analysis data.
- Derive `bias_score` in application code only after validation as
  `(right_percentage - left_percentage) / 100`; never ask the model to author this
  derived database value.
- Include a consistency-repair path for an article whose complete analysis and embedding
  exist but `analyzed_at` is still null (for example, a prior timestamp update failed).
- Keep route handling thin. Model prompting/validation belongs in `lib/ai`, orchestration
  in `lib/analysis`, and Supabase operations in `lib/supabase/queries`.
- Do not modify the news cards/details UI or implement related-article retrieval in this
  change.

## Files likely to change

- `package.json`
- `package-lock.json`
- `.env.example` (create; keep the canonical environment-variable list in sync)
- `README.md`
- `supabase/schema.sql`
- `supabase/verify.sql`
- A new migration created with the Supabase CLI's `migration new` command if the CLI can
  be made available without inventing a filename; otherwise document the exact reviewed
  SQL that must be applied in Supabase Dashboard and do not fabricate migration history.
- `lib/supabase/types.ts`
- `lib/supabase/queries/articles.ts`
- Possibly `lib/supabase/queries/logs.ts` only if a small reusable best-effort logging
  wrapper materially reduces duplication.
- `lib/ai/article-analysis.ts` (new)
- `lib/analysis/types.ts` (new, or combine with the pipeline when clearer)
- `lib/analysis/pipeline.ts` (new)
- `app/api/analyze/route.ts` (new)

Exact filenames may be adjusted to fit the existing small-module style, but the layer
boundaries above must remain intact.

## Database and Supabase requirements

- Determine and follow the repository's imperative migration workflow. The repository
  has `supabase/migrations/` and no declarative `supabase/schemas/` or `schema_paths`.
- Add the pgvector extension prerequisite and
  `article_analyses.embedding vector(1536)` to the desired schema and a reviewed
  migration/SQL artifact.
- Add the required IVFFlat cosine index described by `AGENTS.md`. Keep operator class,
  extension schema, and index syntax compatible with current Supabase pgvector docs.
- Keep the existing primary key/one-analysis-per-article contract and all analysis
  constraints.
- Update `lib/supabase/types.ts` so Row/Insert/Update and selected projections represent
  the embedding accurately without `any`.
- Extend the analysis projections and persistence helpers to include `embedding` where
  needed, without returning embeddings unnecessarily in public feed/detail payloads.
- Add a pending-work query that selects articles and their optional analysis relationship
  with a left nested join. Determine pending analysis from the absence of an
  `article_analyses` row and pending embedding from an existing valid analysis row whose
  `embedding` is null. Do not rely on `articles.analyzed_at is null` alone.
- Do not apply `.eq('foreignTable.column', value)` to a joined Supabase table. Fetch the
  joined shape and classify/filter it in TypeScript.
- Add narrowly scoped helpers for analysis upsert, embedding-only update, and completion
  timestamp repair as needed. Check every Supabase `{ data, error }` result and throw
  contextual server-side errors.
- Preserve idempotency: completed articles are skipped, embedding-only rows do not rerun
  the full analysis, and reruns safely resume incomplete work.
- After implementation, verify the live schema with a read-only query when credentials
  and network access permit. If the migration cannot be applied from this environment,
  clearly mark the Dashboard SQL step as required before runtime testing.
- Update `supabase/verify.sql` with read-only checks for the vector extension, 1536
  dimensions, embedding column, IVFFlat cosine index, RLS, and grants.

## AI generation and validation requirements

- Keep all AI code server-only and use the Vercel AI SDK plus `@ai-sdk/openai`.
- Before authoring calls, inspect the installed version-matched docs in
  `node_modules/ai/docs`, `node_modules/ai/src`, and the OpenAI provider package.
- Use `generateText` with the currently supported structured output API (expected to be
  `Output.object` for the current SDK), backed by a strict Zod schema.
- The model output schema must include:
  - `summary`: concise neutral summary, non-empty.
  - `sentimentScore`: number from -1 to 1.
  - `sentimentLabel`: `positive`, `neutral`, or `negative`.
  - `politicalFramingLabel`: `left`, `center`, `right`, `mixed`, or `unclear`.
  - `leftPercentage`, `centerPercentage`, `rightPercentage`: integers from 0 to 100,
    summing exactly to 100.
  - `confidence`: number from 0 to 1.
  - `framingNotes`: non-empty article-text-grounded explanation.
  - `loadedTerms`: bounded array of non-empty terms actually present or clearly grounded
    in the article text.
  - `disclaimer`: non-empty statement that the framing is AI-estimated and may be wrong.
- Add cross-field Zod validation for the exact percentage total, label/distribution
  relationship, and sentiment label/score coherence. The strongest framing percentage
  should normally determine the label. Permit `mixed` or `unclear` when the top two are
  within 10 points or confidence/evidence is low.
- Prompt the model to use article text evidence only and never infer framing from the
  source name. Political framing is an estimate, not objective truth.
- Bound article input size in one documented constant so requests cannot grow without
  limit, while retaining enough text for meaningful analysis.
- Retry the structured generation once on invalid output/provider failure, then record
  the article as failed without saving bad analysis.
- Generate embeddings with the SDK's current `embed` API and the direct OpenAI embedding
  model factory confirmed by installed docs. Validate the returned vector length and
  finite numeric values before persistence.
- Do not enable request/response telemetry that records full article bodies. Do not log
  prompts, raw article text, model raw responses, embeddings, API keys, or provider
  headers.

## Pipeline and API requirements

- Create typed request, work-item, per-batch, final-summary, and response contracts.
- The request body is a strict JSON object with optional `articleIds` and optional
  positive integer `limit`. Bound array length, string length, and maximum limit.
- `POST /api/analyze` must authenticate `x-biasly-admin-secret` before reading/parsing the
  body or starting database/model work. Missing or invalid credentials return `401`.
- A missing `BIASLY_ADMIN_SECRET` or `OPENAI_API_KEY` configuration returns a generic
  server error without exposing secrets or internal stack traces.
- Reject invalid JSON or invalid request fields with `400` and concise Zod issues.
- Use the Node.js runtime and an appropriate `maxDuration`, following the existing scrape
  route pattern and installed Next.js 16 documentation.
- For each pending-analysis article: generate and validate analysis, derive bias score,
  generate and validate embedding, save the complete analysis row, then update
  `articles.analyzed_at`.
- For each pending-embedding article: do not rerun full analysis; generate and persist
  only the embedding, then update `articles.analyzed_at`.
- For completion-repair items: update only `analyzed_at` after confirming analysis and
  embedding completeness.
- Process in configurable batches, with controlled concurrency appropriate for provider
  rate limits. A failure for one article must not abort unrelated work.
- Emit concise console progress for analysis start, batch start/completion, analyzed,
  embedded, skipped, failed, and final completion. Also write best-effort structured rows
  to `logs` without allowing a log write failure to fail the article pipeline.
- The final summary must include status, batches processed, analyzed count, embedded
  count, completion timestamps repaired, skipped count, failed count, total duration,
  and failure reasons grouped by count. Do not include secret values, raw text, raw model
  responses, or embedding vectors.
- Return `completed` when all attempted work succeeds, `partial` when some items fail,
  and a safe `500` only for fatal setup/query failures that prevent useful processing.

## Environment and dependency requirements

- Install `ai` and `@ai-sdk/openai` with the repository's npm package manager and update
  the lockfile. Do not add unrelated packages.
- After installation, compare the installed AI SDK major version with current official
  documentation and use only the installed version's APIs.
- Create `.env.example` with the full canonical variable set from `AGENTS.md`, using
  empty/placeholding values only. Include `OPENAI_API_KEY`, `BIASLY_ADMIN_SECRET`, and
  optional `ANALYSIS_BATCH_SIZE=5`. Never copy values from `.env.local`.
- Keep `.env.example`, `AGENTS.md`'s environment table, and README setup instructions in
  sync. No new environment variable is needed solely for the model ID unless a concrete
  implementation constraint makes it necessary and it is added to all three places.

## Security requirements

- Never expose `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or
  `BIASLY_ADMIN_SECRET` to client code, response payloads, or logs.
- Import server-only guards in AI, analysis orchestration, and privileged Supabase query
  modules.
- Use the service-role client only in server-only modules. Do not weaken RLS or grant
  analysis mutations to `anon`/`authenticated`.
- Preserve RLS on every public table and the existing public read policy semantics.
- Do not add a `SECURITY DEFINER` function to bypass RLS. The existing server-only
  service-role client is the intended privileged path.
- Validate request bodies before using IDs or limits in queries.
- Treat article contents and model output as untrusted data. Store only validated,
  bounded structured values.
- Avoid echoing upstream provider/database errors to clients. Keep detailed reasons in
  safe server logs without including secrets or article bodies.

## Acceptance criteria

- `POST /api/analyze` is the only manual analysis action endpoint and accepts only POST.
- The endpoint requires a valid `x-biasly-admin-secret` and rejects unauthorized calls
  before request-body/model/database processing.
- With `{}`, the pipeline processes all pending valid articles in batches until no
  pending work remains.
- Optional selected article IDs and an optional total limit are respected.
- Pending analysis is based on a left relationship query and a missing analysis row, not
  on `analyzed_at` alone.
- Existing complete analyses with null embeddings receive embeddings without rerunning
  full analysis.
- Analysis output passes strict Zod validation and database constraints; percentages are
  integer 0-100 values totaling 100 and `bias_score` is derived exactly in code.
- Invalid generation is retried once, then counted/logged as a failure without saving bad
  data.
- Embeddings use `text-embedding-3-small`, contain exactly 1536 finite numbers, and are
  stored in `article_analyses.embedding`.
- `analyzed_at` is set only after both complete analysis data and a valid embedding are
  persisted. Inconsistent completion timestamps can be repaired idempotently.
- Per-item failures do not stop remaining work, and full runs cannot loop indefinitely
  on a failed row.
- Console and Supabase logs report concise progress and a typed final summary without
  sensitive/raw content.
- The vector schema/index, TypeScript database types, verification SQL, `.env.example`,
  README, package manifest, and lockfile are consistent.
- Existing scrape, public feed, details UI, auth, and unrelated code continue to work.
- No related-article query or UI is added in this change.

## Checks to run

Run from the project root and report the exact outcome:

```powershell
npm run typecheck
npm run lint
npm run build
```

Also run targeted read-only Supabase verification after the pgvector SQL is applied:

1. Run `supabase/verify.sql` in Supabase Dashboard -> SQL Editor and confirm its first
   security query returns zero rows and the vector checks pass.
2. Query a small sample joining `articles` to `article_analyses` and confirm completed
   rows have non-null 1536-dimension embeddings and `analyzed_at`.
3. Confirm no operational table or mutation privilege was granted to client roles.

If dependencies need network access, request approval for the npm install rather than
claiming the checks were run.

## Exact manual test steps expected after implementation

1. Apply the reviewed pgvector migration/SQL in Supabase Dashboard -> SQL Editor after
   enabling the Vector extension. Run `supabase/verify.sql`.
2. Copy `.env.example` to `.env.local` if needed and set valid server-only
   `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `BIASLY_ADMIN_SECRET` values plus
   the existing public Supabase variables. Optionally set `ANALYSIS_BATCH_SIZE=5`.
3. Ensure Supabase contains at least one valid article without an analysis row. Optionally
   prepare another valid analysis row with `embedding is null` to test backfill.
4. Start the app and watch the terminal for progress and final summary logs:

   ```powershell
   npm run dev
   ```

5. In another PowerShell window, set the same admin secret for the curl examples:

   ```powershell
   $env:BIASLY_ADMIN_SECRET = "<same value as .env.local>"
   ```

6. Verify unauthorized access is rejected:

   ```powershell
   curl.exe -i -X POST "http://localhost:3000/api/analyze" `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: wrong-secret" `
     -d "{}"
   ```

   Expect HTTP `401` and no analysis work.

7. Process all pending work:

   ```powershell
   curl.exe -X POST "http://localhost:3000/api/analyze" `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
     -d "{}"
   ```

8. Test an explicit overall limit:

   ```powershell
   curl.exe -X POST "http://localhost:3000/api/analyze" `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
     -d '{"limit":1}'
   ```

9. Test selected article IDs using real pending UUIDs from Supabase:

   ```powershell
   curl.exe -X POST "http://localhost:3000/api/analyze" `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
     -d '{"articleIds":["ARTICLE_UUID"]}'
   ```

10. In Supabase SQL Editor, confirm for processed rows that the analysis fields are
    populated, framing percentages total 100, `bias_score` equals
    `(right_percentage - left_percentage) / 100`, `embedding` is non-null with 1536
    dimensions, and `articles.analyzed_at` is non-null.
11. Run the `{}` request again. Confirm it is idempotent: completed rows are not analyzed
    or embedded again and the summary reports no remaining work.
12. For the embedding-only case, confirm the existing analysis text/model fields did not
    change while the embedding and completion timestamp were filled.
