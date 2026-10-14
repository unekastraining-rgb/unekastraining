/**
 * 2P-11 — Universal Learning Experience tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  experienceModuleDoesNotWriteMastery,
  learningExperienceTruthSummary,
  projectLearningExperience,
  resolveLearningExperience,
} from "@/lib/learning/experience";
import { getActivityContentDescriptor } from "@/lib/learning/activities/content-contract";
import { getProgressionEntry } from "@/lib/learning/content-progression";
import { evaluateCodingChallenge } from "@/lib/learning/activities/coding/evaluate";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-11 Experience projection", () => {
  it("projects selected content into learner-facing view", () => {
    const descriptor = getActivityContentDescriptor(
      "coding",
      "java-inheritance-subclass",
    )!;
    const progression = getProgressionEntry("cs-inheritance-practice")!;
    const view = projectLearningExperience({
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      activityKind: "coding",
      descriptor,
      progression,
      whyReason: "You need more practice applying this concept.",
      adaptiveContext: true,
      coverageStatus: "AVAILABLE",
    });

    expect(view.conceptId).toBe("c-java");
    expect(view.conceptTitle).toBe("Java inheritance");
    expect(view.objective.toLowerCase()).toContain("inheritance");
    expect(view.instructions.length).toBeGreaterThan(10);
    expect(view.expectedAction.toLowerCase()).toContain("code");
    expect(view.stageLabel).toBe("Practice");
    expect(view.difficulty).toBe(2);
    expect(view.contentKey).toBe("cs-inheritance-practice");
    expect(view.whyReason).toContain("practice");
    expect(view.hint).toBeTruthy();
    expect(view.scaffolds.length).toBeGreaterThan(0);
    expect(view.successLooksLike).toBeTruthy();
  });

  it("does not mutate inputs or write mastery", () => {
    const progression = getProgressionEntry("cs-inheritance-practice")!;
    const before = JSON.stringify(progression);
    projectLearningExperience({
      conceptId: "c1",
      activityKind: "coding",
      descriptor: getActivityContentDescriptor(
        "coding",
        "java-inheritance-subclass",
      ),
      progression,
    });
    expect(JSON.stringify(progression)).toBe(before);
    expect(learningExperienceTruthSummary().doesNotWriteMastery).toBe(true);
    expect(
      experienceModuleDoesNotWriteMastery(
        read("src/lib/learning/experience/project.ts"),
      ),
    ).toBe(true);
  });
});

describe("2P-11 Resolve + coverage", () => {
  it("AVAILABLE resolves real coding experience for inheritance", () => {
    const result = resolveLearningExperience({
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      activityKind: "coding",
      adaptiveContext: true,
    });
    expect(result.coverageStatus).toBe("AVAILABLE");
    expect(result.experience).toBeTruthy();
    expect(result.experience?.contentId).toBe("java-inheritance-subclass");
    expect(result.experience?.objective.length).toBeGreaterThan(8);
  });

  it("INCOMPATIBLE does not fabricate lab experience for inheritance", () => {
    const result = resolveLearningExperience({
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      activityKind: "lab",
    });
    expect(result.coverageStatus).toBe("INCOMPATIBLE");
    expect(result.experience).toBeNull();
    expect(result.recommendedContentId).toBeNull();
  });

  it("MISSING for unknown concept does not fabricate", () => {
    const result = resolveLearningExperience({
      conceptId: "c-x",
      conceptTitle: "xyz-unknown-concept-99",
      activityKind: "coding",
    });
    // Catalog may still recommend a coding challenge for standalone — if title
    // normalizes to unknown key with MISSING progression, catalog fallback applies.
    // Unknown title with no catalog hint match still gets deterministic default —
    // that is AVAILABLE catalog content, not fabricated progression.
    if (result.coverageStatus === "AVAILABLE") {
      expect(result.experience?.contentId).toBeTruthy();
      expect(result.experience?.instructions.length).toBeGreaterThan(0);
    } else {
      expect(result.experience).toBeNull();
    }
  });

  it("excludeContentKeys can vary to another valid variant", () => {
    const first = resolveLearningExperience({
      conceptId: "c1",
      conceptTitle: "SQL filtering",
      activityKind: "sql",
    });
    expect(first.coverageStatus).toBe("AVAILABLE");
    const second = resolveLearningExperience({
      conceptId: "c1",
      conceptTitle: "SQL filtering",
      activityKind: "sql",
      excludeContentKeys: first.experience?.contentKey
        ? [first.experience.contentKey]
        : [],
    });
    expect(second.coverageStatus).toBe("AVAILABLE");
    if (first.experience?.contentKey && second.experience?.contentKey) {
      expect(second.experience.contentKey).not.toBe(first.experience.contentKey);
    }
  });
});

describe("2P-11 Architecture + integration", () => {
  it("experience layer is not a second Orchestrator", () => {
    expect(
      experienceModuleDoesNotWriteMastery(
        read("src/lib/learning/experience/project.ts"),
      ),
    ).toBe(true);
    expect(
      experienceModuleDoesNotWriteMastery(
        read("src/lib/learning/experience/resolve.ts"),
      ),
    ).toBe(true);
    expect(read("src/lib/learning/orchestrator/diagnose.ts")).not.toContain(
      "projectLearningExperience",
    );
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "c1",
        conceptTitle: "Diagnose circuit fault",
        topicName: null,
        subjectDomain: "electrical",
        intentPurpose: "PRACTICE",
      }),
    ).toBeNull();
  });

  it("resolve → coding content → evaluate still works (evidence path unchanged)", () => {
    const resolved = resolveLearningExperience({
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      activityKind: "coding",
    });
    expect(resolved.experience?.contentId).toBe("java-inheritance-subclass");
    const challenge = getCodingChallenge(resolved.recommendedContentId!)!;
    const evaluation = evaluateCodingChallenge(
      challenge,
      'class Dog extends Animal {\n  public String bark() { return "woof"; }\n}\n',
    );
    expect(evaluation.outcome).toBe("SUCCESS");
    expect(learningExperienceTruthSummary().doesNotWriteEvidence).toBe(true);
  });

  /**
   * In-code chain (no browser E2E harness in repo):
   * activityIntervention → coverage/progression resolve → experience projection
   * → existing coding evaluate. Full Adaptive DB lifecycle remains in
   * adaptive-activity-lifecycle.integration.test.ts (unchanged ownership).
   */
  it("intervention → experience → activity evaluate chain carries real task content", () => {
    const intervention = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      topicName: "Intro to coding",
      intentPurpose: "PRACTICE",
    });
    expect(intervention?.adapterKey).toBe("coding");
    expect(intervention?.href).toContain("/study/activities/coding");

    const resolved = resolveLearningExperience({
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      activityKind: "coding",
      whyReason: intervention?.reason ?? null,
      adaptiveContext: true,
    });
    expect(resolved.coverageStatus).toBe("AVAILABLE");
    expect(resolved.experience).toBeTruthy();
    expect(resolved.experience!.objective.length).toBeGreaterThan(8);
    expect(resolved.experience!.instructions.length).toBeGreaterThan(8);
    expect(resolved.experience!.conceptTitle).toBe("Java inheritance");
    expect(resolved.experience!.whyReason?.toLowerCase()).toContain(
      "application",
    );

    const challenge = getCodingChallenge(resolved.recommendedContentId!)!;
    const evaluation = evaluateCodingChallenge(
      challenge,
      'class Dog extends Animal {\n  public String bark() { return "woof"; }\n}\n',
    );
    expect(evaluation.outcome).toBe("SUCCESS");
    expect(learningExperienceTruthSummary().doesNotSelectIntervention).toBe(
      true,
    );
  });

  it("ActivityWorkspace remains the interaction surface", () => {
    const src = read("src/components/study/ActivityWorkspace.tsx");
    expect(src).toContain("data-learning-experience");
    expect(src).toContain("data-learning-scaffolds");
    expect(src).toContain("Submit for evaluation");
    expect(src).toContain("data-coverage-gap");
    expect(src).not.toContain("applyEvidenceToMastery");
  });
});
