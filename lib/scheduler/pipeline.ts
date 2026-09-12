import "server-only";

import { runArticleAnalysis } from "@/lib/analysis/pipeline";
import type { AnalysisResult } from "@/lib/analysis/types";
import {
  createRemoteSchedule,
  deactivateRemoteSchedule,
  fetchRemoteJobContent,
  getRemoteScheduleRuns,
  listRemoteScheduleIds,
} from "@/lib/oxylabs/scheduler";
import { processHomepageHtmlAndArticles } from "@/lib/scraping/pipeline";
import { parseSourceStrategy } from "@/lib/scraping/source-strategy";
import {
  emptySummary,
  type ScrapeResult,
} from "@/lib/scraping/types";
import { createLog } from "@/lib/supabase/queries/logs";
import {
  getOxylabsScheduleRunByJobId,
  listOxylabsSchedules,
  updateOxylabsSchedule,
  upsertOxylabsSchedule,
  upsertOxylabsScheduleRun,
} from "@/lib/supabase/queries/oxylabs";
import { listActiveSources } from "@/lib/supabase/queries/sources";
import type { Json, OxylabsSchedule, Source } from "@/lib/supabase/types";

const DEFAULT_SCHEDULED_LIMIT_PER_SOURCE = 5;

async function writeSchedulerLog(
  event: string,
  message: string,
  options: {
    context?: Record<string, Json>;
    level?: "debug" | "error" | "info" | "warn";
    sourceId?: string;
  } = {},
): Promise<void> {
  const context = options.context ?? {};
  const method =
    options.level === "error"
      ? console.error
      : options.level === "warn"
        ? console.warn
        : console.info;

  method(`[scheduler] ${event}`, { ...context, sourceId: options.sourceId });

  try {
    await createLog({
      event,
      message,
      level: options.level ?? "info",
      source_id: options.sourceId ?? null,
      context,
    });
  } catch (error) {
    console.warn("[scheduler] log_write_failed", {
      event,
      reason: error instanceof Error ? error.message : "Unknown logging failure",
    });
  }
}

export type SyncSchedulesResult = {
  activeCount: number;
  createdCount: number;
  deactivatedOrphans: string[];
  message: string;
  schedules: OxylabsSchedule[];
};

/**
 * Synchronizes Oxylabs schedules with active sources in Supabase.
 * Creates a schedule for any active source that doesn't have one, and
 * deactivates any orphan schedules on Oxylabs that are no longer in Supabase.
 */
export async function syncOxylabsSchedules(): Promise<SyncSchedulesResult> {
  await writeSchedulerLog("scheduler_sync_started", "Starting Oxylabs schedule sync.");

  const activeSources = await listActiveSources();
  const existingSchedules = await listOxylabsSchedules();
  const scheduleBySourceId = new Map(
    existingSchedules.map((schedule) => [schedule.source_id, schedule]),
  );

  let createdCount = 0;

  for (const source of activeSources) {
    const existing = scheduleBySourceId.get(source.id);
    if (!existing || existing.status !== "active") {
      let render = false;
      try {
        const strategy = parseSourceStrategy(source.parser_strategy);
        render = strategy.homepageRender;
      } catch {
        // Use default render
      }

      await writeSchedulerLog(
        "scheduler_create_schedule",
        `Creating Oxylabs schedule for ${source.name}.`,
        { sourceId: source.id },
      );

      const remote = await createRemoteSchedule({
        url: source.listing_url,
        render,
      });

      await upsertOxylabsSchedule({
        source_id: source.id,
        schedule_id: remote.scheduleId,
        status: "active",
        metadata: {
          sourceName: source.name,
          listingUrl: source.listing_url,
        },
      });

      createdCount += 1;
    }
  }

  // Reload schedules from Supabase after creation
  const updatedSchedules = await listOxylabsSchedules();
  const validScheduleIds = new Set(
    updatedSchedules.map((schedule) => schedule.schedule_id),
  );

  // Orphan schedule deactivation: check all remote schedules on Oxylabs
  const remoteScheduleIds = await listRemoteScheduleIds();
  const deactivatedOrphans: string[] = [];

  for (const remoteId of remoteScheduleIds) {
    if (!validScheduleIds.has(remoteId)) {
      await writeSchedulerLog(
        "scheduler_deactivate_orphan",
        `Deactivating orphan remote schedule ${remoteId}.`,
        { context: { scheduleId: remoteId } },
      );
      try {
        await deactivateRemoteSchedule(remoteId);
        deactivatedOrphans.push(remoteId);
      } catch (error) {
        console.warn(`[scheduler] Failed to deactivate orphan schedule ${remoteId}:`, error);
      }
    }
  }

  await writeSchedulerLog(
    "scheduler_sync_completed",
    `Completed schedule sync. Created: ${createdCount}, Deactivated orphans: ${deactivatedOrphans.length}.`,
    {
      context: {
        activeCount: updatedSchedules.length,
        createdCount,
        deactivatedOrphans,
      },
    },
  );

  return {
    message: "Schedules synchronized successfully.",
    activeCount: updatedSchedules.length,
    createdCount,
    deactivatedOrphans,
    schedules: updatedSchedules,
  };
}

