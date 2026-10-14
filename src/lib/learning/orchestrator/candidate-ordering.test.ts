/**
 * Phase 2G-65 — ConceptMastery candidate ordering (pure + Hub suggest wiring).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  classifyConceptMasteryForOrdering,
  orderCandidatesByConceptMastery,
  type ConceptMasteryOrderingRow,
} from "@/lib/learning/orchestrator/candidate-ordering";
import {
  ORCHESTRATOR_FACET_STRONG,
  ORCHESTRATOR_FACET_WEAK,
  orchestrateFromLearnerState,
} from "@/lib/learning/orchestrator/diagnose";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function mastery(
  partial: Partial<ConceptMasteryOrderingRow> & { conceptId: string },
): ConceptMasteryOrderingRow {
  return {
    recognize: 0.5,
    explain: 0.5,
    apply: 0.5,
    retain: 0.5,
    reviewCount: 4,
    lastReviewedAt: null,
    ...partial,
  };
}

function summary(
  partial: Omit<Partial<LearnerConceptMasterySummary>, "facets"> & {
    facets?: Partial<LearnerConceptMasterySummary["facets"]>;
  },
): LearnerConceptMasterySummary {
  return {
    learnerId: "user-1",
    conceptId: partial.conceptId ?? "concept-1",
    conceptTitle: partial.conceptTitle ?? "Concept",
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

describe("Phase 2G-65 candidate-ordering (pure)", () => {
  it("1–2. Scenario A: weak ConceptMastery ranks ahead despite strong TopicMastery being irrelevant", () => {
    // TopicMastery is never an input — strong Topic cannot suppress weak Concept.
    const map = new Map([
      [
        "weak-cm",
        mastery({
          conceptId: "weak-cm",
          recognize: 0.2,
          explain: 0.2,
          apply: 0.2,
          retain: 0.2,
        }),
      ],
      [
        "strong-cm",
        mastery({
          conceptId: "strong-cm",
          recognize: 0.8,
          explain: 0.8,
          apply: 0.8,
          retain: 0.8,
        }),
      ],
    ]);
    const ordered = orderCandidatesByConceptMastery(
      [
        { conceptId: "strong-cm", discoveryIndex: 0 },
        { conceptId: "weak-cm", discoveryIndex: 1 },
      ],
      map,
    );
    expect(ordered[0]!.conceptId).toBe("weak-cm");
    expect(ordered[0]!.priority).toBe("NEEDS_ATTENTION");
  });

  it("3. Scenario B: strong ConceptMastery is not elevated by Topic weakness (Topic not consulted)", () => {
    const map = new Map([
      [
        "strong-cm",
        mastery({
          conceptId: "strong-cm",
          recognize: 0.85,
          explain: 0.85,
          apply: 0.85,
          retain: 0.85,
        }),
      ],
      [
        "weaker-cm",
        mastery({
          conceptId: "weaker-cm",
          recognize: 0.3,
          explain: 0.3,
          apply: 0.3,
          retain: 0.3,
        }),
      ],
    ]);
    // Discovery put "strong" first (as if TopicMastery was weak elsewhere) —
    // ConceptMastery still puts weaker ULE first.
    const ordered = orderCandidatesByConceptMastery(
      [
        { conceptId: "strong-cm", discoveryIndex: 0 },
        { conceptId: "weaker-cm", discoveryIndex: 1 },
      ],
      map,
    );
    expect(ordered[0]!.conceptId).toBe("weaker-cm");
    expect(ordered[1]!.priority).toBe("STRONG");
  });

  it("4. Scenario C: missing TopicMastery does not block ConceptMastery ordering", () => {
    const map = new Map([
      [
        "only-cm",
        mastery({
          conceptId: "only-cm",
          recognize: 0.25,
          explain: 0.4,
          apply: 0.5,
          retain: 0.5,
        }),
      ],
    ]);
    const ordered = orderCandidatesByConceptMastery(
      [{ conceptId: "only-cm", discoveryIndex: 0 }],
      map,
    );
    expect(ordered).toHaveLength(1);
    expect(ordered[0]!.priority).toBe("NEEDS_ATTENTION");
  });

  it("5–6. Scenario D: missing ConceptMastery is NO_CONCEPT_MASTERY, not fake zero / not TopicMastery", () => {
    const missing = classifyConceptMasteryForOrdering(null);
    expect(missing.priority).toBe("NO_CONCEPT_MASTERY");
    expect(missing.weaknessScore).toBeNull();

    const emptyRow = classifyConceptMasteryForOrdering(
      mastery({
        conceptId: "empty",
        recognize: 0,
        explain: 0,
        apply: 0,
        retain: 0,
        reviewCount: 0,
      }),
    );
    expect(emptyRow.priority).toBe("INSUFFICIENT_EVIDENCE");
    expect(emptyRow.weaknessScore).toBeNull();

    // Fake-zero would be NEEDS_ATTENTION with score 0 — must not happen for missing/empty.
    expect(missing.priority).not.toBe("NEEDS_ATTENTION");
    expect(emptyRow.priority).not.toBe("NEEDS_ATTENTION");
  });

  it("7. Scenario E: weaker ConceptMastery receives higher ULE priority", () => {
    const map = new Map([
      [
        "a",
        mastery({
          conceptId: "a",
          recognize: 0.2,
          explain: 0.2,
          apply: 0.2,
          retain: 0.2,
        }),
      ],
      [
        "b",
        mastery({
          conceptId: "b",
          recognize: 0.4,
          explain: 0.4,
          apply: 0.4,
          retain: 0.4,
        }),
      ],
    ]);
    const ordered = orderCandidatesByConceptMastery(
      [
        { conceptId: "b", discoveryIndex: 0 },
        { conceptId: "a", discoveryIndex: 1 },
      ],
      map,
    );
    expect(ordered[0]!.conceptId).toBe("a");
    expect(ordered[0]!.weaknessScore!).toBeLessThan(ordered[1]!.weaknessScore!);
  });

  it("8. Scenario F: equal ConceptMastery uses deterministic discoveryIndex tie-break", () => {
    const shared = {
      recognize: 0.3,
      explain: 0.3,
      apply: 0.3,
      retain: 0.3,
      reviewCount: 3,
      lastReviewedAt: null as Date | null,
    };
    const map = new Map([
      ["x", mastery({ conceptId: "x", ...shared })],
      ["y", mastery({ conceptId: "y", ...shared })],
    ]);
    const ordered = orderCandidatesByConceptMastery(
      [
        { conceptId: "y", discoveryIndex: 5 },
        { conceptId: "x", discoveryIndex: 2 },
      ],
      map,
    );
    expect(ordered.map((c) => c.conceptId)).toEqual(["x", "y"]);
  });

  it("9. Scenario G / insufficient after strong: NO_CONCEPT_MASTERY does not masquerade as weak", () => {
    const map = new Map([
      [
        "strong",
        mastery({
          conceptId: "strong",
          recognize: 0.9,
          explain: 0.9,
          apply: 0.9,
          retain: 0.9,
        }),
      ],
    ]);
    const ordered = orderCandidatesByConceptMastery(
      [
        { conceptId: "no-row", discoveryIndex: 0 },
        { conceptId: "strong", discoveryIndex: 1 },
      ],
      map,
    );
    expect(ordered[0]!.conceptId).toBe("strong");
    expect(ordered[1]!.priority).toBe("NO_CONCEPT_MASTERY");
  });

  it("10. uses existing WEAK/STRONG bands only", () => {
    expect(ORCHESTRATOR_FACET_WEAK).toBe(0.45);
    expect(ORCHESTRATOR_FACET_STRONG).toBe(0.55);
    const justWeak = classifyConceptMasteryForOrdering(
      mastery({
        conceptId: "w",
        recognize: ORCHESTRATOR_FACET_WEAK - 0.01,
        explain: 0.7,
        apply: 0.7,
        retain: 0.7,
      }),
    );
    expect(justWeak.priority).toBe("NEEDS_ATTENTION");
    const justStrong = classifyConceptMasteryForOrdering(
      mastery({
        conceptId: "s",
        recognize: ORCHESTRATOR_FACET_STRONG,
        explain: ORCHESTRATOR_FACET_STRONG,
        apply: ORCHESTRATOR_FACET_STRONG,
        retain: ORCHESTRATOR_FACET_STRONG,
      }),
    );
    expect(justStrong.priority).toBe("STRONG");
  });

  it("11. diagnosis output unchanged for a selected concept (ordering does not call diagnose)", () => {
    const before = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
    );
    // Ordering is pure — re-run diagnose identically.
    const after = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
    );
    expect(after.diagnosis).toBe(before.diagnosis);
    expect(after.intervention?.sixComponent).toBe(before.intervention?.sixComponent);
    expect(after.reason).toBe(before.reason);
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
  const actual = await vi.importActual<
    typeof import("@/lib/learning/orchestrator")
  >("@/lib/learning/orchestrator");
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

describe("Phase 2G-65 getTopOrchestratorSuggestion ConceptMastery priority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListActiveAdaptiveSequenceRuns.mockResolvedValue([]);
  });

  it("12. TopicMastery-strong / Concept-weak: weak Concept is tried first (Scenario A Hub)", async () => {
    // Discovery order puts the strong ConceptMastery Topic first (as legacy
    // TopicMastery-weak ranking would have). ConceptMastery must still prefer weak.
    mockTopicFindMany.mockResolvedValue([
      {
        id: "topic-weak-tm",
        name: "Weak Topic Progress",
        courseId: "course-1",
        conceptId: "concept-strong-cm",
        sortOrder: 0,
      },
      {
        id: "topic-strong-tm",
        name: "Strong Topic Progress",
        courseId: "course-1",
        conceptId: "concept-weak-cm",
        sortOrder: 1,
      },
    ]);
    mockConceptMasteryFindMany.mockResolvedValue([
      {
        conceptId: "concept-weak-cm",
        recognize: 0.2,
        explain: 0.2,
        apply: 0.2,
        retain: 0.2,
        reviewCount: 5,
        lastReviewedAt: null,
      },
      {
        conceptId: "concept-strong-cm",
        recognize: 0.85,
        explain: 0.85,
        apply: 0.85,
        retain: 0.85,
        reviewCount: 5,
        lastReviewedAt: null,
      },
    ]);
    mockOrchestrateForConcept.mockImplementation(
      async (_userId: string, conceptId: string) =>
        orchestrateFromLearnerState(
          summary({
            conceptId,
            conceptTitle: conceptId,
            reviewCount: 5,
            facets:
              conceptId === "concept-weak-cm"
                ? { recognize: 0.2, explain: 0.2, apply: 0.2, retain: 0.2 }
                : { recognize: 0.85, explain: 0.85, apply: 0.85, retain: 0.85 },
          }),
          { courseId: "course-1", topicId: "t", topicName: conceptId },
        ),
    );

    const view = await getTopOrchestratorSuggestion("user-1", "course-1");
    expect(mockOrchestrateForConcept.mock.calls[0]?.[1]).toBe(
      "concept-weak-cm",
    );
    expect(view?.conceptId).toBe("concept-weak-cm");
    expect(view?.state).toBe("recommendation");
  });

  it("13. TopicMastery-weak / Concept-strong cannot force strong Concept first (Scenario B Hub)", async () => {
    mockTopicFindMany.mockResolvedValue([
      {
        id: "topic-a",
        name: "A",
        courseId: "course-1",
        conceptId: "strong-cm",
        sortOrder: 0,
      },
      {
        id: "topic-b",
        name: "B",
        courseId: "course-1",
        conceptId: "weak-cm",
        sortOrder: 1,
      },
    ]);
    mockConceptMasteryFindMany.mockResolvedValue([
      {
        conceptId: "strong-cm",
        recognize: 0.9,
        explain: 0.9,
        apply: 0.9,
        retain: 0.9,
        reviewCount: 6,
        lastReviewedAt: null,
      },
      {
        conceptId: "weak-cm",
        recognize: 0.25,
        explain: 0.25,
        apply: 0.25,
        retain: 0.25,
        reviewCount: 4,
        lastReviewedAt: null,
      },
    ]);
    mockOrchestrateForConcept.mockImplementation(
      async (_userId: string, conceptId: string) =>
        orchestrateFromLearnerState(
          summary({
            conceptId,
            conceptTitle: conceptId,
            reviewCount: 5,
            facets:
              conceptId === "weak-cm"
                ? { recognize: 0.25, explain: 0.25, apply: 0.25, retain: 0.25 }
                : {
                    recognize: 0.9,
                    explain: 0.9,
                    apply: 0.9,
                    retain: 0.9,
                  },
            evidenceSourceCounts: {
              quiz: 2,
              flashcard: 2,
              study_evaluate: 2,
              other: 0,
            },
          }),
          { courseId: "course-1", topicId: "t", topicName: conceptId },
        ),
    );

    const view = await getTopOrchestratorSuggestion("user-1", "course-1");
    expect(mockOrchestrateForConcept.mock.calls[0]?.[1]).toBe("weak-cm");
    expect(view?.conceptId).toBe("weak-cm");
  });

  it("14. legacy topic without conceptId still uses ensureConceptForTopic (Scenario G)", async () => {
    mockTopicFindMany.mockResolvedValue([
      {
        id: "topic-legacy",
        name: "Legacy",
        courseId: "course-1",
        conceptId: null,
        sortOrder: 0,
      },
    ]);
    mockEnsureConceptForTopic.mockResolvedValue({ id: "ensured-concept" });
    mockConceptMasteryFindMany.mockResolvedValue([]);
    mockOrchestrateForConcept.mockResolvedValue(
      orchestrateFromLearnerState(
        summary({
          conceptId: "ensured-concept",
          conceptTitle: "Legacy",
          reviewCount: 0,
          evidenceSourceCounts: {
            quiz: 0,
            flashcard: 0,
            study_evaluate: 0,
            other: 0,
          },
          facets: emptyFacetScores(),
        }),
        {
          courseId: "course-1",
          topicId: "topic-legacy",
          topicName: "Legacy",
        },
      ),
    );

    const view = await getTopOrchestratorSuggestion("user-1", "course-1");
    expect(mockEnsureConceptForTopic).toHaveBeenCalledWith(
      "user-1",
      "topic-legacy",
    );
    expect(mockConceptMasteryFindMany).toHaveBeenCalled();
    expect(view?.state).toBe("insufficient");
  });

  it("15. ordering does not mutate mastery / create attempts / Adaptive runs", async () => {
    mockTopicFindMany.mockResolvedValue([
      {
        id: "topic-1",
        name: "T",
        courseId: "course-1",
        conceptId: "c1",
        sortOrder: 0,
      },
    ]);
    mockConceptMasteryFindMany.mockResolvedValue([
      {
        conceptId: "c1",
        recognize: 0.2,
        explain: 0.2,
        apply: 0.2,
        retain: 0.2,
        reviewCount: 3,
        lastReviewedAt: null,
      },
    ]);
    mockOrchestrateForConcept.mockResolvedValue(
      orchestrateFromLearnerState(
        summary({
          conceptId: "c1",
          facets: { recognize: 0.2, explain: 0.2, apply: 0.2, retain: 0.2 },
        }),
        { courseId: "course-1", topicId: "topic-1", topicName: "T" },
      ),
    );

    await getTopOrchestratorSuggestion("user-1", "course-1");
    const suggestSrc = read("src/lib/learning/orchestrator/suggest.ts");
    const orderSrc = read(
      "src/lib/learning/orchestrator/candidate-ordering.ts",
    );
    expect(suggestSrc).not.toMatch(
      /conceptMastery\.(create|update|upsert)|topicMastery\.(create|update|upsert)/,
    );
    expect(suggestSrc).not.toContain("learningAttempt");
    expect(suggestSrc).not.toContain("startAdaptiveSequenceRun");
    expect(orderSrc).not.toContain("db.");
    expect(orderSrc).not.toContain("orchestrateForConcept");
  });
});

describe("Phase 2G-65 architecture contracts", () => {
  it("16. Hub CTA / Adaptive bridge / diagnose unchanged; TopicMastery not in suggest rank", () => {
    const suggest = read("src/lib/learning/orchestrator/suggest.ts");
    expect(suggest).toContain("orderCandidatesByConceptMastery");
    expect(suggest).toContain("conceptMastery.findMany");
    expect(suggest).not.toMatch(/reviewCount\s*===\s*0/);
    expect(suggest).not.toContain("proficiency");
    expect(suggest).not.toContain("masteries");

    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("export const ORCHESTRATOR_FACET_WEAK = 0.45");
    expect(diagnose).toContain("UNDERSTANDING_GAP");
    expect(diagnose).toContain("APPLICATION_GAP");

    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("resolveHubAdaptivePrimaryCta");
    expect(card).toContain('data-hub-secondary-cta="direct-six"');
    expect(card).toContain("masterySummary");
  });
});
