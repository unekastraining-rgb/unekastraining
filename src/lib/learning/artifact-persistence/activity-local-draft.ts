/**
 * Activity workspace local draft — navigate/refresh recovery.
 * Not server truth; never LearningAttempt / mastery.
 * Reuses the same evidence boundary as CORE local drafts (2P-50).
 */

export type ActivityLocalDraft = {
  /** Stable key: kind + conceptId + challengeId (+ adaptiveRunId). */
  draftKey: string;
  kind: string;
  conceptId: string;
  challengeId: string;
  adaptiveRunId: string | null;
  work: string;
  revisionText: string;
  savedAt: string;
};

const PREFIX = "study-haul-activity-draft-v1:";

export function activityDraftStorageKey(draftKey: string): string {
  return `${PREFIX}${draftKey.trim()}`;
}

export function buildActivityDraftKey(input: {
  kind: string;
  conceptId: string;
  challengeId: string;
  adaptiveRunId?: string | null;
}): string {
  const run = (input.adaptiveRunId ?? "").trim() || "none";
  return [
    input.kind.trim(),
    input.conceptId.trim(),
    input.challengeId.trim(),
    run,
  ].join("|");
}

export function writeActivityLocalDraft(
  draft: ActivityLocalDraft,
  storage: Pick<Storage, "setItem"> = globalThis.localStorage,
): void {
  if (typeof storage?.setItem !== "function") return;
  const key = draft.draftKey.trim();
  if (!key || (!draft.work.trim() && !draft.revisionText.trim())) return;
  try {
    storage.setItem(
      activityDraftStorageKey(key),
      JSON.stringify({
        ...draft,
        draftKey: key,
        savedAt: draft.savedAt || new Date().toISOString(),
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function readActivityLocalDraft(
  draftKey: string,
  storage: Pick<Storage, "getItem"> = globalThis.localStorage,
): ActivityLocalDraft | null {
  if (typeof storage?.getItem !== "function") return null;
  const key = draftKey.trim();
  if (!key) return null;
  try {
    const raw = storage.getItem(activityDraftStorageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivityLocalDraft;
    if (
      !parsed ||
      parsed.draftKey !== key ||
      typeof parsed.work !== "string" ||
      typeof parsed.revisionText !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearActivityLocalDraft(
  draftKey: string,
  storage: Pick<Storage, "removeItem"> = globalThis.localStorage,
): void {
  if (typeof storage?.removeItem !== "function") return;
  try {
    storage.removeItem(activityDraftStorageKey(draftKey.trim()));
  } catch {
    /* ignore */
  }
}

export function activityLocalDraftTruthSummary(): {
  draftIsNotLearningAttempt: true;
  draftIsNotMastery: true;
  notServerAuthoritative: true;
  inventsSecondPersistenceEngine: false;
} {
  return {
    draftIsNotLearningAttempt: true,
    draftIsNotMastery: true,
    notServerAuthoritative: true,
    inventsSecondPersistenceEngine: false,
  };
}
