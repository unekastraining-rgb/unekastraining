import { NextResponse } from "next/server";

import { AdaptiveSequenceCoordinatorError } from "@/lib/learning/sequence/coordinator-errors";
import { abandonAdaptiveSequence } from "@/lib/learning/sequence/coordinator";
import { jsonErrorFromUnknown, unauthorizedJsonResponse } from "@/lib/api/http-errors";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * Phase 2G-10 — Explicit Adaptive Sequence abandon (no Lucky handoff).
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { runId } = await context.params;
    const abandoned = await abandonAdaptiveSequence(user.id, runId);
    return NextResponse.json({
      success: true,
      runId: abandoned.id,
      status: abandoned.status,
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
        { success: false, error: "Could not abandon adaptive study." },
        { status },
      );
    }
    return jsonErrorFromUnknown(error, "Could not abandon adaptive study.");
  }
}
