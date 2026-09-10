import "server-only";

import { isSamePublisherHost } from "@/lib/scraping/url";

const OXYLABS_REALTIME_URL = "https://realtime.oxylabs.io/v1/queries";
const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_HTML_LENGTH = 5_000_000;

export type OxylabsErrorKind =
  | "authentication"
  | "invalid_response"
  | "rate_limit"
  | "target"
  | "timeout"
  | "transport";

export class OxylabsError extends Error {
  constructor(
    public readonly kind: OxylabsErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "OxylabsError";
  }
}

function requireCredential(name: "OXY_WSA_PASSWORD" | "OXY_WSA_USERNAME"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new OxylabsError("authentication", `Missing required environment variable: ${name}`);
  return value;
}

type OxylabsResult = {
  content?: unknown;
  status_code?: unknown;
  url?: unknown;
};

export async function fetchHtmlThroughOxylabs(
  url: string,
  options: { render?: boolean; timeoutMs?: number } = {},
): Promise<string> {
  const username = requireCredential("OXY_WSA_USERNAME");
  const password = requireCredential("OXY_WSA_PASSWORD");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(OXYLABS_REALTIME_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "universal",
        url,
        ...(options.render ? { render: "html" } : {}),
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new OxylabsError("authentication", "Oxylabs authentication failed.");
    }
    if (response.status === 429) {
      throw new OxylabsError("rate_limit", "Oxylabs rate limit exceeded.");
    }
    if (!response.ok) {
      throw new OxylabsError("transport", `Oxylabs request failed with status ${response.status}.`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new OxylabsError("invalid_response", "Oxylabs returned invalid JSON.");
    }

    if (!payload || typeof payload !== "object" || !("results" in payload)) {
      throw new OxylabsError("invalid_response", "Oxylabs response did not contain results.");
    }
    const results = (payload as { results?: unknown }).results;
    if (!Array.isArray(results) || results.length === 0) {
      throw new OxylabsError("invalid_response", "Oxylabs response contained no result.");
    }

    const result = results[0] as OxylabsResult;
    if (
      typeof result.status_code !== "number" ||
      result.status_code < 200 ||
      result.status_code >= 300
    ) {
      throw new OxylabsError("target", "The target page did not return a successful status.");
    }
    if (typeof result.url !== "string" || !isSamePublisherHost(result.url, url)) {
      throw new OxylabsError("target", "The target redirected outside the selected publisher.");
    }
    if (typeof result.content !== "string" || result.content.length === 0) {
      throw new OxylabsError("invalid_response", "Oxylabs result did not contain HTML.");
    }
    if (result.content.length > MAX_HTML_LENGTH) {
      throw new OxylabsError("invalid_response", "Oxylabs result exceeded the HTML size limit.");
    }

    return result.content;
  } catch (error) {
    if (error instanceof OxylabsError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new OxylabsError("timeout", "Oxylabs request timed out.");
    }
    throw new OxylabsError("transport", "Unable to reach Oxylabs.");
  } finally {
    clearTimeout(timeout);
  }
}
