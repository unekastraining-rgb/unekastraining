/**
 * Activity local-draft unit tests — not LearningAttempt.
 */
import { describe, expect, it } from "vitest";

import {
  activityLocalDraftTruthSummary,
  buildActivityDraftKey,
  clearActivityLocalDraft,
  readActivityLocalDraft,
  writeActivityLocalDraft,
} from "@/lib/learning/artifact-persistence/activity-local-draft";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    key: () => null,
  };
}

describe("activity local draft", () => {
  it("round-trips work without claiming evidence", () => {
    const storage = memoryStorage();
    const draftKey = buildActivityDraftKey({
      kind: "writing",
      conceptId: "c1",
      challengeId: "write-1",
      adaptiveRunId: "run-1",
    });
    writeActivityLocalDraft(
      {
        draftKey,
        kind: "writing",
        conceptId: "c1",
        challengeId: "write-1",
        adaptiveRunId: "run-1",
        work: "draft paragraph",
        revisionText: "",
        savedAt: new Date().toISOString(),
      },
      storage,
    );
    const read = readActivityLocalDraft(draftKey, storage);
    expect(read?.work).toBe("draft paragraph");
    clearActivityLocalDraft(draftKey, storage);
    expect(readActivityLocalDraft(draftKey, storage)).toBeNull();

    const t = activityLocalDraftTruthSummary();
    expect(t.draftIsNotLearningAttempt).toBe(true);
    expect(t.draftIsNotMastery).toBe(true);
    expect(t.inventsSecondPersistenceEngine).toBe(false);
  });
});
