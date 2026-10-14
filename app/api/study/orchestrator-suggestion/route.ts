import { NextResponse } from "next/server";

import { getTopOrchestratorSuggestion } from "@/lib/learning/orchestrator/suggest";
import { resolveUserUrlCourseId } from "@/lib/study/resolve-user-url-course-id";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * Thin read-only suggestion for Study hub.
 * Recommendation-only — does not launch SIX or mutate learning state.
 */
export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const courseId = await resolveUserUrlCourseId(
      user.id,
      searchParams.get("courseId"),
    );

    const suggestion = await getTopOrchestratorSuggestion(
      user.id,
      courseId,
    );

    return NextResponse.json({ success: true, suggestion });
  } catch (error) {
    console.error("Failed to load orchestrator suggestion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load suggestion." },
      { status: 500 },
    );
  }
}
