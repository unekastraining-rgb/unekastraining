import { NextResponse } from "next/server";

export function aiUnavailableResponse(feature: string) {
  return NextResponse.json(
    {
      success: false,
      offline: true,
      error: `${feature} needs an AI API key. Upload syllabi, use the planner, and add flashcards manually without AI.`,
    },
    { status: 503 },
  );
}
