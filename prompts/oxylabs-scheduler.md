# Oxylabs Scheduler and Vercel Cron Automatic Hourly Pipeline

## Goal

Implement the complete, production-grade Oxylabs Scheduler and Vercel Cron automatic hourly pipeline for biasly according to `AGENTS.md` Section 18. This enables automated recurring homepage scraping via Oxylabs Scheduler, processing of completed scheduled job results through the canonical scrape-to-insert pipeline, and automatic chaining of AI analysis with pgvector embeddings.

The deliverable includes all parts specified in `AGENTS.md`:
1. Oxylabs Scheduler client integration with 64-bit large integer precision handling.
2. Schedule sync route (`POST /api/oxylabs/schedules`) with orphan schedule deactivation.
3. Schedule list route (`GET /api/oxylabs/schedules`).
4. Scheduled results manual process route (`POST /api/oxylabs/scheduled-results/process`).
5. Scheduled runs status route (`GET /api/oxylabs/runs`).
6. Vercel Cron configuration (`vercel.json`) running at `:15` past every hour (`15 * * * *`).
7. Cron pipeline route (`GET /api/cron/pipeline`) protected by `CRON_SECRET`, executing scheduled result processing followed unconditionally by AI analysis and embedding generation.
8. Shared scrape-to-insert pipeline refactoring to ensure identical validation, cleanup, dedupe, URL existence checks, and structured logging across manual and scheduled runs.

## Skills and Documentation Read

- `AGENTS.md` (specifically Sections 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22)
- `.agents/skills/web-scraper-api/SKILL.md` (Oxylabs Web Scraper API authentication, parameters, and endpoints)
- `.agents/skills/supabase/SKILL.md` (Supabase security, RLS, service role usage, and query patterns)
- Live Oxylabs Scheduler Documentation fetched directly from `https://developers.oxylabs.io/products/web-scraper-api/features/scheduler.md`:
  - Schedule Creation: `POST https://data.oxylabs.io/v1/schedules`
  - Schedules List: `GET https://data.oxylabs.io/v1/schedules`
  - Schedule Runs: `GET https://data.oxylabs.io/v1/schedules/{id}/runs`
  - Schedule State: `PUT https://data.oxylabs.io/v1/schedules/{id}/state`
  - Job Result Content: `GET https://data.oxylabs.io/v1/queries/{id}/results`
- Next.js bundled documentation (`node_modules/next/dist/docs/`):
  - Route Handlers and Server-only execution (`01-app/01-getting-started/15-route-handlers.md`, `01-app/03-api-reference/03-file-conventions/route.md`)

## Existing Code Inspected

- Active sources in Supabase verified via `GET /api/sources`:
  - BBC News (`https://www.bbc.com/news`)
  - Fox News (`https://www.foxnews.com/`)
  - NPR (`https://www.npr.org/`)
  - Reuters (`https://www.reuters.com/`)
  - The Guardian (`https://www.theguardian.com/us`)
- Database Schema and Types:
  - `supabase/schema.sql` lines 90–126: `oxylabs_schedules` and `oxylabs_schedule_runs` tables already exist with appropriate constraints, RLS policies, and service_role grants.
  - `lib/supabase/types.ts`: TypeScript definitions for `OxylabsSchedule`, `OxylabsScheduleRun`, `TablesInsert`, `TablesUpdate`.
  - `lib/supabase/queries/oxylabs.ts`: Existing helpers `listOxylabsSchedules`, `upsertOxylabsSchedule`, `updateOxylabsSchedule`, `upsertOxylabsScheduleRun`, `updateOxylabsScheduleRun`, `listOxylabsScheduleRuns`.
- Scraping and Pipeline Layer:
  - `lib/oxylabs/client.ts`: Oxylabs HTTP basic auth and `fetchHtmlThroughOxylabs`.
  - `lib/scraping/pipeline.ts`: Canonical scrape-to-insert pipeline (`processSource`, `extractHomepageCandidates`, `findExistingArticleUrls`, `parseArticlePage`, `insertArticle`).
  - `lib/scraping/source-strategy.ts`: Parser strategy parsing for homepage rendering and custom selectors.
- AI Analysis Pipeline:
  - `lib/analysis/pipeline.ts`: `runArticleAnalysis` with batching, embedding generation, and status logging.
