/**
 * Phase 2G-62 — Mastery truth boundary tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  CANONICAL_ULE_MASTERY_SOURCE,
  LEGACY_TOPIC_PROGRESS_SOURCE,
  TOPIC_PROGRESS_LEARNER_COPY,
  assertNoMasteryMerge,
  isCanonicalUleMasterySource,
  isLegacyTopicProgressSource,
  masteryTruthBoundarySummary,
  resolveLearnerFacingUleMastery,
  resolveLearnerFacingUleMasteryIgnoringTopicProgress,
  resolveTopicCourseProgress,
} from "@/lib/learning/mastery/mastery-truth";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-62 mastery truth boundary", () => {
  it("1–2. ConceptMastery is canonical ULE; TopicMastery is legacy topic progress", () => {
    expect(CANONICAL_ULE_MASTERY_SOURCE).toBe("ConceptMastery");
    expect(LEGACY_TOPIC_PROGRESS_SOURCE).toBe("TopicMastery");
    expect(isCanonicalUleMasterySource("ConceptMastery")).toBe(true);
    expect(isLegacyTopicProgressSource("TopicMastery")).toBe(true);
    expect(isCanonicalUleMasterySource("TopicMastery")).toBe(false);

    const summary = masteryTruthBoundarySummary();
    expect(summary.uleMastery).toBe("ConceptMastery");
    expect(summary.topicProgress).toBe("TopicMastery");
    expect(summary.mayMerge).toBe(false);
    expect(summary.learnerFacingUleFallsBackToTopicMastery).toBe(false);
  });

  it("3. no helper combines / averages the two stores", () => {
    const source = read("src/lib/learning/mastery/mastery-truth.ts");
    expect(source).not.toMatch(/\bavg\s*\(|Math\.max\s*\(|blendFacets|mergeFacets|combinedMastery/);
    expect(source).toContain("MUST NOT be averaged");
    expect(source).toContain("mayMerge: false");
    expect(source).not.toContain("function merge");
    assertNoMasteryMerge();
  });

  it("4–5. ULE learner-facing helpers never fall back to TopicMastery / fabricate", () => {
    const richTopic = {
      proficiency: 0.9,
      understanding: 0.85,
      recall: 0.9,
      application: 0.8,
      confidence: 0.7,
      reviewCount: 12,
    };

    expect(resolveLearnerFacingUleMastery(null)).toMatchObject({
      status: "unavailable",
      source: "ConceptMastery",
      reason: "missing_concept_mastery",
    });

    expect(
      resolveLearnerFacingUleMasteryIgnoringTopicProgress({
        conceptMastery: null,
        topicMastery: richTopic,
      }),
    ).toMatchObject({
      status: "unavailable",
      reason: "missing_concept_mastery",
    });

    expect(
      resolveLearnerFacingUleMastery({
        recognize: 0.5,
        explain: 0.4,
        apply: 0.3,
        solve: 0,
        perform: 0,
        retain: 0.2,
        confidence: 0.1,
        reviewCount: 0,
      }),
    ).toMatchObject({
      status: "unavailable",
      reason: "no_ule_reviews",
    });

    const available = resolveLearnerFacingUleMastery({
      recognize: 0.6,
      explain: 0.5,
      apply: 0.4,
      solve: 0.1,
      perform: 0,
      retain: 0.55,
      confidence: 0.3,
      reviewCount: 3,
    });
    expect(available.status).toBe("available");
    if (available.status === "available") {
      expect(available.source).toBe("ConceptMastery");
      expect(available.facets.recognize).toBe(0.6);
      expect(available.facets.retain).toBe(0.55);
    }
  });

  it("6. Topic/course progress can still use TopicMastery", () => {
    expect(resolveTopicCourseProgress(null).status).toBe("unavailable");
    const progress = resolveTopicCourseProgress({
      proficiency: 0.42,
      understanding: 0.4,
      recall: 0.5,
      application: 0.35,
      confidence: 0.2,
      reviewCount: 4,
    });
    expect(progress).toMatchObject({
      status: "available",
      source: "TopicMastery",
      proficiency: 0.42,
      reviewCount: 4,
    });
    expect(TOPIC_PROGRESS_LEARNER_COPY.shortLabel).toBe("Topic progress");
  });

  it("7. MasteryTree remains TopicMastery-based with clarified progress labels", () => {
    const tree = read("src/components/csl/MasteryTree.tsx");
    expect(tree).toContain("/api/mastery");
    expect(tree).toContain("TOPIC_PROGRESS_LEARNER_COPY");
    expect(tree).toContain("topic.proficiency");
    expect(tree).not.toMatch(/getLearnerConceptMastery|resolveLearnerFacingUleMastery/);

    const api = read("app/api/mastery/route.ts");
    expect(api).toContain("masteries");
    expect(api).not.toMatch(/conceptMastery|getLearnerConceptMastery/);
  });

  it("8. Orchestrator TopicMastery fallback and writers remain intact", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("usedTopicMasteryFallback");
    expect(diagnose).toContain("effectiveFacetsForOrchestration");

    expect(read("src/lib/quizzes/mastery.ts")).toContain("db.topicMastery.upsert");
    expect(read("src/lib/learning/mastery/apply.ts")).toContain(
      "db.conceptMastery.upsert",
    );
    expect(read("src/lib/learning/mastery/apply.ts")).toContain(
      "Does not replace TopicMastery",
    );
  });

  it("9–10. architectural invariant: dual paths coexist, ULE path is Attempt→ConceptMastery", () => {
    const boundary = read("src/lib/learning/mastery/mastery-truth.ts");
    expect(boundary).toContain("LearningAttempt");
    expect(boundary).toContain("ConceptMastery");
    expect(boundary).toContain("TopicMastery");
    expect(boundary).toContain("mayCoexist: true");
    expect(boundary).toContain("learnerFacingUleFallsBackToTopicMastery: false");

    const report = read("src/lib/learning/MASTERY_TRUTH_BOUNDARY.md");
    expect(report).toContain("2G-62");
    expect(report).toContain("ConceptMastery = ULE mastery");
    expect(report).toContain("TopicMastery = legacy topic/course progress");
  });
});
