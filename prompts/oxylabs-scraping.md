# Oxylabs manual scraping pipeline

## Goal

Implement the production-style manual scrape-to-insert pipeline for biasly. Add a
server-only `POST /api/scrape` action that loads active source homepages from
Supabase, fetches homepage and article HTML through the Oxylabs Web Scraper API,
extracts only credible article-card links, rejects non-article URLs before detail
fetching, validates and cleans article pages, inserts only new valid articles, and
returns the canonical run summary described in `AGENTS.md`.

This prompt covers manual scraping only. Do not implement Oxylabs Scheduler,
scheduled-result processing, Vercel Cron, AI analysis, embeddings, or UI changes in
this phase.

## Skills and documentation read

- `AGENTS.md`
- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/web-scraper-api/SKILL.md` (the Oxylabs Web Scraper API skill named
  by the user)
- Next.js 16.3.4 bundled documentation:
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
  - `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`
- Current Supabase changelog and official JavaScript `select` / `insert`
  documentation. No current breaking change changes the existing server-side
  service-role query approach used by this pipeline.
- Current official Oxylabs Realtime and Universal Source documentation. Use
  `POST https://realtime.oxylabs.io/v1/queries` with Basic authentication and a
  `source: "universal"` payload; read HTML from `results[0].content`. JavaScript
  rendering may be requested with `render: "html"` and requires a long client
  timeout.

## Existing code inspected

- `package.json` and `package-lock.json`
- `.env.local` presence and the checked-in environment-variable conventions
- `lib/supabase/admin.ts`
- `lib/supabase/env.ts`
- `lib/supabase/types.ts`
- `lib/supabase/queries/sources.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/queries/logs.ts`
- `lib/supabase/queries/oxylabs.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260909000000_initial_schema.sql`
- `supabase/verify.sql`
- `README.md`
- Existing `app/` route structure and repository file inventory

The existing data layer already provides active-source lookup, chunked URL
existence checks with at most 15 values per `.in()` filter, append-only article
insertion, and operational log insertion. There is currently no API route or
scraping/parsing layer. `cheerio` and `zod` are not currently installed.

The configured Supabase project was queried read-only while preparing this prompt.
It currently has zero active rows in `sources`, so there are no source names to
list. The endpoint must handle that state cleanly without making Oxylabs calls.

## Decisions and assumptions

- Implement only the manual scrape pipeline from AGENTS sections 8–17.
- With no source selection in the request, use every active source and a default
  limit of 5 successfully inserted valid articles per source.
- Accept optional `sourceIds` or `sourceNames` plus `limitPerSource`; do not accept
  both selection modes in one request. Normalize and deduplicate selection values.
- Validate the request with Zod. Use a small, explicit maximum per-source limit to
  prevent an accidental unbounded scrape; centralize the default and maximum.
- If explicit source IDs/names are unknown or inactive, return a clear `400`
  response rather than silently scraping a partial selection.
- If there are no selected active sources, return a successful no-op summary with
  a clear message and zero counts. Do not call Oxylabs.
- Use Oxylabs Realtime Universal Source for both homepage and detail fetches. Keep
  the client reusable by the later Scheduler phase, but do not add Scheduler code.
- Default to raw HTML without forced rendering. Allow a source's existing
  `parser_strategy` to opt into `render: "html"` for a homepage or detail page;
  use an abort timeout compatible with Oxylabs guidance and return typed errors.
- Treat `parser_strategy` as optional, untrusted JSON. Support a deliberately small
  typed selector configuration for story links, title, body, image, published date,
  canonical URL, excluded containers, rendering flags, and optional conservative
  URL allow/reject patterns. Invalid fields fall back safely or reject the source
  configuration with a source-level error; never execute code or arbitrary
  instructions from JSON.
- Generic extraction should use semantic article/card containers and article-body
  metadata/selectors. A source-specific strategy may narrow these selectors but
  must never supply or override the source homepage URL.
- Process sources deterministically and detail pages with bounded concurrency. Stop
  fetching more details for a source after its valid insertion limit is reached.
