import { NextResponse } from "next/server";

import {
  createBetaFeedback,
  isBetaFeedbackCategory,
} from "@/lib/beta/feedback";
import { jsonErrorFromUnknown } from "@/lib/api/http-errors";
import { getSessionUser } from "@/lib/auth/session";

/**
 * POST /api/beta/feedback — session-owned beta friction capture.
 * Does not create LearningAttempt or update ConceptMastery.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sign in to send feedback." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      category?: unknown;
      comment?: unknown;
      surface?: unknown;
      activityRef?: unknown;
    } | null;

    if (!body || !isBetaFeedbackCategory(body.category)) {
      return NextResponse.json(
        { success: false, error: "Choose a valid feedback category." },
        { status: 400 },
      );
    }
    if (typeof body.comment !== "string" || !body.comment.trim()) {
      return NextResponse.json(
        { success: false, error: "Add a short comment." },
        { status: 400 },
      );
    }

    const row = await createBetaFeedback({
      userId: user.id,
      category: body.category,
      comment: body.comment,
      surface: typeof body.surface === "string" ? body.surface : null,
      activityRef: typeof body.activityRef === "string" ? body.activityRef : null,
    });

    return NextResponse.json({
      success: true,
      data: { id: row.id, category: row.category },
    });
  } catch (error) {
    return jsonErrorFromUnknown(
      error,
      "Could not save feedback. Try again.",
      500,
    );
  }
}
