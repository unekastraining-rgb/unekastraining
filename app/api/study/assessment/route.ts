import { NextResponse } from "next/server";

import { runStandaloneAssessmentConsumer } from "@/lib/learning/assessment/standalone-assessment-consumer";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import { getOrCreateDefaultUser, UnauthorizedError } from "@/lib/user";

/**
 * Phase 2G-40 / 2G-47 — Standalone ASSESS entry + optional launch instruction.
 *
 * Returns plan metadata always (on success). When body.adapterKey is set
 * (e.g. "quiz" | "flashcard"), may also return activity/launch for the existing
 * activity experience. Does not execute Quiz/Flashcard, write evidence, or
 * mutate Adaptive. Session user is authoritative; client learnerId/userId/
 * quizId/flashcardId are ignored.
 */
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json().catch(() => null)) as {
      conceptId?: unknown;
      learningSpaceId?: unknown;
      intent?: unknown;
      diagnosis?: unknown;
      adaptive?: unknown;
      adapterKey?: unknown;
      /** Ignored — owned Quiz identity comes from resolution only. */
      quizId?: unknown;
      /** Ignored — owned Flashcard identity comes from 2G-53 resolution only. */
      flashcardId?: unknown;
      learnerId?: unknown;
      userId?: unknown;
    } | null;

    if (body == null || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "invalid_request" },
        { status: 400 },
      );
    }

    // Ownership is session-bound — never trust client identity / activity ids.
    void body.learnerId;
    void body.userId;
    void body.quizId;
    void body.flashcardId;

    const conceptId =
      typeof body.conceptId === "string" ? body.conceptId.trim() : "";
    if (!conceptId) {
      return NextResponse.json(
        { success: false, error: "invalid_request" },
        { status: 400 },
      );
    }

    const owned = await getLearnerConceptMastery(user.id, conceptId);
    if (!owned) {
      return NextResponse.json(
        { success: false, error: "Concept not found." },
        { status: 404 },
      );
    }

    let adaptive:
      | { runId: string; stepIndex: number }
      | null
      | undefined;
    if (body.adaptive === undefined) {
      adaptive = undefined;
    } else if (body.adaptive === null) {
      adaptive = null;
    } else if (
      typeof body.adaptive === "object" &&
      !Array.isArray(body.adaptive)
    ) {
      const raw = body.adaptive as Record<string, unknown>;
      const runId = typeof raw.runId === "string" ? raw.runId : "";
      const stepIndex =
        typeof raw.stepIndex === "number" ? raw.stepIndex : Number.NaN;
      adaptive = { runId, stepIndex };
    } else {
      return NextResponse.json(
        { success: false, error: "invalid_request" },
        { status: 400 },
      );
    }

    const learningSpaceId =
      typeof body.learningSpaceId === "string"
        ? body.learningSpaceId.trim()
        : body.learningSpaceId === null
          ? null
          : undefined;

    const adapterKey =
      typeof body.adapterKey === "string" ? body.adapterKey.trim() : undefined;

    const result = await runStandaloneAssessmentConsumer({
      learnerId: user.id,
      conceptId,
      learningSpaceId,
      intent: body.intent,
      diagnosis: body.diagnosis,
      adaptive,
      ...(adapterKey ? { adapterKey } : {}),
    });

    if (!result.ok) {
      const status =
        result.code === "assessment_context_incomplete" ? 422 : 400;
      return NextResponse.json(
        { success: false, error: result.code },
        { status },
      );
    }

    const { plan, handoff, adaptiveBinding, activityOutcome } = result;

    const payload: Record<string, unknown> = {
      success: true,
      status: plan.status,
      assessmentMode: plan.assessmentMode,
      conceptId: plan.conceptId,
      plan,
      handoff,
      activityOutcome: activityOutcome.status,
    };

    if (adaptiveBinding !== undefined) {
      payload.adaptiveBinding = adaptiveBinding;
    }

    if (activityOutcome.status === "ready") {
      payload.activity = activityOutcome.activity;
      payload.launch = activityOutcome.launch;
    } else if (
      activityOutcome.status === "unavailable" ||
      activityOutcome.status === "unresolved"
    ) {
      payload.activityError = activityOutcome.reason;
    }

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    console.error("Failed to plan standalone assessment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to plan assessment." },
      { status: 500 },
    );
  }
}
