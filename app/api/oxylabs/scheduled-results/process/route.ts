import { hasValidAdminSecret } from "@/lib/security/admin-secret";
import { processScheduledResults } from "@/lib/scheduler/pipeline";

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
    const text = await request.text();
    let body: { limitPerSource?: number; sourceIds?: string[] } = {};
    if (text.trim()) {
      try {
        body = JSON.parse(text);
      } catch {
        return Response.json(
          { error: "Request body must be valid JSON." },
          { status: 400 },
        );
      }
    }

    const result = await processScheduledResults({
      limitPerSource:
        typeof body.limitPerSource === "number" ? body.limitPerSource : undefined,
      sourceIds: Array.isArray(body.sourceIds) ? body.sourceIds : undefined,
    });

    return Response.json(result);
  } catch (error) {
    console.error("[scheduler] process_failed", {
      reason: error instanceof Error ? error.message : "Unknown process failure",
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process scheduled results." },
      { status: 500 },
    );
  }
}
