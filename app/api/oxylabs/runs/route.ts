import { hasValidAdminSecret } from "@/lib/security/admin-secret";
import {
  listAllOxylabsScheduleRuns,
  listOxylabsScheduleRuns,
} from "@/lib/supabase/queries/oxylabs";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    if (!hasValidAdminSecret(request)) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Scheduler is not configured." }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const scheduleRecordId = searchParams.get("scheduleRecordId")?.trim();
    const limitParam = searchParams.get("limit")?.trim();
    const limit = limitParam ? Number(limitParam) : undefined;

    const runs = scheduleRecordId
      ? await listOxylabsScheduleRuns(scheduleRecordId, limit)
      : await listAllOxylabsScheduleRuns(limit);

    return Response.json({ runs });
  } catch (error) {
    console.error("[scheduler] runs_list_failed", {
      reason: error instanceof Error ? error.message : "Unknown runs query failure",
    });
    return Response.json(
      { error: "Unable to retrieve Oxylabs schedule runs." },
      { status: 500 },
    );
  }
}
