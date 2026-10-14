import { NextResponse } from "next/server";

import {
  ConceptRelationshipError,
  createConceptRelationship,
  deleteConceptRelationship,
  getConceptRelationships,
  getPrerequisiteConceptIds,
} from "@/lib/learning/knowledge/concept-relationship";
import { isConceptRelationshipsEnabled } from "@/lib/learning/knowledge/concept-relationship-flag";
import { getOrCreateDefaultUser } from "@/lib/user";

type RelationshipBody = {
  action?: "create" | "list" | "delete" | "prerequisites";
  conceptId?: string;
  fromConceptId?: string;
  toConceptId?: string;
  type?: string;
  confidence?: number | null;
  sourceType?: string | null;
  sourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  relationshipId?: string;
};

/**
 * Phase 2E-2 — Concept relationship foundation API.
 * Authenticated via session (or local default user). Does not trust client userId.
 */
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as RelationshipBody;
    const action = body.action ?? "list";

    if (!isConceptRelationshipsEnabled()) {
      if (action === "list" || action === "prerequisites") {
        return NextResponse.json({
          success: true,
          enabled: false,
          relationships: [],
          prerequisiteConceptIds: [],
        });
      }
      return NextResponse.json(
        {
          success: false,
          enabled: false,
          error: "Concept relationships are disabled.",
        },
        { status: 403 },
      );
    }

    if (action === "create") {
      const relationship = await createConceptRelationship({
        userId: user.id,
        fromConceptId: String(body.fromConceptId ?? "").trim(),
        toConceptId: String(body.toConceptId ?? "").trim(),
        type: String(body.type ?? "").trim(),
        confidence: body.confidence,
        sourceType: body.sourceType ?? "MANUAL",
        sourceId: body.sourceId ?? null,
        metadata: body.metadata ?? null,
      });
      return NextResponse.json({
        success: true,
        enabled: true,
        relationship,
      });
    }

    if (action === "list") {
      const conceptId = body.conceptId?.trim();
      if (!conceptId) {
        return NextResponse.json(
          { success: false, error: "conceptId is required." },
          { status: 400 },
        );
      }
      const relationships = await getConceptRelationships(user.id, conceptId);
      return NextResponse.json({
        success: true,
        enabled: true,
        relationships,
      });
    }

    if (action === "prerequisites") {
      const conceptId = body.conceptId?.trim();
      if (!conceptId) {
        return NextResponse.json(
          { success: false, error: "conceptId is required." },
          { status: 400 },
        );
      }
      const prerequisiteConceptIds = await getPrerequisiteConceptIds(
        user.id,
        conceptId,
      );
      return NextResponse.json({
        success: true,
        enabled: true,
        prerequisiteConceptIds,
      });
    }

    if (action === "delete") {
      const relationshipId = body.relationshipId?.trim();
      if (!relationshipId) {
        return NextResponse.json(
          { success: false, error: "relationshipId is required." },
          { status: 400 },
        );
      }
      const result = await deleteConceptRelationship(user.id, relationshipId);
      return NextResponse.json({
        success: true,
        enabled: true,
        ...result,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action." },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof ConceptRelationshipError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    console.error("Concept relationship API failed:", error);
    return NextResponse.json(
      { success: false, error: "Concept relationship request failed." },
      { status: 500 },
    );
  }
}
