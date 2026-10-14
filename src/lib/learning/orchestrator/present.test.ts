import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import { presentOrchestratorSuggestion } from "@/lib/learning/orchestrator/present";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

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

describe("presentOrchestratorSuggestion", () => {
  it("renders recommendation label, reason, and SIX href for an intervention", () => {
    const result = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
      { courseId: "course-1", topicId: "topic-1", topicName: "Java Exceptions" },
    );
    const view = presentOrchestratorSuggestion(result);
    expect(view).not.toBeNull();
    expect(view!.state).toBe("recommendation");
    expect(view!.conceptId).toBe("concept-1");
    expect(view!.activeRunId).toBeNull();
    expect(view!.recommendationLabel).toMatch(/Hands-on Practice/i);
    expect(view!.reason.length).toBeGreaterThan(10);
    expect(view!.actionLabel).toBe("Try it");
    expect(view!.href).toContain("/study/six/hands-on-practice");
    expect(view!.notice.toLowerCase()).toMatch(/practice applying|possible next step/);
    expect(view!.masterySummary?.source).toBe("ConceptMastery");
    expect(view!.masterySummary?.kind).toBe("meaningful");
  });

  it("returns null for NO_INTERVENTION (no unnecessary recommendation)", () => {
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
          apply: 0.75,
          perform: 0.7,
          retain: 0.7,
        },
      }),
    );
    expect(result.diagnosis).toBe("NO_INTERVENTION");
    expect(presentOrchestratorSuggestion(result)).toBeNull();
  });

  it("uses conservative wording for INSUFFICIENT_EVIDENCE", () => {
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
    const view = presentOrchestratorSuggestion(result);
    expect(view!.state).toBe("insufficient");
    expect(view!.softWording).toBe(true);
    expect(view!.notice.toLowerCase()).toMatch(/enough evidence/);
    expect(view!.notice).not.toMatch(/APPLICATION_GAP|UNDERSTANDING_GAP/);
  });

  it("does not present LOW confidence as certainty", () => {
    const result = orchestrateFromLearnerState(
      summary({
        reviewCount: 1,
        evidenceSourceCounts: {
          quiz: 1,
          flashcard: 0,
          study_evaluate: 0,
          other: 0,
        },
        facets: { recognize: 0.2, explain: 0.2 },
      }),
    );
    expect(result.confidence).toBe("LOW");
    const view = presentOrchestratorSuggestion(result);
    expect(view!.softWording).toBe(true);
    expect(view!.recommendationLabel?.toLowerCase()).toMatch(/possible next step/);
    expect(view!.notice.toLowerCase()).not.toMatch(/\byou need\b/);
  });

  it("does not expose internal IDs or diagnosis enums to the learner", () => {
    const result = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.2, explain: 0.2 },
      }),
      { courseId: "course-secret", topicId: "topic-secret" },
    );
    const view = presentOrchestratorSuggestion(result)!;
    const blob = `${view.notice} ${view.reason} ${view.recommendationLabel}`;
    expect(blob).not.toMatch(/APPLICATION_GAP|UNDERSTANDING_GAP|concept-1|course-secret|topic-secret|EvidenceEnvelope|LearningObject/i);
    expect(blob).not.toMatch(/\bHIGH\b|\bMEDIUM\b|\bLOW\b/);
  });
});

const {
  mockTopicFindMany,
  mockConceptMasteryFindMany,
  mockOrchestrateForConcept,
  mockEnsureConceptForTopic,
  mockListActiveAdaptiveSequenceRuns,
} = vi.hoisted(() => ({
  mockTopicFindMany: vi.fn(),
  mockConceptMasteryFindMany: vi.fn(),
  mockOrchestrateForConcept: vi.fn(),
  mockEnsureConceptForTopic: vi.fn(),
  mockListActiveAdaptiveSequenceRuns: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    topic: { findMany: mockTopicFindMany },
    conceptMastery: { findMany: mockConceptMasteryFindMany },
  },
}));

