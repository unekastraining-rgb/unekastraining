import { NextResponse } from "next/server";

import { AdaptiveSequenceCoordinatorError } from "@/lib/learning/sequence/coordinator-errors";
import { completeAdaptiveSequence } from "@/lib/learning/sequence/coordinator";
import { jsonErrorFromUnknown, unauthorizedJsonResponse } from "@/lib/api/http-errors";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * Phase 2G-10 — Explicit Adaptive Sequence completion (triggers 2G-7 Lucky handoff).
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { runId } = await context.params;
    const completed = await completeAdaptiveSequence(user.id, runId);
    return NextResponse.json({
      success: true,
      runId: completed.id,
      status: completed.status,
    });
  } catch (error) {
    const unauthorized = unauthorizedJsonResponse(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AdaptiveSequenceCoordinatorError) {
      const status =
        error.code === "RUN_NOT_FOUND" || error.code === "RUN_NOT_OWNED"
          ? 404
          : 400;
      return NextResponse.json(
        { success: false, error: "Could not complete adaptive study." },
        { status },
      );
    }
    return jsonErrorFromUnknown(error, "Could not complete adaptive study.");
  }
}