/**
 * Processes completed scheduled results from Oxylabs runs.
 * Pulls completed HTML, runs through the shared candidate extraction, validation,
 * deduplication, and insertion pipeline, and updates run telemetry.
 */
export async function processScheduledResults(
  options: {
    limitPerSource?: number;
    sourceIds?: string[];
  } = {},
): Promise<ScrapeResult> {
  const startedAt = Date.now();
  const summary = emptySummary();
  const limitPerSource = options.limitPerSource ?? DEFAULT_SCHEDULED_LIMIT_PER_SOURCE;

  await writeSchedulerLog(
    "scheduled_process_started",
    "Started processing scheduled Oxylabs results.",
    { context: { limitPerSource, sourceIds: options.sourceIds ?? null } },
  );

  const allSources = await listActiveSources();
  const sourcesById = new Map<string, Source>(
    allSources.map((source) => [source.id, source]),
  );

  const schedules = await listOxylabsSchedules();
  const activeSchedules = schedules.filter((schedule) => {
    if (schedule.status !== "active") return false;
    if (options.sourceIds && options.sourceIds.length > 0) {
      return options.sourceIds.includes(schedule.source_id);
    }
    return sourcesById.has(schedule.source_id);
  });

  if (activeSchedules.length === 0) {
    summary.totalDurationMs = Date.now() - startedAt;
    summary.status = "completed";
    await writeSchedulerLog(
      "scheduled_process_completed",
      "No active schedules found to process.",
      { context: { summary } },
    );
    return {
      message: "No active schedules found to process.",
      summary,
    };
  }

  let partial = false;

  for (const schedule of activeSchedules) {
    const source = sourcesById.get(schedule.source_id);
    if (!source) continue;

    summary.sourcesChecked += 1;
    await writeSchedulerLog(
      "scheduled_check_runs",
      `Checking runs for ${source.name} (schedule ${schedule.schedule_id}).`,
      { sourceId: source.id },
    );

    let runs;
    try {
      runs = await getRemoteScheduleRuns(schedule.schedule_id);
    } catch (error) {
      partial = true;
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch runs";
      await writeSchedulerLog(
        "scheduled_fetch_runs_failed",
        `Failed to fetch runs for ${source.name}: ${errorMsg}`,
        { level: "warn", sourceId: source.id },
      );
      await updateOxylabsSchedule(schedule.id, { last_error: errorMsg });
      continue;
    }

    // Filter to jobs with result_status === "done"
    const doneJobs: Array<{ jobId: string; resultCreatedAt?: string; runId?: string }> = [];
    for (const run of runs) {
      for (const job of run.jobs) {
        if (job.result_status === "done" && job.id) {
          doneJobs.push({
            runId: run.run_id,
            jobId: job.id,
            resultCreatedAt: job.result_created_at,
          });
        }
      }
    }

    if (doneJobs.length === 0) {
      await writeSchedulerLog(
        "scheduled_no_done_jobs",
        `No completed jobs found yet for ${source.name}.`,
        { sourceId: source.id },
      );
      continue;
    }

    // Process unprocessed done jobs (most recent first)
    for (const { runId, jobId, resultCreatedAt } of doneJobs) {
      const existingRun = await getOxylabsScheduleRunByJobId(schedule.id, jobId);
      if (existingRun && existingRun.processing_status === "processed") {
        continue;
      }

      await writeSchedulerLog(
        "scheduled_job_processing",
        `Processing completed job ${jobId} for ${source.name}.`,
        { sourceId: source.id, context: { jobId, runId: runId ?? null } },
      );

      // Record job as processing in DB
      await upsertOxylabsScheduleRun({
        schedule_record_id: schedule.id,
        run_id: runId ?? null,
        job_id: jobId,
        result_status: "done",
        processing_status: "processing",
        result_created_at: resultCreatedAt ?? null,
      });

      let homepageHtml: string;
      try {
        homepageHtml = await fetchRemoteJobContent(jobId);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to fetch job content";
        await upsertOxylabsScheduleRun({
          schedule_record_id: schedule.id,
          run_id: runId ?? null,
          job_id: jobId,
          result_status: "done",
          processing_status: "failed",
          error_message: errorMsg,
        });
        partial = true;
        continue;
      }

      const jobSummary = emptySummary();
      const jobPartial = await processHomepageHtmlAndArticles(
        source,
        homepageHtml,
        limitPerSource,
        jobSummary,
      );

      // Accumulate into overall summary
      summary.candidatesFound += jobSummary.candidatesFound;
      summary.candidatesRejected += jobSummary.candidatesRejected;
      summary.duplicatesSkipped += jobSummary.duplicatesSkipped;
      summary.detailPagesScraped += jobSummary.detailPagesScraped;
      summary.articlesInserted += jobSummary.articlesInserted;
      summary.articlesRejected += jobSummary.articlesRejected;
      summary.articlesFailed += jobSummary.articlesFailed;
      for (const [reason, count] of Object.entries(jobSummary.rejectionReasons)) {
        summary.rejectionReasons[reason] =
          (summary.rejectionReasons[reason] ?? 0) + count;
      }

      if (jobPartial) partial = true;

      // Mark run as processed with its summary
      await upsertOxylabsScheduleRun({
        schedule_record_id: schedule.id,
        run_id: runId ?? null,
        job_id: jobId,
        result_status: "done",
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        summary: {
          articlesInserted: jobSummary.articlesInserted,
          detailPagesScraped: jobSummary.detailPagesScraped,
          candidatesFound: jobSummary.candidatesFound,
          duplicatesSkipped: jobSummary.duplicatesSkipped,
          articlesRejected: jobSummary.articlesRejected,
          articlesFailed: jobSummary.articlesFailed,
        },
      });

      await updateOxylabsSchedule(schedule.id, {
        last_run_at: new Date().toISOString(),
        last_error: null,
      });
    }
  }

  summary.totalDurationMs = Date.now() - startedAt;
  summary.status = partial ? "partial" : "completed";

  await writeSchedulerLog(
    "scheduled_process_completed",
    `Scheduled processing finished with status ${summary.status}.`,
    {
      level: partial ? "warn" : "info",
      context: { summary },
    },
  );

  return {
    message: partial
      ? "Scheduled processing completed with some failures."
      : "Scheduled processing completed.",
    summary,
  };
}

