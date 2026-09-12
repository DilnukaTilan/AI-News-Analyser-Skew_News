import { timingSafeEqual } from "node:crypto";

import { runAutomaticPipeline } from "@/lib/scheduler/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

function hasValidCronSecret(request: Request): boolean {
  // In local development, allow unauthenticated access for manual testing
  if (process.env.NODE_ENV === "development" && !process.env.CRON_SECRET) {
    return true;
  }

  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (!configuredSecret) {
    // If running in development with no CRON_SECRET configured, allow testing
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization")?.trim();
  if (authHeader) {
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch && bearerMatch[1]) {
      const supplied = bearerMatch[1].trim();
      const expectedBuffer = Buffer.from(configuredSecret);
      const suppliedBuffer = Buffer.from(supplied);
      if (
        expectedBuffer.length === suppliedBuffer.length &&
        timingSafeEqual(expectedBuffer, suppliedBuffer)
      ) {
        return true;
      }
    }
  }

  const directHeader = request.headers.get("x-cron-secret")?.trim();
  if (directHeader) {
    const expectedBuffer = Buffer.from(configuredSecret);
    const suppliedBuffer = Buffer.from(directHeader);
    if (
      expectedBuffer.length === suppliedBuffer.length &&
      timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      return true;
    }
  }

  return false;
}

export async function GET(request: Request): Promise<Response> {
  if (!hasValidCronSecret(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runAutomaticPipeline();
    return Response.json(result);
  } catch (error) {
    console.error("[cron] pipeline_failed", {
      reason: error instanceof Error ? error.message : "Unknown cron pipeline failure",
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "Automatic cron pipeline failed." },
      { status: 500 },
    );
  }
}