- Security and Routing:
  - `lib/security/admin-secret.ts`: `hasValidAdminSecret` validating `x-biasly-admin-secret` against `BIASLY_ADMIN_SECRET`.
  - `app/api/scrape/route.ts` and `app/api/analyze/route.ts`: Existing POST action routes.

## Decisions and Assumptions

1. **Active Sources Scope**:
   - By default, manage schedules for all active sources in Supabase (BBC News, Fox News, NPR, Reuters, The Guardian).
   - Default per-source article limit is 5, consistent with manual scraping and Section 8.
2. **Large Integer Precision Handling**:
   - In JavaScript, `Number.MAX_SAFE_INTEGER` is `9007199254740991` (16 digits). Oxylabs `schedule_id` and job `id` values are 19-digit 64-bit integers (e.g., `4134906379157007223` or `7300439540206948353`).
   - Standard `JSON.parse` mutates the least significant digits.
   - All Oxylabs HTTP responses containing IDs will have large numerical IDs converted to strings in the raw response text before parsing (e.g., regex rewriting `/"(id|schedule_id|run_id)"\s*:\s*(\d{10,})/g` -> `'"$1": "$2"'`, and string extraction on `schedules` arrays).
3. **Use `/runs` Rather than `/jobs`**:
   - Query `GET /v1/schedules/{id}/runs` to inspect execution status per job.
   - Only jobs with `result_status === "done"` will be fetched and processed. Pending and faulted jobs are skipped or tracked without content fetch.
4. **Orphan Schedule Deactivation**:
   - After syncing schedules, list all active remote schedules on Oxylabs via `GET /v1/schedules`.
   - Any remote schedule ID not in the Supabase `oxylabs_schedules` table is deactivated via `PUT /v1/schedules/{id}/state` with `{"active": false}`.
5. **Shared Scrape-to-Insert Core**:
   - Refactor `lib/scraping/pipeline.ts` to export a shared core function `processHomepageHtmlAndArticles(source, homepageHtml, limitPerSource, summary, options)` used by both manual scraping and scheduled results processing.
   - Guarantee exact parity: visible card candidate filtering, non-article reject list, chunked URL existence check (<= 15 URLs), detail page validation, canonical URL dedupe, append-only insertion, and structured logging.
6. **Hourly Cron & Execution Flow**:
   - Oxylabs schedules run at `:00` past every hour (`cron: "0 * * * *"`).
   - Vercel Cron triggers at `:15` past every hour (`schedule: "15 * * * *"`).
   - Step 1: Process scheduled results for active sources.
   - Step 2: Run AI analysis (`runArticleAnalysis({})`) on all pending articles/embeddings.
   - Unconditional execution: Step 2 always runs even if Step 1 fails.
7. **Security & Secrets**:
   - `POST /api/oxylabs/schedules` and `POST /api/oxylabs/scheduled-results/process` require `x-biasly-admin-secret` header matching `BIASLY_ADMIN_SECRET`.
   - `GET /api/cron/pipeline` requires `Authorization: Bearer <CRON_SECRET>` or `CRON_SECRET` matching in production; in local development (`NODE_ENV === "development"` or unconfigured `CRON_SECRET`), the check is skipped for manual testing.
   - `GET /api/oxylabs/schedules` and `GET /api/oxylabs/runs` provide read-only status and require admin secret verification to prevent leaking pipeline telemetry.

## Files Likely to Change

### New Files
- `lib/oxylabs/scheduler.ts`: Oxylabs Scheduler API client with safe 64-bit integer parsing, run fetching, content fetching, and orphan deactivation.
- `lib/scheduler/pipeline.ts`: Scheduled results processing orchestration and automatic hourly cron pipeline.
- `app/api/oxylabs/schedules/route.ts`: `POST` (sync schedules) and `GET` (list schedules).
- `app/api/oxylabs/scheduled-results/process/route.ts`: `POST` (manual scheduled results processing).
- `app/api/oxylabs/runs/route.ts`: `GET` (list schedule runs telemetry).
- `app/api/cron/pipeline/route.ts`: `GET` (Vercel Cron endpoint chaining scrape processing and AI analysis).
- `vercel.json`: Vercel Cron configuration.
- `.env.example`: Updated environment variables documentation including `CRON_SECRET`.

