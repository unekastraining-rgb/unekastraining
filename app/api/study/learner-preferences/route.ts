import { NextResponse } from "next/server";

import { getOrCreateLearnerProfile } from "@/lib/learning/learner-profile";
import {
  LEARN_PREFERENCE_KEYS,
  parseLearnPreferenceKeys,
  serializeLearnPreferences,
  type LearnPreferenceKey,
} from "@/lib/learning/learner-preferences";
import { getOrCreateDefaultUser } from "@/lib/user";
import { db } from "@/lib/db";

/** GET /api/study/learner-preferences — how the learner prefers to learn. */
export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const profile = await getOrCreateLearnerProfile(user.id);
    const preferences = parseLearnPreferenceKeys(profile.modalityPreferencesJson);
    return NextResponse.json({
      success: true,
      preferences,
      keys: LEARN_PREFERENCE_KEYS,
    });
  } catch (error) {
    console.error("learner-preferences GET failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not load learning preferences." },
      { status: 500 },
    );
  }
}

/** PATCH /api/study/learner-preferences — save multi-select preferences. */
export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as { preferences?: unknown };
    const raw = Array.isArray(body.preferences) ? body.preferences : [];
    const keys = raw.filter(
      (k): k is LearnPreferenceKey =>
        typeof k === "string" &&
        (LEARN_PREFERENCE_KEYS as readonly string[]).includes(k),
    );
    const modalityPreferencesJson = serializeLearnPreferences(keys);
    await getOrCreateLearnerProfile(user.id);
    await db.learnerProfile.update({
      where: { userId: user.id },
      data: { modalityPreferencesJson },
    });
    return NextResponse.json({
      success: true,
      preferences: parseLearnPreferenceKeys(modalityPreferencesJson),
    });
  } catch (error) {
    console.error("learner-preferences PATCH failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not save learning preferences." },
      { status: 500 },
    );
  }
}
