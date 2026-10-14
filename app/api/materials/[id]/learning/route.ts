import { NextResponse } from "next/server";

import {
  confirmMaterialConceptCandidate,
  getMaterialLearningStatus,
  MaterialLearningError,
  prepareMaterialForLearning,
} from "@/lib/learning/material-ingestion";
import { CoreKnowledgeBridgeError } from "@/lib/learning/knowledge/core-bridge";
import { jsonErrorFromUnknown, unauthorizedJsonResponse } from "@/lib/api/http-errors";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * 2P-27 — Material → learning status (owned only).
 * GET never creates LearningAttempt / ConceptMastery.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const status = await getMaterialLearningStatus(user.id, id);
    return NextResponse.json({ success: true, learning: status });
  } catch (error) {
    const unauthorized = unauthorizedJsonResponse(error);
    if (unauthorized) return unauthorized;
    if (error instanceof MaterialLearningError && error.code === "not_found") {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 },
      );
    }
    return jsonErrorFromUnknown(
      error,
      "Could not load material learning status.",
    );
  }
}

type LearningBody = {
  action?: "prepare" | "confirm";
  candidateKey?: string;
  /** Ignored — session user is authoritative. */
  learnerId?: unknown;
  userId?: unknown;
};

/**
 * POST prepare | confirm — never trusts client learnerId.
 * Confirm creates Concept only (via Knowledge bridge), not evidence/mastery.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as LearningBody;
    void body.learnerId;
    void body.userId;

    const action = body.action ?? "prepare";

    if (action === "prepare") {
      const learning = await prepareMaterialForLearning(user.id, id);
      return NextResponse.json({ success: true, learning });
    }

    if (action === "confirm") {
      const candidateKey =
        typeof body.candidateKey === "string" ? body.candidateKey.trim() : "";
      if (!candidateKey) {
        return NextResponse.json(
          { success: false, error: "candidateKey is required." },
          { status: 400 },
        );
      }
      const result = await confirmMaterialConceptCandidate({
        userId: user.id,
        materialId: id,
        candidateKey,
      });
      const learning = await getMaterialLearningStatus(user.id, id);
      return NextResponse.json({
        success: true,
        conceptId: result.conceptId,
        created: result.created,
        noteId: result.noteId,
        learning,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action." },
      { status: 400 },
    );
  } catch (error) {
    const unauthorized = unauthorizedJsonResponse(error);
    if (unauthorized) return unauthorized;
    if (error instanceof MaterialLearningError && error.code === "not_found") {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 },
      );
    }
    if (error instanceof CoreKnowledgeBridgeError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    return jsonErrorFromUnknown(
      error,
      "Could not prepare material for learning.",
    );
  }
}