### Modified Files
- `lib/scraping/pipeline.ts`: Export reusable `processHomepageHtmlAndArticles` logic used by both manual and scheduler runs.
- `lib/supabase/queries/oxylabs.ts`: Add `listAllOxylabsScheduleRuns` and helper lookups if needed.

## Implementation Requirements

### 1. Oxylabs Scheduler Client (`lib/oxylabs/scheduler.ts`)
- Implement HTTP Basic Auth using `OXY_WSA_USERNAME` and `OXY_WSA_PASSWORD`.
- `createRemoteSchedule({ url, render }): Promise<{ scheduleId: string }>`:
  - POST to `https://data.oxylabs.io/v1/schedules`.
  - Body: `{ cron: "0 * * * *", items: [{ source: "universal", url, ...(render ? { render: "html" } : {}) }], end_time: "2035-12-31 23:59:59" }`.
  - Extract `schedule_id` as string from raw response text before `JSON.parse`.
- `listRemoteScheduleIds(): Promise<string[]>`:
  - GET to `https://data.oxylabs.io/v1/schedules`.
  - Parse array of numeric schedule IDs into string array via regex/string extraction on raw text.
- `deactivateRemoteSchedule(scheduleId: string): Promise<void>`:
  - PUT to `https://data.oxylabs.io/v1/schedules/${scheduleId}/state` with `{ "active": false }`.
- `getRemoteScheduleRuns(scheduleId: string): Promise<OxylabsRun[]>`:
  - GET to `https://data.oxylabs.io/v1/schedules/${scheduleId}/runs`.
  - Preprocess raw text to quote `id`, `run_id`, `schedule_id` numbers before `JSON.parse`.
  - Return typed run objects with `run_id` (string), `jobs` (array of jobs with string `id`, `result_status`, `created_at`, `result_created_at`).
- `fetchRemoteJobContent(jobId: string): Promise<string>`:
  - GET to `https://data.oxylabs.io/v1/queries/${jobId}/results?type=raw`.
  - Return raw HTML string from `results[0].content`.
  - Validate response status, length, and non-empty content.

### 2. Schedule Sync & Deactivation (`app/api/oxylabs/schedules/route.ts`)
- **POST**:
  - Authenticate using `hasValidAdminSecret`.
  - Load active sources from Supabase (`listActiveSources()`).
  - Load current DB schedules from `oxylabs_schedules`.
  - For each active source without an active schedule:
    - Create schedule on Oxylabs via `createRemoteSchedule`.
    - Upsert into `oxylabs_schedules` with `status: "active"`, `schedule_id`, `source_id`, `metadata`.
  - Orphan Deactivation:
    - Fetch all remote schedule IDs via `listRemoteScheduleIds()`.
    - Find IDs not present in Supabase `oxylabs_schedules`.
    - Deactivate each orphan schedule via `deactivateRemoteSchedule`.
  - Return summary: `{ synced: count, created: count, active: count, deactivatedOrphans: string[] }`.
- **GET**:
  - Authenticate using `hasValidAdminSecret`.
  - Return list of schedules from `listOxylabsSchedules()` joined with source metadata.

### 3. Scheduled Results Processing Pipeline (`lib/scheduler/pipeline.ts`)
- Orchestrate processing of completed Oxylabs runs:
  1. Fetch active schedules from `oxylabs_schedules` and active sources.
  2. For each schedule:
     - Fetch runs via `getRemoteScheduleRuns(schedule.schedule_id)`.
     - Filter jobs where `result_status === "done"`.
     - Check `oxylabs_schedule_runs` table: if job has already been processed (`processing_status === "processed"`), skip.
     - Record job in `oxylabs_schedule_runs` as `processing`.
     - Fetch completed job HTML via `fetchRemoteJobContent(job.id)`.
     - Run `processHomepageHtmlAndArticles` (candidate link extraction, non-article filtering, deduplication, URL existence check in batches <= 15, detail page scraping, validation, insertion).
     - Update `oxylabs_schedule_runs` with `processing_status: "processed"`, `summary`, and timestamp.
     - If error occurs during job processing, mark `processing_status: "failed"` with `error_message`.
     - Update `oxylabs_schedules.last_run_at`.
  3. Emit structured run logging and return overall summary object.

