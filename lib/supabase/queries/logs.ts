import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Log, TablesInsert } from "@/lib/supabase/types";

const DEFAULT_LOG_LIMIT = 100;
const MAX_LOG_LIMIT = 500;
const LOG_COLUMNS = "id,level,event,message,source_id,article_id,context,created_at";

export type NewLog = Omit<TablesInsert<"logs">, "created_at" | "id">;

function clampLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_LOG_LIMIT;
  return Math.min(MAX_LOG_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_LOG_LIMIT)));
}

export async function createLog(input: NewLog): Promise<Log> {
  const { data, error } = await getSupabaseAdmin()
    .from("logs")
    .insert(input)
    .select(LOG_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Unable to create log entry: ${error.message}`);
  }

  return data;
}

export async function listRecentLogs(limit?: number): Promise<Log[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("logs")
    .select(LOG_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(clampLimit(limit));

  if (error) {
    throw new Error(`Unable to list recent logs: ${error.message}`);
  }

  return data;
}
