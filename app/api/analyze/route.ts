import { ZodError } from "zod";

import { AIConfigurationError } from "@/lib/ai/article-analysis";
import { runArticleAnalysis } from "@/lib/analysis/pipeline";
import { analysisRequestSchema } from "@/lib/analysis/types";
import { hasValidAdminSecret } from "@/lib/security/admin-secret";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  try {
    if (!hasValidAdminSecret(request)) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Analysis is not configured." }, { status: 500 });
  }

  try {
    const text = await request.text();
    const input: unknown = text.trim() ? JSON.parse(text) : {};
    const analysisRequest = analysisRequestSchema.parse(input);
    const result = await runArticleAnalysis(analysisRequest);
    return Response.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid analysis request.",
          issues: error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }
    if (error instanceof AIConfigurationError) {
      console.error("[analysis] configuration_error");
      return Response.json({ error: "Analysis is not configured." }, { status: 500 });
    }

    console.error("[analysis] analysis_failed", {
      reason: error instanceof Error ? error.name : "Unknown analysis failure",
    });
    return Response.json({ error: "Analysis failed." }, { status: 500 });
  }
}
