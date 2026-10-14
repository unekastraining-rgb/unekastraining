/**
 * 2P-48 — Universal content depth & all-ages learning.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  preferredDifficultyFromSignals,
  preferredStagesFromLevelSignals,
  listDepthLadder,
  contentLevelTruthSummary,
} from "@/lib/learning/content-level";
import { resolveLearningExperience } from "@/lib/learning/experience";
import { selectProgressionContent } from "@/lib/learning/content-progression";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { ORCHESTRATOR_FACET_WEAK } from "@/lib/learning/orchestrator/diagnose";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("2P-48 content-level truth", () => {
  it("forbids age engines and age overriding mastery", () => {
    const t = contentLevelTruthSummary();
    expect(t.inventsGradeSchoolEngine).toBe(false);
    expect(t.inventsAdultLearningEngine).toBe(false);
    expect(t.inventsGradeGap).toBe(false);
    expect(t.inventsAgeGap).toBe(false);
    expect(t.ageOverridesMastery).toBe(false);
    expect(t.difficultyIndependentOfMastery).toBe(true);
  });
});

describe("2P-48 preferredDifficultyFromSignals", () => {
  it("weak understanding prefers foundational difficulty", () => {
    expect(
      preferredDifficultyFromSignals({
        facets: {
          recognize: 0.1,
          explain: 0.1,
          apply: 0,
          solve: 0,
          perform: 0,
        },
      }),
    ).toBe(2);
    expect(
      preferredDifficultyFromSignals({
        facets: {
          recognize: 0.1,
          explain: 0.1,
          apply: 0,
          solve: 0,
          perform: 0,
        },
        teachingStyle: "SIMPLIFIED",
      }),
    ).toBe(1);
  });

  it("strong application prefers deeper difficulty even if ageBand claims child", () => {
    const deep = preferredDifficultyFromSignals({
      facets: {
        recognize: 0.8,
        explain: 0.8,
        apply: 0.75,
        solve: 0.8,
        perform: 0.7,
      },
      ageBand: "child",
      educationLevel: "grade-3",
      clientClaimedDifficulty: 1,
    });
    expect(deep).toBeGreaterThanOrEqual(3);
    expect(deep).not.toBe(1);
  });

  it("ageBand alone does not invent difficulty when no facet evidence", () => {
    // No facets → style/intervention may still soft-prefer; age alone ignored.
    const none = preferredDifficultyFromSignals({
      ageBand: "elementary",
      educationLevel: "K-2",
    });
    // Without facets/style/intervention, returns null (no age-driven invent).
    expect(none).toBeNull();
  });

  it("deterministic for equivalent inputs", () => {
    const input = {
      facets: {
        recognize: 0.2,
        explain: 0.2,
        apply: 0.1,
        solve: 0,
        perform: 0,
      },
      teachingStyle: "BEGINNER" as const,
    };
    expect(preferredDifficultyFromSignals(input)).toEqual(
      preferredDifficultyFromSignals(input),
    );
  });
});

describe("2P-48 proportional-scaling depth ladder", () => {
  it("same concept has multi-stage and multi-difficulty content", () => {
    const ladder = listDepthLadder("proportional-scaling");
    expect(ladder.entryCount).toBeGreaterThanOrEqual(4);
    expect(ladder.hasMultiStage).toBe(true);
    expect(ladder.hasMultiDifficulty).toBe(true);
    expect(ladder.contentIds).toContain("lab-proportional-scale");
    expect(ladder.contentIds).toContain("lab-proportional-scale-blocks");
    expect(ladder.contentIds).toContain("lab-proportional-scale-rate");
  });

  it("preferredDifficulty 1 selects concrete blocks; 4 selects rate challenge", () => {
    const easy = selectProgressionContent({
      conceptKey: "proportional-scaling",
      eligibleActivityKinds: ["lab"],
      preferredDifficulty: 1,
      interventionPreference: "understand",
    });
    expect(easy.ok).toBe(true);
    if (easy.ok) {
      expect(easy.entry.difficulty).toBeLessThanOrEqual(2);
      expect(easy.entry.contentId).toMatch(/blocks|proportional-scale/);
    }

    const hard = selectProgressionContent({
      conceptKey: "proportional-scaling",
      eligibleActivityKinds: ["lab"],
      preferredDifficulty: 4,
      interventionPreference: "challenge",
    });
    expect(hard.ok).toBe(true);
    if (hard.ok) {
      expect(hard.entry.difficulty).toBeGreaterThanOrEqual(3);
      expect(hard.entry.contentId).not.toBe("lab-proportional-scale-blocks");
    }
  });

  it("resolveLearningExperience respects preferredDifficulty", () => {
    const beginner = resolveLearningExperience({
      conceptId: "c-prop",
      conceptTitle: "Proportional scaling",
      activityKind: "lab",
      preferredDifficulty: 1,
    });
    const advanced = resolveLearningExperience({
      conceptId: "c-prop",
      conceptTitle: "Proportional scaling",
      activityKind: "lab",
      preferredDifficulty: 4,
    });
    expect(beginner.recommendedContentId).toBeTruthy();
    expect(advanced.recommendedContentId).toBeTruthy();
    expect(beginner.recommendedContentId).not.toBe(
      advanced.recommendedContentId,
    );
  });

  it("challenge content exists in structured catalog", () => {
    expect(getStructuredChallenge("lab-proportional-scale-blocks")).toBeTruthy();
    expect(getStructuredChallenge("lab-proportional-scale-rate")).toBeTruthy();
  });
});

describe("2P-48 stages + orchestrator wiring", () => {
  it("weak understand soft-prefers INTRODUCE/UNDERSTAND stages", () => {
    const stages = preferredStagesFromLevelSignals({
      interventionPreference: "practice",
      facets: { explain: ORCHESTRATOR_FACET_WEAK - 0.1, recognize: 0.1 },
      prerequisiteHintPresent: true,
    });
    expect(stages[0]).toMatch(/INTRODUCE|UNDERSTAND/);
  });

  it("no GRADE_GAP / AGE_GAP in diagnose; GET wires preferredDifficulty", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).not.toContain("GRADE_GAP");
    expect(diagnose).not.toContain("AGE_GAP");
    const route = read("app/api/study/activities/[kind]/route.ts");
    expect(route).toContain("preferredDifficultyFromSignals");
    expect(route).toContain("contentLevelHints");
  });

  it("LUCKY unchanged — no AgeRetention", () => {
    expect(read("src/lib/learning/retention/review.ts")).not.toContain(
      "AgeRetention",
    );
    expect(read("src/lib/learning/retention/review.ts")).not.toContain(
      "GradeRetention",
    );
  });
});
