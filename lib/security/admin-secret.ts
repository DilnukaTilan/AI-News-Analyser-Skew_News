import "server-only";

import { timingSafeEqual } from "node:crypto";

const ADMIN_SECRET_HEADER = "x-biasly-admin-secret";

function getAdminSecret(): string {
  const secret = process.env.BIASLY_ADMIN_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing required environment variable: BIASLY_ADMIN_SECRET");
  }

  return secret;
}

export function hasValidAdminSecret(request: Request): boolean {
  const supplied = request.headers.get(ADMIN_SECRET_HEADER)?.trim();
  if (!supplied) return false;

  const expectedBuffer = Buffer.from(getAdminSecret());
  const suppliedBuffer = Buffer.from(supplied);

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}