export type CronPipelineResult = {
  analysis: AnalysisResult;
  scraping: ScrapeResult;
  status: "completed" | "partial";
  success: boolean;
  timestamp: string;
};

/**
 * Automatic hourly pipeline triggered by Vercel Cron.
 * Step 1: Process scheduled results from Oxylabs.
 * Step 2: Unconditionally run AI analysis and pgvector embedding generation.
 */
export async function runAutomaticPipeline(): Promise<CronPipelineResult> {
  await writeSchedulerLog("cron_pipeline_started", "Automatic cron pipeline started.");

  let scrapingResult: ScrapeResult;
  try {
    scrapingResult = await processScheduledResults();
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Scheduled scraping process failed";
    await writeSchedulerLog(
      "cron_pipeline_scraping_failed",
      `Step 1 (scraping) failed: ${reason}`,
      { level: "error" },
    );
    scrapingResult = {
      message: `Scraping step failed: ${reason}`,
      summary: emptySummary(),
    };
  }

  // Step 2 must ALWAYS run even if step 1 fails or produces 0 new articles
  let analysisResult: AnalysisResult;
  try {
    analysisResult = await runArticleAnalysis({});
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "AI analysis step failed";
    await writeSchedulerLog(
      "cron_pipeline_analysis_failed",
      `Step 2 (analysis) failed: ${reason}`,
      { level: "error" },
    );
    throw error;
  }

  const overallStatus =
    scrapingResult.summary.status === "partial" ||
    analysisResult.summary.status === "partial"
      ? "partial"
      : "completed";

  await writeSchedulerLog(
    "cron_pipeline_completed",
    `Automatic cron pipeline completed with status ${overallStatus}.`,
    {
      level: overallStatus === "partial" ? "warn" : "info",
      context: {
        overallStatus,
        articlesInserted: scrapingResult.summary.articlesInserted,
        articlesAnalyzed: analysisResult.summary.analyzed,
        articlesEmbedded: analysisResult.summary.embedded,
      },
    },
  );

  return {
    success: true,
    status: overallStatus,
    timestamp: new Date().toISOString(),
    scraping: scrapingResult,
    analysis: analysisResult,
  };
}
