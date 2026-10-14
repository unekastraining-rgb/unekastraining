import { db } from "@/lib/db";
import { getOrCreateLearnerProfile } from "@/lib/learning/learner-profile";
import { upsertRetentionItem } from "@/lib/learning/retention/service";

import {
  parseLearningHabitsDocument,
  stripLearningHabitsDocument,
  writeLearningHabitsDocument,
  type LearningHabitsDocument,
} from "./document";
import { reduceLearningHabits, type HabitsAction } from "./engine";

export async function loadLearningHabits(
  userId: string,
): Promise<{ settingsJson: string; doc: LearningHabitsDocument }> {
  const profile = await getOrCreateLearnerProfile(userId);
  return {
    settingsJson: profile.settingsJson,
    doc: parseLearningHabitsDocument(profile.settingsJson),
  };
}

export async function saveLearningHabits(
  userId: string,
  settingsJson: string,
  doc: LearningHabitsDocument,
): Promise<void> {
  await db.learnerProfile.update({
    where: { userId },
    data: { settingsJson: writeLearningHabitsDocument(settingsJson, doc) },
  });
}

export async function applyLearningHabitsAction(
  userId: string,
  action: HabitsAction,
): Promise<LearningHabitsDocument> {
  const { settingsJson, doc } = await loadLearningHabits(userId);
  if (action.type === "delete-feature-data") {
    await db.learnerProfile.update({
      where: { userId },
      data: { settingsJson: stripLearningHabitsDocument(settingsJson) },
    });
    return reduceLearningHabits(doc, action);
  }
  const next = reduceLearningHabits(doc, action);
  await saveLearningHabits(userId, settingsJson, next);
  if (
    action.type === "submit-probe" &&
    next.settings.reviewReminders &&
    next.reviews.length > doc.reviews.length
  ) {
    const added = next.reviews[next.reviews.length - 1];
    if (added) {
      try {
        await upsertRetentionItem({
          userId,
          sourceType: "TUTOR_FLAG",
          sourceRef: `learning-habits:${added.id}`,
          dueAt: new Date(added.dueAt),
          metadata: {
            origin: "learning-habits",
            conceptLabel: added.conceptLabel,
          },
        });
      } catch {
        // Review remains in the Learning & Habits document if retention sync fails.
      }
    }
  }
  return next;
}
