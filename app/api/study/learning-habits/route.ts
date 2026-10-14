import { NextResponse } from "next/server";

import { QUESTIONNAIRE, PROBES } from "@/lib/learning/habits/catalog";
import {
  analyticsSummary,
  currentProbe,
  deriveInsights,
  deriveRecommendations,
  suggestedExperiments,
} from "@/lib/learning/habits/engine";
import type { HabitsAction } from "@/lib/learning/habits/engine";
import {
  applyLearningHabitsAction,
  loadLearningHabits,
} from "@/lib/learning/habits/persistence";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const { doc } = await loadLearningHabits(user.id);
    return NextResponse.json({
      success: true,
      document: doc,
      questionnaire: QUESTIONNAIRE,
      probes: PROBES,
      currentProbe: currentProbe(doc),
      insights: deriveInsights(doc),
      recommendations: deriveRecommendations(doc),
      analytics: analyticsSummary(doc),
      suggestedExperiments: suggestedExperiments(),
    });
  } catch (error) {
    console.error("learning-habits GET failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not load Learning & Habits." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as { action?: HabitsAction };
    if (!body.action || typeof body.action.type !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing action." },
        { status: 400 },
      );
    }
    const document = await applyLearningHabitsAction(user.id, body.action);
    return NextResponse.json({
      success: true,
      document,
      insights: deriveInsights(document),
      recommendations: deriveRecommendations(document),
      analytics: analyticsSummary(document),
      currentProbe: currentProbe(document),
    });
  } catch (error) {
    console.error("learning-habits POST failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not save Learning & Habits." },
      { status: 500 },
    );
  }
}
