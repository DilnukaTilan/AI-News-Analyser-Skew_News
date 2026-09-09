import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getAdminSupabaseEnvironment } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseAdmin() {
  if (!adminClient) {
    const { serviceRoleKey, url } = getAdminSupabaseEnvironment();
    adminClient = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