- Prefer fewer valid articles over broad link collection or permissive validation.
- No schema change is expected. Reuse the existing `sources`, `articles`, and
  `logs` schema and existing service-role client.

## Files likely to change

- `package.json`
- `package-lock.json`
- `.env.example`
- `README.md`
- `app/api/scrape/route.ts` (new, thin route handler)
- `lib/security/admin-secret.ts` (new server-only shared-header validation helper,
  named or organized consistently with repository conventions)
- `lib/oxylabs/client.ts` (new server-only Realtime client)
- `lib/scraping/types.ts` (new typed request, parser, validation, and summary types)
- `lib/scraping/source-strategy.ts` (new safe parser-strategy normalization)
- `lib/scraping/url.ts` (new URL normalization and source-specific candidate gate)
- `lib/scraping/homepage-parser.ts` (new visible story-card extraction)
- `lib/scraping/article-parser.ts` (new article metadata/body extraction and cleanup)
- `lib/scraping/pipeline.ts` (new orchestration and run logging)
- `lib/supabase/queries/sources.ts`, `articles.ts`, or `logs.ts` only where small,
  reusable query additions are genuinely required

Do not change pages, components, Clerk authentication, scheduler tables/routes,
analysis code, pgvector code, or unrelated styling.

## Implementation requirements

### Dependencies and environment

- Add `cheerio` for server-side HTML parsing and `zod` for request/config validation,
  using normal npm installation so the lockfile is updated.
- Add only these missing server-only variables to `.env.example` if absent:
  `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, and `BIASLY_ADMIN_SECRET`.
- Keep the canonical environment-variable documentation in `AGENTS.md` and
  `.env.example` consistent; do not place real values in tracked files.
- Do not add a public Oxylabs, Supabase service-role, or admin-secret variable.

### API contract and authorization

- Create only `POST /api/scrape`; do not add `GET` to the action route.
- Authenticate `x-biasly-admin-secret` before reading the body or starting work.
  Compare against server-only `BIASLY_ADMIN_SECRET` without leaking either value.
- Return `401` for missing/invalid admin secret, `400` for malformed input or an
  invalid explicit source selection, `200` for completed/no-op runs, and a suitable
  `5xx` response only for a run-level failure.
- Keep the route handler thin: authorize, parse JSON, validate, call the pipeline,
  and serialize the typed result.
- Supported JSON body:
  - `sourceIds?: string[]`
  - `sourceNames?: string[]`
  - `limitPerSource?: number`
- An absent or empty body means all active sources and the default limit.

### Oxylabs client

- Keep the module server-only and use `OXY_WSA_USERNAME` / `OXY_WSA_PASSWORD` for
  HTTP Basic authentication.
- POST JSON to `https://realtime.oxylabs.io/v1/queries` with
  `{ source: "universal", url, ...safeOptions }`.
- Validate the HTTP response and response shape. Accept only a successful result
  with string HTML content and an acceptable target status code.
- Apply an abort timeout, distinguish timeout, authentication, rate-limit, target,
  invalid-response, and transport failures, and never log response bodies or
  credentials on error.
- Do not use Oxylabs parsed output, Push-Pull jobs, Scheduler endpoints, callbacks,
  or direct target-site `fetch` calls in this phase.

### Source selection

- Load sources only with the existing server-side Supabase helpers.
- Never hardcode a publisher name or homepage URL.
- Never derive or crawl source sub-endpoints as listing pages. Every homepage fetch
  must use exactly the selected source's stored `listing_url`.
- Include selected source names in the start log and console progress.

### Homepage candidate extraction

- Parse the Oxylabs homepage HTML with Cheerio.
- Remove/ignore hidden nodes and common non-content containers (`nav`, `footer`,
  menus, search, subscription/newsletter, related/promotional areas) before link
  extraction.
- Prefer anchors inside visible semantic `article` elements and common story/card
  containers; allow `parser_strategy` selectors to narrow extraction.
