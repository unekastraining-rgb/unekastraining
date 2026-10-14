/**
 * Phase 2G-69 — Adaptive learner-state / why-this-step visibility.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import {
  buildAdaptiveLearnerStateVisibility,
  insufficientAdaptiveLearnerStateVisibility,
} from "@/lib/learning/sequence/adaptive-learner-state";
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
    conceptTitle: "Exceptions",
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

describe("Phase 2G-69 adaptive learner-state presentation", () => {
  it("T1 — ConceptMastery-derived mastery summary on Orchestrator result", () => {
    const result = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
    );
    const vis = buildAdaptiveLearnerStateVisibility(result);
    expect(vis.masterySummary.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    expect(vis.masterySummary.kind).toBe("meaningful");
    expect(vis.masterySummary.stateLabel.toLowerCase()).toMatch(
      /practice|developing|strong/,
    );
  });

  it("T2 — TopicMastery never used in Adaptive learner-state helper", () => {
    const helper = read(
      "src/lib/learning/sequence/adaptive-learner-state.ts",
    );
    expect(helper).toContain("Never diagnoses, never writes evidence/mastery, never uses TopicMastery");
    expect(helper).toContain("buildOrchestratorMasterySummary");
    expect(helper).not.toMatch(/topicMastery\.|updateTopicMastery|proficiency/);
  });

  it("T3 — missing / insufficient ConceptMastery → truthful insufficient", () => {
    const result = orchestrateFromLearnerState(
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
    const vis = buildAdaptiveLearnerStateVisibility(result);
    expect(vis.masterySummary.kind).toBe("insufficient_evidence");
    expect(vis.masterySummary.stateLabel.toLowerCase()).toMatch(
      /not enough evidence/,
    );

    const placeholder = insufficientAdaptiveLearnerStateVisibility();
    expect(placeholder.masterySummary.kind).toBe("insufficient_evidence");
    expect(placeholder.whyThisStep).toBeNull();
  });

  it("T4 — Orchestrator reason becomes whyThisStep when safe", () => {
    const result = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
    );
    const vis = buildAdaptiveLearnerStateVisibility(result);
    expect(vis.whyThisStep).toBeTruthy();
    expect(vis.whyThisStep!.length).toBeGreaterThan(10);
  });

  it("T5/T6 — NO_INTERVENTION omits why; enums never appear in copy", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 6,
        evidenceSourceCounts: {
          quiz: 2,
          flashcard: 2,
          study_evaluate: 2,
          other: 0,
        },
        facets: {
          recognize: 0.8,
          explain: 0.8,
          apply: 0.8,
          perform: 0.8,
          retain: 0.8,
        },
      }),
    );
    expect(result.diagnosis).toBe("NO_INTERVENTION");
    const vis = buildAdaptiveLearnerStateVisibility(result);
    expect(vis.whyThisStep).toBeNull();

    const polluted = buildAdaptiveLearnerStateVisibility({
      ...result,
      diagnosis: "APPLICATION_GAP",
      reason: "INTERNAL APPLICATION_GAP RECOGNIZE leak",
      intervention: {
        kind: "six",
        sixComponent: "hands-on-practice",
        title: "Hands-on Practice",
        emoji: "",
        href: "/study/six/hands-on-practice",
      },
    });
    expect(polluted.whyThisStep).not.toMatch(/APPLICATION_GAP|RECOGNIZE/);
    // Falls back to safe short line (not the polluted reason).
    expect(polluted.whyThisStep).toMatch(/practice applying/i);
  });

  it("T7 — no raw mastery/evidence internals in learner copy", () => {
    const result = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
    );
    const vis = buildAdaptiveLearnerStateVisibility(result);
    const blob = `${vis.whyThisStep} ${vis.masterySummary.stateLabel} ${vis.masterySummary.focusHint ?? ""}`;
    expect(blob).not.toMatch(
      /LearningAttempt|OrchestratorResult|EvidenceEnvelope|0\.\d{2}/,
    );
  });
});

const {
  mockResumeAdaptiveSequenceRun,
  mockConceptFindFirst,
  mockTopicFindFirst,
  mockOrchestrateForConcept,
} = vi.hoisted(() => ({
  mockResumeAdaptiveSequenceRun: vi.fn(),
  mockConceptFindFirst: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockOrchestrateForConcept: vi.fn(),
}));

vi.mock("@/lib/learning/sequence/coordinator", () => ({
  resumeAdaptiveSequenceRun: mockResumeAdaptiveSequenceRun,
}));

vi.mock("@/lib/learning/orchestrator", () => ({
  orchestrateForConcept: mockOrchestrateForConcept,
}));

vi.mock("@/lib/db", () => ({
  db: {
    concept: { findFirst: mockConceptFindFirst },
    topic: { findFirst: mockTopicFindFirst },
    quiz: { findFirst: vi.fn() },
    learningObject: { findFirst: vi.fn() },
  },
}));

import { loadAdaptiveRunPageView } from "@/lib/learning/sequence/adaptive-run-page";

describe("Phase 2G-69 Adaptive run page learnerState wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConceptFindFirst.mockResolvedValue({ title: "Exceptions" });
    mockTopicFindFirst.mockResolvedValue({
      id: "topic-1",
      name: "Exceptions",
      courseId: "course-1",
    });
  });

  it("T1/T8/T9 — ACTIVE load attaches learnerState; page load does not write evidence", async () => {
    mockResumeAdaptiveSequenceRun.mockResolvedValue({
      kind: "active",
      run: {
        id: "run-a",
        userId: "user-a",
        conceptId: "concept-a",
        status: "ACTIVE",
        currentStepIndex: 0,
        steps: [{ intervention: "hands-on-practice", learningObjectId: null }],
        interventionHistory: [],
        lastAttemptId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      currentStep: {
        intervention: "hands-on-practice",
        learningObjectId: null,
      },
      awaitingNext: false,
    });
    mockOrchestrateForConcept.mockResolvedValue(
      orchestrateFromLearnerState(
        summary({
          facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
        }),
      ),
    );

    const view = await loadAdaptiveRunPageView("user-a", "run-a");
    expect(view.kind).toBe("active");
    if (view.kind !== "active") return;
    expect(view.learnerState?.masterySummary.source).toBe(
      CANONICAL_ULE_MASTERY_SOURCE,
    );
    expect(view.learnerState?.whyThisStep).toBeTruthy();
    expect(mockOrchestrateForConcept).toHaveBeenCalledWith(
      "user-a",
      "concept-a",
    );

    const model = read("src/lib/learning/sequence/adaptive-run-page.ts");
    expect(model).not.toMatch(/recordEvidence|applyEvidenceToMastery/);
    expect(model).toContain("Never creates evidence");
  });

  it("T15 — foreign run remains not_found (ownership)", async () => {
    mockResumeAdaptiveSequenceRun.mockResolvedValue({ kind: "not_found" });
    const view = await loadAdaptiveRunPageView("user-a", "foreign");
    expect(view.kind).toBe("not_found");
    expect(mockOrchestrateForConcept).not.toHaveBeenCalled();
  });

  it("T16/T17 — shell renders server learnerState only; no client mastery props", () => {
    const shell = read("src/components/study/AdaptiveSequenceRunShell.tsx");
    expect(shell).toContain("data-adaptive-learner-state");
    expect(shell).toContain("data-adaptive-why-this-step");
    expect(shell).toContain("view.learnerState");
    expect(shell).not.toMatch(/props\.mastery|props\.whyThisStep|fakeMastery/);
    expect(shell).toContain("data-adaptive-complete");
    expect(shell).toContain("data-adaptive-abandon");
    expect(shell).toContain("data-adaptive-continue-six");
  });

  it("T10–T14/T18–T21 — progression, CORE bridge, Hub mastery, intent, LUCKY unchanged", () => {
    const shell = read("src/components/study/AdaptiveSequenceRunShell.tsx");
    expect(shell).toContain("/api/study/adaptive/${view.runId}/${action}");
    expect(shell).toContain('postLifecycle("complete")');
    expect(shell).toContain('postLifecycle("abandon")');

    const coreBridge = read(
      "src/lib/learning/orchestrator/core-adaptive-bridge.ts",
    );
    expect(coreBridge).toContain("Continue learning");

    const hubSummary = read(
      "src/lib/learning/orchestrator/present-mastery-summary.ts",
    );
    expect(hubSummary).toContain("Phase 2G-63");

    const lucky = read("src/lib/learning/sequence/coordinator.ts");
    expect(lucky).toContain("syncLuckyRetentionAfterSequenceComplete");

    const intent = read("src/lib/learning/intent/types.ts");
    expect(intent).toContain("UNDERSTAND");
    expect(intent).toContain("PRACTICE");
    expect(intent).toContain("ASSESS");
    expect(intent).toContain("CREATE");
  });

  it("T22 — mobile touch targets preserved on Adaptive shell", () => {
    const shell = read("src/components/study/AdaptiveSequenceRunShell.tsx");
    expect(shell).toContain("min-h-11");
    expect(shell).toContain("touch-manipulation");
  });
});
