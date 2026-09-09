import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  OxylabsSchedule,
  OxylabsScheduleRun,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/types";

const DEFAULT_RUN_LIMIT = 100;
const MAX_RUN_LIMIT = 500;
const SCHEDULE_COLUMNS =
  "id,source_id,schedule_id,status,last_synced_at,last_run_at,last_error,metadata,created_at,updated_at";
const RUN_COLUMNS =
  "id,schedule_record_id,run_id,job_id,result_status,processing_status,result_created_at,processed_at,error_message,summary,metadata,created_at,updated_at";

export type NewOxylabsSchedule = Omit<
  TablesInsert<"oxylabs_schedules">,
  "created_at" | "id" | "updated_at"
>;
export type OxylabsScheduleChanges = Omit<
  TablesUpdate<"oxylabs_schedules">,
  "created_at" | "id" | "source_id"
>;
export type NewOxylabsScheduleRun = Omit<
  TablesInsert<"oxylabs_schedule_runs">,
  "created_at" | "id" | "updated_at"
>;
export type OxylabsScheduleRunChanges = Omit<
  TablesUpdate<"oxylabs_schedule_runs">,
  "created_at" | "id" | "schedule_record_id"
>;

function clampRunLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_RUN_LIMIT;
  return Math.min(MAX_RUN_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_RUN_LIMIT)));
}

export async function listOxylabsSchedules(): Promise<OxylabsSchedule[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("oxylabs_schedules")
    .select(SCHEDULE_COLUMNS)
    .order("created_at")
    .order("id");

  if (error) {
    throw new Error(`Unable to list Oxylabs schedules: ${error.message}`);
  }

  return data;
}

export async function upsertOxylabsSchedule(
  input: NewOxylabsSchedule,
): Promise<OxylabsSchedule> {
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("oxylabs_schedules")
    .upsert({ ...input, last_synced_at: now, updated_at: now }, { onConflict: "source_id" })
    .select(SCHEDULE_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Unable to upsert Oxylabs schedule: ${error.message}`);
  }

  return data;
}

export async function updateOxylabsSchedule(
  id: string,
  changes: OxylabsScheduleChanges,
): Promise<OxylabsSchedule> {
  const { data, error } = await getSupabaseAdmin()
    .from("oxylabs_schedules")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(SCHEDULE_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Unable to update Oxylabs schedule: ${error.message}`);
  }

  return data;
}

export async function upsertOxylabsScheduleRun(
  input: NewOxylabsScheduleRun,
): Promise<OxylabsScheduleRun> {
  const now = new Date().toISOString();
  const query = getSupabaseAdmin()
    .from("oxylabs_schedule_runs")
    .upsert(
      { ...input, updated_at: now },
      { onConflict: "schedule_record_id,job_id" },
    )
    .select(RUN_COLUMNS)
    .single();
  const { data, error } = await query;

  if (error) {
    throw new Error(`Unable to upsert Oxylabs schedule run: ${error.message}`);
  }

  return data;
}

export async function updateOxylabsScheduleRun(
  id: string,
  changes: OxylabsScheduleRunChanges,
): Promise<OxylabsScheduleRun> {
  const { data, error } = await getSupabaseAdmin()
    .from("oxylabs_schedule_runs")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(RUN_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Unable to update Oxylabs schedule run: ${error.message}`);
  }

  return data;
}

export async function listOxylabsScheduleRuns(
  scheduleRecordId: string,
  limit?: number,
): Promise<OxylabsScheduleRun[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("oxylabs_schedule_runs")
    .select(RUN_COLUMNS)
    .eq("schedule_record_id", scheduleRecordId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(clampRunLimit(limit));

  if (error) {
    throw new Error(`Unable to list Oxylabs schedule runs: ${error.message}`);
  }

  return data;
}