### 4. Scheduled Results Process Route (`app/api/oxylabs/scheduled-results/process/route.ts`)
- **POST**:
  - Authenticate using `hasValidAdminSecret`.
  - Parse optional JSON body (e.g. `{ limitPerSource?: number, sourceIds?: string[] }`).
  - Run scheduled results processing pipeline.
  - Return detailed scrape summary.

### 5. Schedule Runs Telemetry Route (`app/api/oxylabs/runs/route.ts`)
- **GET**:
  - Authenticate using `hasValidAdminSecret`.
  - Read query parameters (`scheduleRecordId`, `limit`).
  - Return list of run records from `oxylabs_schedule_runs`.

### 6. Vercel Cron & Pipeline Route (`app/api/cron/pipeline/route.ts` & `vercel.json`)
- **`vercel.json`**:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/pipeline",
        "schedule": "15 * * * *"
      }
    ]
  }
  ```
- **`GET /api/cron/pipeline`**:
  - Verify `CRON_SECRET`:
    - Check `Authorization: Bearer <CRON_SECRET>` or `CRON_SECRET` match.
    - In local development (`NODE_ENV === "development"` or when `CRON_SECRET` is unset locally), allow testing without header.
    - If unauthorized in production, return `401 Unauthorized`.
  - Step 1: Execute `processScheduledResults()`. Log outcome.
  - Step 2: Unconditionally execute `runArticleAnalysis({})` to analyze and embed all pending articles. Log outcome.
  - Return `{ success: true, timestamp, scraping: scrapeSummary, analysis: analysisSummary }`.

## Security Requirements

- All action endpoints (`POST /api/oxylabs/schedules`, `POST /api/oxylabs/scheduled-results/process`) and telemetry routes (`GET /api/oxylabs/schedules`, `GET /api/oxylabs/runs`) must validate `x-biasly-admin-secret` using timing-safe comparison.
- `GET /api/cron/pipeline` must authenticate requests using `CRON_SECRET` and reject unauthorized requests with `401`.
- Oxylabs credentials (`OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`), `BIASLY_ADMIN_SECRET`, `CRON_SECRET`, and Supabase service role keys must never be exposed to browser code or logged in plain text.
- No scraper or scheduler code may run on client components.

## Acceptance Criteria

1. Syncing schedules creates 1 Oxylabs schedule per active source with cron `"0 * * * *"` and stores it in Supabase `oxylabs_schedules`.
2. Any remote Oxylabs schedules not in Supabase are deactivated.
3. 64-bit integer IDs (`schedule_id`, `job_id`, `run_id`) are preserved accurately without JavaScript numerical precision loss.
4. Process route fetches completed job HTML for `result_status === "done"`, parses candidates, and inserts valid articles without duplicates.
5. The Vercel Cron configuration (`vercel.json`) is set to `"15 * * * *"`.
6. Calling `/api/cron/pipeline` runs scheduled result processing followed by AI analysis and embedding generation.
7. If step 1 (scraping) encounters errors or zero results, step 2 (analysis) still runs.
8. TypeScript checks (`npm run typecheck`) and ESLint (`npm run lint`) pass with 0 errors.

## Checks to Run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Exact Manual Test Steps

1. Start dev server:
   ```bash
   npm run dev
   ```
2. Verify active sources:
   ```bash
   curl -s http://localhost:3000/api/sources
   ```
3. Sync schedules and deactivate orphans:
   ```bash
   curl -s -X POST http://localhost:3000/api/oxylabs/schedules \
     -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET"
   ```
4. Verify created schedules in database:
   ```bash
   curl -s http://localhost:3000/api/oxylabs/schedules \
     -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET"
   ```
5. Trigger scheduled results processing manually:
   ```bash
   curl -s -X POST http://localhost:3000/api/oxylabs/scheduled-results/process \
     -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"limitPerSource": 2}'
   ```
6. Check scheduled runs telemetry:
   ```bash
   curl -s http://localhost:3000/api/oxylabs/runs \
     -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET"
   ```
7. Test the automated cron pipeline endpoint locally:
   ```bash
   curl -s http://localhost:3000/api/cron/pipeline
   ```
8. Watch dev server console for structured logs (`[scheduler]`, `[scrape]`, `[analysis]`).
