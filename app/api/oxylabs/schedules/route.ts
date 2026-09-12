import { hasValidAdminSecret } from "@/lib/security/admin-secret";
import { syncOxylabsSchedules } from "@/lib/scheduler/pipeline";
import { listOxylabsSchedules } from "@/lib/supabase/queries/oxylabs";
import { listActiveSources } from "@/lib/supabase/queries/sources";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  try {
    if (!hasValidAdminSecret(request)) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Scheduler is not configured." }, { status: 500 });
  }

  try {
    const result = await syncOxylabsSchedules();
    return Response.json(result);
  } catch (error) {
    console.error("[scheduler] sync_failed", {
      reason: error instanceof Error ? error.message : "Unknown sync failure",
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to sync schedules." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    if (!hasValidAdminSecret(request)) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Scheduler is not configured." }, { status: 500 });
  }

  try {
    const [schedules, sources] = await Promise.all([
      listOxylabsSchedules(),
      listActiveSources(),
    ]);

    const sourcesById = new Map(sources.map((s) => [s.id, s]));

    const enriched = schedules.map((schedule) => {
      const source = sourcesById.get(schedule.source_id);
      return {
        ...schedule,
        source_name: source?.name ?? null,
        source_url: source?.listing_url ?? null,
      };
    });

    return Response.json({ schedules: enriched });
  } catch (error) {
    console.error("[scheduler] list_failed", {
      reason: error instanceof Error ? error.message : "Unknown list failure",
    });
    return Response.json(
      { error: "Unable to retrieve Oxylabs schedules." },
      { status: 500 },
    );
  }
}
