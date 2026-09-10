import { ZodError } from "zod";

import { hasValidAdminSecret } from "@/lib/security/admin-secret";
import { runManualScrape } from "@/lib/scraping/pipeline";
import {
  scrapeRequestSchema,
  ScrapeInputError,
} from "@/lib/scraping/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  try {
    if (!hasValidAdminSecret(request)) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Scraping is not configured." }, { status: 500 });
  }

  try {
    const text = await request.text();
    const input: unknown = text.trim() ? JSON.parse(text) : {};
    const scrapeRequest = scrapeRequestSchema.parse(input);
    const result = await runManualScrape(scrapeRequest);
    return Response.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Invalid scrape request.", issues: error.issues.map((issue) => issue.message) },
        { status: 400 },
      );
    }
    if (error instanceof ScrapeInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("[scrape] scrape_failed", {
      reason: error instanceof Error ? error.message : "Unknown scrape failure",
    });
    return Response.json({ error: "Scrape failed." }, { status: 500 });
  }
}
