import { db } from "@/lib/db";

/** Ensure a LearnerProfile exists. Does not touch UserPreferences. */
export async function getOrCreateLearnerProfile(userId: string) {
  return db.learnerProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      goalsJson: "[]",
      modalityPreferencesJson: "{}",
      accessibilityPreferencesJson: "{}",
      settingsJson: "{}",
    },
  });
}