vi.mock("@/lib/learning/orchestrator", async () => {
  const actual = await vi.importActual<typeof import("@/lib/learning/orchestrator")>(
    "@/lib/learning/orchestrator",
  );
  return {
    ...actual,
    orchestrateForConcept: mockOrchestrateForConcept,
  };
});

vi.mock("@/lib/learning/knowledge/concept", () => ({
  ensureConceptForTopic: mockEnsureConceptForTopic,
}));

vi.mock("@/lib/learning/sequence/coordinator", () => ({
  listActiveAdaptiveSequenceRuns: mockListActiveAdaptiveSequenceRuns,
}));

import { getTopOrchestratorSuggestion } from "@/lib/learning/orchestrator/suggest";

describe("getTopOrchestratorSuggestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListActiveAdaptiveSequenceRuns.mockResolvedValue([]);
    mockConceptMasteryFindMany.mockResolvedValue([]);
  });

  it("returns a presented recommendation when Orchestrator finds a gap", async () => {
    mockTopicFindMany.mockResolvedValue([
      {
        id: "topic-1",
        name: "Loops",
        courseId: "course-1",
        conceptId: "concept-1",
        sortOrder: 0,
      },
    ]);
    mockConceptMasteryFindMany.mockResolvedValue([
      {
        conceptId: "concept-1",
        recognize: 0.7,
        explain: 0.65,
        apply: 0.2,
        retain: 0.5,
        reviewCount: 4,
        lastReviewedAt: null,
      },
    ]);
    mockOrchestrateForConcept.mockResolvedValue(
      orchestrateFromLearnerState(
        summary({
          conceptId: "concept-1",
          conceptTitle: "Loops",
          facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
        }),
        {
          courseId: "course-1",
          topicId: "topic-1",
          topicName: "Loops",
        },
      ),
    );

    const view = await getTopOrchestratorSuggestion("user-1", "course-1");
    expect(view?.state).toBe("recommendation");
    expect(view?.conceptId).toBe("concept-1");
    expect(view?.activeRunId).toBeNull();
    expect(view?.href).toContain("/study/six/hands-on-practice");
    expect(view?.actionLabel).toBe("Try it");
    expect(mockListActiveAdaptiveSequenceRuns).toHaveBeenCalledWith(
      "user-1",
      "concept-1",
    );
  });

  it("attaches most recently updated ACTIVE run id without creating a run", async () => {
    mockTopicFindMany.mockResolvedValue([
      {
        id: "topic-1",
        name: "Loops",
        courseId: "course-1",
        conceptId: "concept-1",
        sortOrder: 0,
      },
    ]);
    mockConceptMasteryFindMany.mockResolvedValue([
      {
        conceptId: "concept-1",
        recognize: 0.7,
        explain: 0.65,
        apply: 0.2,
        retain: 0.5,
        reviewCount: 4,
        lastReviewedAt: null,
      },
    ]);
    mockOrchestrateForConcept.mockResolvedValue(
      orchestrateFromLearnerState(
        summary({
          conceptId: "concept-1",
          conceptTitle: "Loops",
          facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
        }),
        {
          courseId: "course-1",
          topicId: "topic-1",
          topicName: "Loops",
        },
      ),
    );
    mockListActiveAdaptiveSequenceRuns.mockResolvedValue([
      { id: "run-newer", updatedAt: new Date("2026-09-18T12:00:00Z") },
      { id: "run-older", updatedAt: new Date("2026-09-17T12:00:00Z") },
    ]);

    const view = await getTopOrchestratorSuggestion("user-1", "course-1");
    expect(view?.activeRunId).toBe("run-newer");
    expect(mockListActiveAdaptiveSequenceRuns).toHaveBeenCalledTimes(1);
  });

  it("skips NO_INTERVENTION and returns null when nothing else qualifies", async () => {
    mockTopicFindMany.mockResolvedValue([
      {
        id: "topic-1",
        name: "Strong Topic",
        courseId: "course-1",
        conceptId: "concept-1",
        sortOrder: 0,
      },
    ]);
    mockConceptMasteryFindMany.mockResolvedValue([
      {
        conceptId: "concept-1",
        recognize: 0.8,
        explain: 0.8,
        apply: 0.8,
        solve: 0.8,
        perform: 0.8,
        retain: 0.8,
        reviewCount: 6,
        lastReviewedAt: null,
      },
    ]);
    mockOrchestrateForConcept.mockResolvedValue(
      orchestrateFromLearnerState(
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
      ),
    );

    const view = await getTopOrchestratorSuggestion("user-1", "course-1");
    expect(view).toBeNull();
    expect(mockListActiveAdaptiveSequenceRuns).not.toHaveBeenCalled();
  });
});

