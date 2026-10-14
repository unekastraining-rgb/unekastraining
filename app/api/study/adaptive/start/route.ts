import { NextResponse } from "next/server";

import { resolveOwnedMaterialContext } from "@/lib/learning/material-context";
import { resolveOwnedAssignmentContext } from "@/lib/learning/school-lms";
import { startOrResumeAdaptiveSequenceForConcept } from "@/lib/learning/sequence/start-or-resume";
import { jsonErrorFromUnknown } from "@/lib/api/http-errors";
import { logOpsEvent } from "@/lib/ops/safe-log";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * Phase 2G-9 — Start or resume Adaptive Sequence for an owned Concept.
 * Session user is authoritative; client userId/learnerId are ignored.
 * 2P-28 — optional materialId is ownership-validated display context only
 * (does not change diagnosis or create evidence).
 * 2P-49 — optional assignmentId is ownership-validated school context only
 * (does not change diagnosis, create evidence, or imply mastery).
 */
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json().catch(() => null)) as {
      conceptId?: unknown;
      materialId?: unknown;
      assignmentId?: unknown;
      userId?: unknown;
      learnerId?: unknown;
    } | null;

    const conceptId =
      typeof body?.conceptId === "string" ? body.conceptId.trim() : "";
    if (!conceptId) {
      return NextResponse.json(
        { success: false, error: "Concept is required." },
        { status: 400 },
      );
    }

    // Explicitly ignore any client-supplied identity fields.
    void body?.userId;
    void body?.learnerId;

    const materialIdRaw =
      typeof body?.materialId === "string" ? body.materialId.trim() : "";
    let ownedMaterialId: string | null = null;
    if (materialIdRaw) {
      const ctx = await resolveOwnedMaterialContext({
        userId: user.id,
        materialId: materialIdRaw,
        conceptId,
      });
      ownedMaterialId = ctx?.materialId ?? null;
    }

    const assignmentIdRaw =
      typeof body?.assignmentId === "string" ? body.assignmentId.trim() : "";
    let ownedAssignmentId: string | null = null;
    if (assignmentIdRaw) {
      const ctx = await resolveOwnedAssignmentContext({
        userId: user.id,
        assignmentId: assignmentIdRaw,
      });
      ownedAssignmentId = ctx?.assignmentId ?? null;
    }

    const result = await startOrResumeAdaptiveSequenceForConcept(
      user.id,
      conceptId,
    );

    if (result.kind === "not_found") {
      return NextResponse.json(
        { success: false, error: "Concept not found." },
        { status: 404 },
      );
    }

    if (result.kind === "no_sequence") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Adaptive study is not needed for this concept right now. Try a single activity instead.",
        },
        { status: 400 },
      );
    }

    if (result.kind === "error") {
      logOpsEvent("adaptive.failure", { status: 500, kind: "start_error" });
      console.error("Adaptive sequence start failed:", result.message);
      return NextResponse.json(
        { success: false, error: "Could not start adaptive study." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      runId: result.runId,
      resumed: result.resumed,
      /** Owned material id for display URL only — never invents ownership. */
      materialId: ownedMaterialId,
      /** Owned assignment id for school continuity URL only — never mastery. */
      assignmentId: ownedAssignmentId,
    });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Could not start adaptive study.", 500, {
      event: "adaptive.failure",
    });
  }
}
