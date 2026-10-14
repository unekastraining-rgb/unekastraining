/**
 * Phase 2G-63 — ConceptMastery learner-facing presentation summary.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import { presentOrchestratorSuggestion } from "@/lib/learning/orchestrator/present";
import {
  buildOrchestratorMasterySummary,
  masterySummaryUsesOnlyConceptMastery,
} from "@/lib/learning/orchestrator/present-mastery-summary";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function summary(
  partial: Omit<Partial<LearnerConceptMasterySummary>, "facets"> & {
    facets?: Partial<LearnerConceptMasterySummary["facets"]>;
  },
): LearnerConceptMasterySummary {
  return {
    learnerId: "user-1",
    conceptId: "concept-1",
    conceptTitle: "Java Exceptions",
    facets: { ...emptyFacetScores(), ...partial.facets },
    topicMastery: partial.topicMastery ?? null,
    recentMissedCount: 0,
    evidenceSourceCounts: partial.evidenceSourceCounts ?? {
      quiz: 2,
      flashcard: 1,
      study_evaluate: 1,
      other: 0,
    },
    reviewCount: partial.reviewCount ?? 4,
    lastReviewedAt: null,
    nextReviewAt: null,
  };
}

describe("Phase 2G-63 buildOrchestratorMasterySummary", () => {
  it("1–2. uses ConceptMastery only; TopicMastery cannot supply ULE value", () => {
    const result = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
    );
    const mastery = buildOrchestratorMasterySummary(result);
    expect(mastery.source).toBe("ConceptMastery");
    expect(masterySummaryUsesOnlyConceptMastery(mastery)).toBe(true);
    expect(mastery.kind).toBe("meaningful");
    expect(mastery.focusFacet).toBe("apply");
    expect(mastery.stateLabel).toMatch(/needs more practice/i);

    const helper = read(
      "src/lib/learning/orchestrator/present-mastery-summary.ts",
    );
    expect(helper).toContain("Never reads TopicMastery");
    expect(helper).not.toMatch(/db\.topicMastery|updateTopicMastery|topic\.masteries/);
    expect(helper).not.toMatch(/\bavg\s*\(|blendFacets|mergeFacets|combinedMastery/);
  });

  it("3–4. missing / insufficient ConceptMastery evidence → evidence-aware state", () => {
    const insufficient = orchestrateFromLearnerState(
      summary({
        reviewCount: 0,
        evidenceSourceCounts: {
          quiz: 0,
          flashcard: 0,
          study_evaluate: 0,
          other: 0,
        },
        facets: emptyFacetScores(),
      }),
    );
    expect(insufficient.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
    const mastery = buildOrchestratorMasterySummary(insufficient);
    expect(mastery.kind).toBe("insufficient_evidence");
    expect(mastery.stateLabel).toMatch(/not enough evidence/i);
    expect(mastery.band).toBeUndefined();

    // TopicMastery fallback must not become a meaningful ULE mastery claim.
    const fallback = buildOrchestratorMasterySummary({
      diagnosis: "APPLICATION_GAP",
      signals: {
        facets: {
          ...emptyFacetScores(),
          recognize: 0.7,
          explain: 0.7,
          apply: 0.2,
          retain: 0.5,
        },
        evidenceSourceCounts: {
          quiz: 0,
          flashcard: 0,
          study_evaluate: 0,
          other: 0,
        },
        reviewCount: 0,
        evidenceSourceKinds: 0,
        usedTopicMasteryFallback: true,
      },
    });
    expect(fallback.kind).toBe("insufficient_evidence");
  });

  it("5. reuses Orchestrator WEAK/STRONG bands (no new mastery math)", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("export const ORCHESTRATOR_FACET_WEAK = 0.45");
    expect(diagnose).toContain("export const ORCHESTRATOR_FACET_STRONG = 0.55");
    const helper = read(
      "src/lib/learning/orchestrator/present-mastery-summary.ts",
    );
    expect(helper).toContain("ORCHESTRATOR_FACET_WEAK");
    expect(helper).toContain("ORCHESTRATOR_FACET_STRONG");
    expect(helper).not.toMatch(/const WEAK\s*=/);
    expect(helper).not.toMatch(/const STRONG\s*=/);
  });
});

describe("Phase 2G-63 presentOrchestratorSuggestion masterySummary", () => {
  it("6–7. diagnosis/intervention unchanged; masterySummary attached", () => {
    const result = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
      { courseId: "course-1", topicId: "topic-1", topicName: "Java Exceptions" },
    );
    expect(result.diagnosis).toBe("APPLICATION_GAP");
    expect(result.intervention?.sixComponent).toBe("hands-on-practice");

    const view = presentOrchestratorSuggestion(result);
    expect(view).not.toBeNull();
    expect(view!.masterySummary?.source).toBe("ConceptMastery");
    expect(view!.masterySummary?.kind).toBe("meaningful");
    expect(view!.recommendationLabel).toMatch(/Hands-on Practice/i);
    expect(view!.reason.length).toBeGreaterThan(10);
    expect(view!.actionLabel).toBe("Try it");
    expect(view!.href).toContain("/study/six/hands-on-practice");
  });

  it("8–10. Hub card keeps Adaptive + SIX CTAs and reason; shows mastery line", () => {
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("data-hub-mastery-summary");
    expect(card).toContain("suggestion.masterySummary");
    expect(card).toContain("data-orchestrator-adaptive-study");
    expect(card).toContain("data-orchestrator-try-it");
    expect(card).toContain("suggestion.reason");
    expect(card).toContain("/api/study/adaptive/start");
    expect(card).not.toMatch(/TopicMastery|topicMastery|overallMastery/);
  });

  it("11–12. no new persistence; no Topic/Concept averaging", () => {
    const present = read("src/lib/learning/orchestrator/present.ts");
    expect(present).toContain("buildOrchestratorMasterySummary");
    expect(present).not.toMatch(/db\.|prisma|topicMastery/);

    const schema = read("prisma/schema.prisma");
    // Unchanged models — smoke that we did not add a new mastery table in this phase.
    expect(schema).toContain("model ConceptMastery");
    expect(schema).toContain("model TopicMastery");
    expect(schema).not.toMatch(/model LearnerMasterySummary|model MasteryVisibility/);
  });
});
