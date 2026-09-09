import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Source } from "@/lib/supabase/types";

const SOURCE_COLUMNS =
  "id,name,listing_url,parser_strategy,is_active,logo_url,created_at,updated_at";

function normalizeValues(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export async function listActiveSources(): Promise<Source[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("sources")
    .select(SOURCE_COLUMNS)
    .eq("is_active", true)
    .order("name")
    .order("id");

  if (error) {
    throw new Error(`Unable to list active sources: ${error.message}`);
  }

  return data;
}

export async function getActiveSourcesByIds(
  sourceIds: readonly string[],
): Promise<Source[]> {
  const ids = normalizeValues(sourceIds);
  if (ids.length === 0) return [];

  const { data, error } = await getSupabaseAdmin()
    .from("sources")
    .select(SOURCE_COLUMNS)
    .eq("is_active", true)
    .in("id", ids)
    .order("name")
    .order("id");

  if (error) {
    throw new Error(`Unable to select active sources by ID: ${error.message}`);
  }

  return data;
}

export async function getActiveSourcesByNames(
  sourceNames: readonly string[],
): Promise<Source[]> {
  const names = normalizeValues(sourceNames);
  if (names.length === 0) return [];

  const { data, error } = await getSupabaseAdmin()
    .from("sources")
    .select(SOURCE_COLUMNS)
    .eq("is_active", true)
    .in("name", names)
    .order("name")
    .order("id");

  if (error) {
    throw new Error(`Unable to select active sources by name: ${error.message}`);
  }

  return data;
}
