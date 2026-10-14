/**
 * 2P-34 — Map UnauthorizedError → 401 without leaking internals.
 */

import { NextResponse } from "next/server";

import { UnauthorizedError } from "@/lib/user";
import { logOpsEvent, type OpsEventName } from "@/lib/ops/safe-log";

export function unauthorizedJsonResponse(error: unknown): NextResponse | null {
  if (!(error instanceof UnauthorizedError)) return null;
  return NextResponse.json(
    { success: false, error: "Unauthorized." },
    { status: 401 },
  );
}

/** Prefer this at the start of catch blocks on session-gated routes. */
export function jsonErrorFromUnknown(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 500,
  opts?: { event?: OpsEventName },
): NextResponse {
  const unauthorized = unauthorizedJsonResponse(error);
  if (unauthorized) {
    logOpsEvent("auth.failure", { status: 401 });
    return unauthorized;
  }
  logOpsEvent(opts?.event ?? "server.error", {
    status: fallbackStatus,
    message: fallbackMessage.slice(0, 80),
  });
  console.error(fallbackMessage, error);
  return NextResponse.json(
    { success: false, error: fallbackMessage },
    { status: fallbackStatus },
  );
}
