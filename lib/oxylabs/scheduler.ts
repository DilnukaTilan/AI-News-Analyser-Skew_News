import "server-only";

import { OxylabsError } from "@/lib/oxylabs/client";

const OXYLABS_DATA_BASE_URL = "https://data.oxylabs.io/v1";
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_HTML_LENGTH = 5_000_000;

export type OxylabsScheduledJob = {
  id: string;
  create_status_code?: number;
  result_status: "done" | "faulted" | "pending" | string;
  created_at?: string;
  result_created_at?: string;
};

export type OxylabsRunItem = {
  run_id?: string;
  jobs: OxylabsScheduledJob[];
  success_rate?: number;
};

function getOxylabsCredentials(): { password: string; username: string } {
  const username = process.env.OXY_WSA_USERNAME?.trim();
  const password = process.env.OXY_WSA_PASSWORD?.trim();

  if (!username || !password) {
    throw new OxylabsError(
      "authentication",
      "Missing required Oxylabs credentials (OXY_WSA_USERNAME / OXY_WSA_PASSWORD).",
    );
  }

  return { username, password };
}

function getAuthHeader(): string {
  const { username, password } = getOxylabsCredentials();
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

/**
 * Preprocess JSON string to wrap large 64-bit integer values in quotes.
 * This prevents JavaScript's Number.MAX_SAFE_INTEGER from truncating / corrupting IDs.
 */
export function quoteLargeIntegersInJson(raw: string): string {
  return raw.replace(/"(id|schedule_id|run_id)"\s*:\s*(\d{10,})/g, '"$1": "$2"');
}

/**
 * Creates an hourly schedule on Oxylabs for a given homepage URL.
 * Runs at the top of every hour (cron: "0 * * * *").
 */
export async function createRemoteSchedule(options: {
  render?: boolean;
  url: string;
}): Promise<{ active: boolean; scheduleId: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${OXYLABS_DATA_BASE_URL}/schedules`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cron: "0 * * * *",
        items: [
          {
            source: "universal",
            url: options.url,
            ...(options.render ? { render: "html" } : {}),
          },
        ],
        end_time: "2035-12-31 23:59:59",
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new OxylabsError("authentication", "Oxylabs authentication failed.");
    }
    if (response.status === 429) {
      throw new OxylabsError("rate_limit", "Oxylabs rate limit exceeded.");
    }
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new OxylabsError(
        "transport",
        `Oxylabs create schedule failed with status ${response.status}: ${errorText}`,
      );
    }

    const rawText = await response.text();

    // Critical: extract schedule_id as string directly from raw HTTP response
    const scheduleIdMatch = rawText.match(/"schedule_id"\s*:\s*(\d+)/);
    if (!scheduleIdMatch || !scheduleIdMatch[1]) {
      throw new OxylabsError(
        "invalid_response",
        "Oxylabs schedule creation response did not contain a valid schedule_id.",
      );
    }

    const scheduleId = scheduleIdMatch[1];
    let parsed: { active?: boolean } = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Ignored if JSON parsing fails after extracting ID
    }

    return {
      scheduleId,
      active: parsed.active ?? true,
    };
  } catch (error) {
    if (error instanceof OxylabsError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new OxylabsError("timeout", "Oxylabs schedule creation request timed out.");
    }
    throw new OxylabsError("transport", "Unable to create schedule on Oxylabs.");
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Lists all schedule IDs currently registered on Oxylabs for this account.
 * Uses raw string extraction to ensure large integer schedule IDs remain accurate.
 */
export async function listRemoteScheduleIds(): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${OXYLABS_DATA_BASE_URL}/schedules`, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new OxylabsError("authentication", "Oxylabs authentication failed.");
    }
    if (!response.ok) {
      throw new OxylabsError(
        "transport",
        `Oxylabs list schedules failed with status ${response.status}.`,
      );
    }

    const rawText = await response.text();
    const schedulesMatch = rawText.match(/"schedules"\s*:\s*\[([\s\d,]*)\]/);
    if (!schedulesMatch) {
      return [];
    }

    const ids = Array.from(schedulesMatch[1].matchAll(/\d+/g), (match) => match[0]);
    return ids;
  } catch (error) {
    if (error instanceof OxylabsError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new OxylabsError("timeout", "Oxylabs list schedules request timed out.");
    }
    throw new OxylabsError("transport", "Unable to list schedules from Oxylabs.");
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Deactivates an existing schedule on Oxylabs using PUT /v1/schedules/{id}/state.
 */
export async function deactivateRemoteSchedule(scheduleId: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${OXYLABS_DATA_BASE_URL}/schedules/${scheduleId}/state`, {
      method: "PUT",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: false }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new OxylabsError("authentication", "Oxylabs authentication failed.");
    }
    if (!response.ok && response.status !== 404) {
      const errorText = await response.text().catch(() => "");
      throw new OxylabsError(
        "transport",
        `Oxylabs deactivate schedule ${scheduleId} failed with status ${response.status}: ${errorText}`,
      );
    }
  } catch (error) {
    if (error instanceof OxylabsError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new OxylabsError("timeout", `Oxylabs deactivate schedule timed out for ${scheduleId}.`);
    }
    throw new OxylabsError("transport", `Unable to deactivate schedule ${scheduleId} on Oxylabs.`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches the runs information for a schedule using GET /v1/schedules/{id}/runs.
 * Returns each run with per-job details and status.
 */
export async function getRemoteScheduleRuns(scheduleId: string): Promise<OxylabsRunItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${OXYLABS_DATA_BASE_URL}/schedules/${scheduleId}/runs`, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new OxylabsError("authentication", "Oxylabs authentication failed.");
    }
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new OxylabsError(
        "transport",
        `Oxylabs get schedule runs failed with status ${response.status}.`,
      );
    }

    const rawText = await response.text();
    const safeText = quoteLargeIntegersInJson(rawText);

    let parsed: { runs?: Array<{ jobs?: Array<Record<string, unknown>>; run_id?: string | number; success_rate?: number }> };
    try {
      parsed = JSON.parse(safeText);
    } catch {
      throw new OxylabsError("invalid_response", "Oxylabs runs response returned invalid JSON.");
    }

    if (!parsed || !Array.isArray(parsed.runs)) {
      return [];
    }

    return parsed.runs.map((run) => ({
      run_id: run.run_id !== undefined ? String(run.run_id) : undefined,
      success_rate: typeof run.success_rate === "number" ? run.success_rate : undefined,
      jobs: Array.isArray(run.jobs)
        ? run.jobs
            .map((job) => ({
              id: String(job.id ?? ""),
              create_status_code:
                typeof job.create_status_code === "number" ? job.create_status_code : undefined,
              result_status: String(job.result_status ?? "unknown"),
              created_at: typeof job.created_at === "string" ? job.created_at : undefined,
              result_created_at:
                typeof job.result_created_at === "string" ? job.result_created_at : undefined,
            }))
            .filter((job) => job.id.length > 0)
        : [],
    }));
  } catch (error) {
    if (error instanceof OxylabsError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new OxylabsError("timeout", `Oxylabs get runs timed out for schedule ${scheduleId}.`);
    }
    throw new OxylabsError("transport", `Unable to fetch runs for schedule ${scheduleId}.`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches the scraped HTML content for a completed Oxylabs job.
 * Calls GET /v1/queries/{jobId}/results?type=raw.
 */
export async function fetchRemoteJobContent(jobId: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = `${OXYLABS_DATA_BASE_URL}/queries/${jobId}/results?type=raw`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new OxylabsError("authentication", "Oxylabs authentication failed.");
    }
    if (!response.ok) {
      throw new OxylabsError(
        "transport",
        `Oxylabs fetch job results failed for job ${jobId} with status ${response.status}.`,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new OxylabsError("invalid_response", "Oxylabs job results returned invalid JSON.");
    }

    if (!payload || typeof payload !== "object" || !("results" in payload)) {
      throw new OxylabsError("invalid_response", "Oxylabs job response did not contain results.");
    }

    const results = (payload as { results?: unknown }).results;
    if (!Array.isArray(results) || results.length === 0) {
      throw new OxylabsError("invalid_response", "Oxylabs job response contained empty results.");
    }

    const result = results[0] as { content?: unknown; status_code?: unknown };
    if (
      typeof result.status_code === "number" &&
      (result.status_code < 200 || result.status_code >= 300)
    ) {
      throw new OxylabsError("target", `Job target page returned status ${result.status_code}.`);
    }

    if (typeof result.content !== "string" || result.content.length === 0) {
      throw new OxylabsError("invalid_response", "Oxylabs job result did not contain HTML content.");
    }

    if (result.content.length > MAX_HTML_LENGTH) {
      throw new OxylabsError("invalid_response", "Oxylabs job result HTML exceeded size limit.");
    }

    return result.content;
  } catch (error) {
    if (error instanceof OxylabsError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new OxylabsError("timeout", `Oxylabs job content fetch timed out for job ${jobId}.`);
    }
    throw new OxylabsError("transport", `Unable to fetch job content for ${jobId}.`);
  } finally {
    clearTimeout(timeout);
  }
}
