import { NextResponse } from "next/server";

import { submitRetentionReview } from "@/lib/learning/retention/review";
import { getOrCreateDefaultUser } from "@/lib/user";

/** Submit one Lucky retention review; returns score/result only (no answer dump). */
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as {
      retentionItemId?: string;
      answer?: string | string[] | boolean;
    };

    if (!body.retentionItemId?.trim()) {
      return NextResponse.json(
        { success: false, error: "retentionItemId is required." },
        { status: 400 },
      );
    }

    const result = await submitRetentionReview({
      userId: user.id,
      retentionItemId: body.retentionItemId.trim(),
      answer: body.answer,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Retention item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        outcome: result.outcome,
        score: result.score,
        resultLabel: result.resultLabel,
        next: result.next,
      },
    });
  } catch (error) {
    console.error("Failed to submit retention review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit retention review." },
      { status: 500 },
    );
  }
}