describe("Phase 2B-3 UI surface wiring", () => {
  it("Growth Center mounts OrchestratorSuggestionCard; Study Haul welcome uses Continue Learning experience", () => {
    const growth = readFileSync(
      path.join(process.cwd(), "src/components/study/LearnerGrowthCenterPanel.tsx"),
      "utf8",
    );
    const center = readFileSync(
      path.join(process.cwd(), "src/components/study/StudyHaulLearningCenter.tsx"),
      "utf8",
    );
    const hub = readFileSync(
      path.join(process.cwd(), "app/study/study-hub-view.tsx"),
      "utf8",
    );
    // Product contract (Pass 1 IA): orchestrator card lives on Progress / Growth Center,
    // not as Study Haul front-door inventory. Welcome uses ContinueLearningExperienceCard.
    expect(growth).toContain("OrchestratorSuggestionCard");
    expect(center).toContain("ContinueLearningExperienceCard");
    expect(hub).not.toContain("OrchestratorSuggestionCard");
    expect(hub).not.toContain("SixRecommendationsPanel");
  });

  it("suggestion card primary Adaptive CTA with secondary direct SIX", () => {
    const card = readFileSync(
      path.join(
        process.cwd(),
        "src/components/study/OrchestratorSuggestionCard.tsx",
      ),
      "utf8",
    );
    expect(card).toContain("data-orchestrator-try-it");
    expect(card).toContain("data-orchestrator-adaptive-study");
    expect(card).toContain("{primary.label}");
    expect(card).toContain("resolveHubAdaptivePrimaryCta");
    expect(card).toContain("touch-manipulation");
    expect(card).toContain("min-h-11");
    expect(card).toContain("/api/study/adaptive/start");
    expect(card).toContain("/study/adaptive/");
    expect(card).toContain('data-hub-primary-cta="adaptive"');
    expect(card).toContain('data-hub-secondary-cta="direct-six"');
    // Adaptive primary appears before secondary SIX marker.
    expect(card.indexOf("data-orchestrator-adaptive-study")).toBeLessThan(
      card.indexOf('data-hub-secondary-cta="direct-six"'),
    );
    expect(card).not.toMatch(/APPLICATION_GAP|LearningObject/);

    const bridge = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/orchestrator/hub-adaptive-bridge.ts",
      ),
      "utf8",
    );
    expect(bridge).toContain("Start learning");
    expect(bridge).toContain("Continue learning");
  });

  it("API route is read-only suggestion (preserves resolveUserUrlCourseId)", () => {
    const route = readFileSync(
      path.join(
        process.cwd(),
        "app/api/study/orchestrator-suggestion/route.ts",
      ),
      "utf8",
    );
    expect(route).toContain("getTopOrchestratorSuggestion");
    expect(route).toContain("resolveUserUrlCourseId");
    expect(route).toMatch(/recommendation-only/i);
  });

  it("does not alter existing SIX / quiz / flashcard / evaluate / lucky / core routes", () => {
    const files = [
      "src/lib/csl/six.ts",
      "src/lib/csl/lucky-engine.ts",
      "app/api/quizzes/[id]/submit/route.ts",
      "app/api/flashcards/route.ts",
      "app/api/study/evaluate/route.ts",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toContain("OrchestratorSuggestionCard");
      expect(source).not.toContain("getTopOrchestratorSuggestion");
    }
  });
});