- Resolve relative URLs against `listing_url`; accept only HTTP(S) URLs on the same
  publisher host (including the intended `www`/apex equivalent), strip fragments,
  remove known tracking parameters, normalize trailing syntax conservatively, and
  deduplicate while preserving homepage order.
- Reject the canonical non-article list before detail scraping: category/section,
  topic/tag, author, search, navigation/footer, show/program/podcast, live, game,
  product/review/shopping, corporate/support, newsletter/subscription, and
  video-only paths unless later content validation can establish a full article.
- Require an article-like source-specific URL shape. Prefer IDs, date paths, long
  story slugs, and clear news/story structures. If uncertain, reject.
- Record candidate rejection reason counts.

### Dedupe and detail scraping

- Before detail requests, call the existing `findExistingArticleUrls` helper so no
  `.in()` filter receives more than 15 URLs.
- Check both normalized original and canonical URLs. Preserve append-only behavior.
- Skip existing URLs before spending an Oxylabs detail request.
- Bound detail-page concurrency and isolate individual failures so one article or
  source does not necessarily abort the full run.

### Article parsing, cleanup, and content gate

- Extract an article-specific title, canonical URL, image URL, published date, and
  article body using safe source-specific selectors first, then common semantic and
  metadata fallbacks (`article`, JSON-LD, Open Graph, standard time/meta fields).
- Treat JSON-LD as untrusted input. Parse defensively and accept only article-like
  objects and scalar fields of the expected type.
- Resolve canonical/image URLs, but reject canonical URLs that fail the same
  publisher/article URL gate. Use the fetched normalized URL as `original_url`.
- Remove scripts, styles, templates, forms, ads, sponsor blocks, newsletter and
  subscription blocks, related/most-viewed/load-more content, share controls,
  captions/bios when unrelated, repeated navigation labels, inline JavaScript
  errors, and CSS-like dumps before producing `raw_text`.
- Extract meaningful DOM blocks. If extraction produces one large block, split it
  at useful block or sentence boundaries before validation/storage.
- Normalize whitespace and repeated paragraphs while preserving readable paragraph
  breaks. Do not save a full-page dump.
- Require all of: article-specific URL, non-generic article title, one clear subject,
  meaningful body, source ID, parseable published date, and image URL.
- Body quality passes with either at least 3 meaningful paragraphs or at least 900
  meaningful cleaned characters plus the other required article signals.
- Reject missing/invalid dates, missing images, generic titles, mixed headline
  lists, navigation/CSS/script-heavy bodies, listing/program/product canonical URLs,
  or pages without a clear article subject.
- Recheck dedupe with original and canonical URL immediately before insert to reduce
  race-window duplicates. Treat a unique-constraint conflict as a duplicate skip,
  not a failed article.
- Insert through the existing service-role `insertArticle` helper with
  `analyzed_at` left null.

### Logging and result summary

- Emit concise structured `console` messages for: run start, selected sources,
  per-source start, homepage fetched, candidates found/rejected, duplicates skipped,
  detail pages scraped, inserted/rejected/failed articles, source errors, and final
  completion/failure.
- Persist useful operational events through `createLog`; logging failure should be
  surfaced in console but must not corrupt an otherwise valid article insert.
- Never log credentials, admin headers, full HTML, or complete article bodies.
- Return one typed final summary containing exactly the canonical measures:
  `status`, `sourcesChecked`, `candidatesFound`, `candidatesRejected`,
  `duplicatesSkipped`, `detailPagesScraped`, `articlesInserted`,
  `articlesRejected`, `articlesFailed`, `totalDurationMs`, and
  `rejectionReasons` grouped by count. A source-level error may produce a partial
  status while other sources continue.

## Security requirements

- All Oxylabs calls, parsing, pipeline orchestration, Supabase service-role queries,
  and secret access remain in modules guarded by `server-only` and are never
  imported by Client Components.
- Only use source URLs selected from active Supabase rows. Do not accept arbitrary
  target URLs from the request body.
- Validate protocols and publisher host boundaries before every Oxylabs request to
  avoid turning the endpoint into a general SSRF/scraping proxy.
