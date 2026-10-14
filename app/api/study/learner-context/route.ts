import { NextResponse } from "next/server";

import {
  presentUniversalLearnerContext,
  resolveUniversalLearnerContext,
} from "@/lib/learning/universal-learner-context";
import { parseTeachingStyle } from "@/lib/learning/tutor/teaching-style";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * 2P-29 — Read-only Universal Learner Context API.
 * Session user is authoritative; client learnerId/userId ignored.
 * Never creates LearningAttempt / ConceptMastery.
 */
export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const url = new URL(request.url);
    const conceptId = url.searchParams.get("conceptId");
    const materialId = url.searchParams.get("materialId");
    const learningSpaceId = url.searchParams.get("learningSpaceId");
    const includePersona = url.searchParams.get("persona") === "1";
    const teachingStyleRaw = url.searchParams.get("teachingStyle");
    const teachingStyle = teachingStyleRaw
      ? parseTeachingStyle(teachingStyleRaw)
      : undefined;

    // Ignore spoofed identity query params.
    void url.searchParams.get("learnerId");
    void url.searchParams.get("userId");

    const context = await resolveUniversalLearnerContext({
      learnerId: user.id,
      conceptId,
      materialId,
      learningSpaceId,
      teachingStyle: teachingStyle === null ? null : teachingStyle,
      includePersonaHooks: includePersona,
    });

    const presentation = presentUniversalLearnerContext(context);

    return NextResponse.json({
      success: true,
      context: {
        learnerId: context.learnerId,
        resolvedAt: context.resolvedAt,
        createsEvidence: false,
        createsMastery: false,
        conceptId: context.concept?.conceptId ?? null,
        conceptTitle: context.concept?.conceptTitle ?? null,
        masteryStatus: context.concept?.mastery.status ?? null,
        learningSpace: context.learningSpace,
        material: context.material
          ? {
              materialId: context.material.materialId,
              title: context.material.title,
              provenanceLabel: context.material.provenance.label,
              partial: context.material.partial ?? false,
            }
          : null,
        intent: context.intent ?? null,
        teachingStyle: context.teachingStyle ?? null,
        activeLearning: context.activeLearning,
        recentActivitySummary: context.recentActivitySummary,
        decisionContext: context.decisionContext,
        preferences: context.preferences ?? null,
      },
      presentation,
    });
  } catch (error) {
    console.error("Learner context resolve failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not resolve learner context." },
      { status: 500 },
    );
  }
}
