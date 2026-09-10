import { listActiveSources } from "@/lib/supabase/queries/sources";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const sources = await listActiveSources();

    return Response.json(
      sources.map(({ id, listing_url, name }) => ({
        id,
        name,
        listing_url,
      })),
    );
  } catch (error) {
    console.error("[sources] list_failed", {
      reason: error instanceof Error ? error.message : "Unknown source query failure",
    });

    return Response.json({ error: "Unable to list active sources." }, { status: 500 });
  }
}