- Reject credentials embedded in URLs, localhost, IP-literal hosts, non-HTTP(S)
  schemes, and redirects/results that escape the selected publisher host.
- Bound input arrays, per-source limits, candidate counts, HTML size considered by
  parsers, request duration, and detail concurrency.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, and
  `BIASLY_ADMIN_SECRET` server-only. Do not return internal error stacks or upstream
  response bodies to callers.
- Preserve existing RLS and public-read behavior. No Supabase schema or policy
  change is authorized by this prompt.

## Acceptance criteria

- `POST /api/scrape` rejects missing/wrong admin secrets with `401` and accepts a
  valid server-side secret header.
- An empty request uses all active sources and defaults to at most 5 valid inserts
  per source; explicit selection and limit are validated and respected.
- With the current zero-active-source database state, the endpoint returns a clean
  zero-count no-op summary and performs no Oxylabs request.
- Homepage URLs come only from active Supabase source records.
- Candidate extraction is limited to credible visible story links and rejects the
  canonical non-article page types before detail scraping.
- Existing URLs are skipped before detail scraping using chunk sizes of 15 or less.
- Only pages with a valid article URL/title, image, published date, and meaningful
  cleaned body are inserted.
- Scraping is append-only, duplicate-safe, bounded, and tolerant of isolated
  source/article failures.
- Server console output and Supabase logs provide the required progress events, and
  the API response includes the complete canonical summary.
- No secret, full HTML, raw article body, or arbitrary target URL is exposed to the
  browser or logs.
- Scheduler, cron, analysis, embeddings, and UI behavior remain unchanged.

## Checks to run after implementation

Run from the repository root and report exact output:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`

Also inspect `git diff --check` and the final diff for accidental secret exposure or
unrelated changes. Do not claim checks passed unless they were run.

## Exact manual test steps expected after implementation

1. Ensure `.env.local` contains valid server-only `OXY_WSA_USERNAME`,
   `OXY_WSA_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, and `BIASLY_ADMIN_SECRET`, plus
   the existing public Supabase variables. Never paste their values into source.
2. Start the app with `npm run dev` and watch that terminal for scrape progress and
   the final summary.
3. Test authorization failure:

   ```powershell
   curl.exe -i -X POST "http://localhost:3000/api/scrape" `
     -H "Content-Type: application/json" `
     -d "{}"
   ```

   Expect `401` and no Oxylabs/Supabase work.
4. Test the current empty active-source state:

   ```powershell
   curl.exe -i -X POST "http://localhost:3000/api/scrape" `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
     -d "{}"
   ```

   Expect `200`, a clear no-active-sources message, and zero summary counts.
5. In Supabase Dashboard, add/configure at least one real active `sources` row with
   its publisher homepage in `listing_url` and an optional safe `parser_strategy`.
   Re-run the read-only active-source query or `GET /rest/v1/sources` to confirm the
   exact available source name before scraping.
6. Test all active sources with the default limit:

   ```powershell
   curl.exe -i -X POST "http://localhost:3000/api/scrape" `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
     -d "{}"
   ```

7. Test one selected source and a small limit, replacing `SOURCE_NAME` with the
   exact active name from Supabase:

   ```powershell
   curl.exe -i -X POST "http://localhost:3000/api/scrape" `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: $env:BIASLY_ADMIN_SECRET" `
     -d '{"sourceNames":["SOURCE_NAME"],"limitPerSource":2}'
   ```

8. Confirm the server terminal shows source start, homepage fetch, candidate,
   duplicate, detail, insert/reject/failure, duration, and rejection-reason counts
   without secrets or page bodies.
9. Inspect Supabase `articles`: every inserted row must have the selected source ID,
   unique original URL, article-like canonical URL if present, non-generic title,
   non-empty image URL, published date, readable article-only `raw_text`, and null
   `analyzed_at`.
10. Run the same request again. Expect previously stored URLs to be counted as
    duplicates, no duplicate inserts, and no deletion/replacement of old articles.
11. Inspect Supabase `logs` for concise operational records and confirm no HTML,
    full article text, credentials, or admin-secret values were stored.
