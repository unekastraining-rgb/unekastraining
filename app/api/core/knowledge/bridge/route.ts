import { NextResponse } from "next/server";

import {
  confirmCoreKnowledgeCandidate,
  CoreKnowledgeBridgeError,
  isCoreKnowledgeBridgeEnabled,
  previewCoreKnowledgeBridge,
  rejectCoreKnowledgeCandidate,
} from "@/lib/learning/knowledge/core-bridge";
import { getOrCreateDefaultUser } from "@/lib/user";

type BridgeBody = {
  noteId?: string;
  action?: "preview" | "confirm" | "reject";
  candidateKey?: string;
};

/**
 * Phase 2E-1 — CORE → Knowledge Model grounding.
 * Explicit user action only; no autosave Concept creation.
 */
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as BridgeBody;
    const noteId = body.noteId?.trim();
    const action = body.action ?? "preview";

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: "noteId is required." },
        { status: 400 },
      );
    }

    if (!isCoreKnowledgeBridgeEnabled()) {
      return NextResponse.json({
        success: true,
        enabled: false,
        preview: {
          enabled: false,
          noteId,
          learningSpaceId: null,
          hasStudyExtract: false,
          linkedConceptIds: [],
          candidates: [],
          truncated: false,
          totalBeforeCap: 0,
        },
      });
    }

    if (action === "preview") {
      const preview = await previewCoreKnowledgeBridge({
        userId: user.id,
        noteId,
      });
      return NextResponse.json({ success: true, enabled: true, preview });
    }

    const candidateKey = body.candidateKey?.trim();
    if (!candidateKey) {
      return NextResponse.json(
        { success: false, error: "candidateKey is required." },
        { status: 400 },
      );
    }

    if (action === "confirm") {
      const result = await confirmCoreKnowledgeCandidate({
        userId: user.id,
        noteId,
        candidateKey,
      });
      return NextResponse.json({
        success: true,
        enabled: true,
        conceptId: result.conceptId,
        created: result.created,
        knowledge: result.knowledge,
      });
    }

    if (action === "reject") {
      const result = await rejectCoreKnowledgeCandidate({
        userId: user.id,
        noteId,
        candidateKey,
      });
      return NextResponse.json({
        success: true,
        enabled: true,
        knowledge: result.knowledge,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action." },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof CoreKnowledgeBridgeError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    console.error("CORE knowledge bridge failed:", error);
    return NextResponse.json(
      { success: false, error: "Knowledge bridge request failed." },
      { status: 500 },
    );
  }
}
