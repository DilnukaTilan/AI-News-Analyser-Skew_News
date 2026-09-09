import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnvironment } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

let publicClient: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseClient() {
  if (!publicClient) {
    const { anonKey, url } = getPublicSupabaseEnvironment();
    publicClient = createClient<Database>(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return publicClient;
}
