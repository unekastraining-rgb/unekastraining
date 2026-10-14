import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockGetPrerequisiteConceptIds,
  mockGetLearnerConceptMastery,
} = vi.hoisted(() => ({
  mockGetPrerequisiteConceptIds: vi.fn(),
  mockGetLearnerConceptMastery: vi.fn(),
}));

vi.mock("@/lib/learning/knowledge/concept-relationship", () => ({
  getPrerequisiteConceptIds: mockGetPrerequisiteConceptIds,
}));

vi.mock("@/lib/learning/learner-model/read", () => ({
  getLearnerConceptMastery: mockGetLearnerConceptMastery,
}));

import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import {
  orchestrateFromLearnerState,
  type OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import { isOrchestratorPrerequisitesEnabled } from "@/lib/learning/orchestrator/prerequisites-flag";
import {
  ORCHESTRATOR_PREREQUISITE_POLICY,
  enrichOrchestratorWithPrerequisites,
} from "@/lib/learning/orchestrator/prerequisites";
import { presentOrchestratorSuggestion } from "@/lib/learning/orchestrator/present";
import type { LearnerConceptMasterySummary, FacetedMasteryScores } from "@/lib/learning/types";

function summary(partial: {
  learnerId?: string;
  conceptId?: string;
  conceptTitle?: string;
  facets?: Partial<FacetedMasteryScores>;
  topicMastery?: LearnerConceptMasterySummary["topicMastery"];
  recentMissedCount?: number;
  evidenceSourceCounts?: LearnerConceptMasterySummary["evidenceSourceCounts"];
  reviewCount?: number;
  lastReviewedAt?: Date | null;
  nextReviewAt?: Date | null;
}): LearnerConceptMasterySummary {
  return {
    learnerId: partial.learnerId ?? "user-1",
    conceptId: partial.conceptId ?? "concept-1",
    conceptTitle: partial.conceptTitle ?? "Exception Handling",
    facets: { ...emptyFacetScores(), ...partial.facets },
    topicMastery: partial.topicMastery ?? null,
    recentMissedCount: partial.recentMissedCount ?? 0,
    evidenceSourceCounts: partial.evidenceSourceCounts ?? {
      quiz: 2,
      flashcard: 0,
      study_evaluate: 0,
      other: 0,
    },
    reviewCount: partial.reviewCount ?? 3,
    lastReviewedAt: partial.lastReviewedAt ?? null,
    nextReviewAt: partial.nextReviewAt ?? null,
  };
}

function understandingGapResult(): OrchestratorResult {
  return orchestrateFromLearnerState(
    summary({
      facets: { recognize: 0.2, explain: 0.15, apply: 0.1, retain: 0.1 },
      reviewCount: 3,
      evidenceSourceCounts: {
        quiz: 2,
        flashcard: 0,
        study_evaluate: 1,
        other: 0,
      },
    }),
  );
}

function applicationGapResult(): OrchestratorResult {
  return orchestrateFromLearnerState(
    summary({
      facets: { recognize: 0.7, explain: 0.7, apply: 0.2, retain: 0.5 },
      reviewCount: 4,
      evidenceSourceCounts: {
        quiz: 3,
        flashcard: 0,
        study_evaluate: 1,
        other: 0,
      },
    }),
  );
}

function noInterventionResult(): OrchestratorResult {
  return orchestrateFromLearnerState(
    summary({
      facets: {
        recognize: 0.8,
        explain: 0.8,
        apply: 0.75,
        perform: 0.7,
        retain: 0.7,
        confidence: 0.6,
      },
      reviewCount: 6,
      evidenceSourceCounts: {
        quiz: 3,
        flashcard: 2,
        study_evaluate: 1,
        other: 0,
      },
    }),
  );
}

function weakPrereqSummary(
  id: string,
  title: string,
  score = 0.2,
): LearnerConceptMasterySummary {
  return summary({
    learnerId: "user-1",
    conceptId: id,
    conceptTitle: title,
    facets: {
      recognize: score,
      explain: score,
      apply: score,
      retain: score,
    },
    reviewCount: 3,
    evidenceSourceCounts: {
      quiz: 2,
      flashcard: 0,
      study_evaluate: 0,
      other: 0,
    },
  });
}

function strongPrereqSummary(id: string, title: string): LearnerConceptMasterySummary {
  return summary({
    learnerId: "user-1",
    conceptId: id,
    conceptTitle: title,
    facets: {
      recognize: 0.8,
      explain: 0.75,
      apply: 0.7,
      retain: 0.65,
    },
    reviewCount: 4,
    evidenceSourceCounts: {
      quiz: 2,
      flashcard: 1,
      study_evaluate: 0,
      other: 0,
    },
  });
}

describe("Phase 2E-3 Orchestrator prerequisites flag", () => {
  const original = process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES;
    } else {
      process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES = original;
    }
  });

  it("defaults OFF", () => {
    delete process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES;
    expect(isOrchestratorPrerequisitesEnabled()).toBe(false);
  });

  it("enables for 1/true/on/yes", () => {
    for (const value of ["1", "true", "on", "yes"]) {
      process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES = value;
      expect(isOrchestratorPrerequisitesEnabled()).toBe(true);
    }
  });
});

describe("enrichOrchestratorWithPrerequisites", () => {
  const original = process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES;

  beforeEach(() => {
    process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES = "1";
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES;
    } else {
      process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES = original;
    }
  });

  it("flag OFF does not query relationships and leaves result unchanged", async () => {
    delete process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES;
    const base = understandingGapResult();
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(enriched).toEqual(base);
    expect(mockGetPrerequisiteConceptIds).not.toHaveBeenCalled();
    expect(mockGetLearnerConceptMastery).not.toHaveBeenCalled();
  });

  it("no prerequisites → unchanged result", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue([]);
    const base = understandingGapResult();
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(enriched.diagnosis).toBe(base.diagnosis);
    expect(enriched.prerequisiteHints).toBeUndefined();
    expect(enriched.intervention).toEqual(base.intervention);
  });

  it("NO_INTERVENTION skips prerequisite enrichment", async () => {
    const base = noInterventionResult();
    expect(base.diagnosis).toBe("NO_INTERVENTION");
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(enriched).toEqual(base);
    expect(mockGetPrerequisiteConceptIds).not.toHaveBeenCalled();
  });

  it("INSUFFICIENT_EVIDENCE is treated conservatively (no enrichment query)", async () => {
    const base = orchestrateFromLearnerState(
      summary({
        reviewCount: 0,
        evidenceSourceCounts: {
          quiz: 0,
          flashcard: 0,
          study_evaluate: 0,
          other: 0,
        },
        facets: {},
      }),
    );
    expect(base.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(enriched).toEqual(base);
    expect(mockGetPrerequisiteConceptIds).not.toHaveBeenCalled();
  });

  it("UNDERSTANDING_GAP + strong prerequisite → unchanged (no hint)", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue(["prereq-strong"]);
    mockGetLearnerConceptMastery.mockResolvedValue(
      strongPrereqSummary("prereq-strong", "Exceptions"),
    );
    const base = understandingGapResult();
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(enriched.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(enriched.prerequisiteHints).toBeUndefined();
    expect(enriched.intervention?.sixComponent).toBe(
      base.intervention?.sixComponent,
    );
  });

  it("UNDERSTANDING_GAP + weak prerequisite → keeps diagnosis, adds hint", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue(["prereq-weak"]);
    mockGetLearnerConceptMastery.mockResolvedValue(
      weakPrereqSummary("prereq-weak", "Exceptions"),
    );
    const base = understandingGapResult();
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(enriched.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(enriched.intervention?.sixComponent).toBe(
      base.intervention?.sixComponent,
    );
    expect(enriched.prerequisiteHints).toHaveLength(1);
    expect(enriched.prerequisiteHints![0]).toMatchObject({
      conceptId: "prereq-weak",
      conceptTitle: "Exceptions",
    });
    expect(enriched.reason).toContain("may benefit from reviewing");
    expect(enriched.reason).toContain("Exceptions");
  });

  it("APPLICATION_GAP + weak prerequisite keeps APPLICATION_GAP", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue(["prereq-weak"]);
    mockGetLearnerConceptMastery.mockResolvedValue(
      weakPrereqSummary("prereq-weak", "Basics"),
    );
    const base = applicationGapResult();
    expect(base.diagnosis).toBe("APPLICATION_GAP");
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(enriched.diagnosis).toBe("APPLICATION_GAP");
    expect(enriched.prerequisiteHints?.[0]?.conceptTitle).toBe("Basics");
  });

  it("RECALL/RETENTION gaps keep primary diagnosis (not converted)", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue(["prereq-weak"]);
    mockGetLearnerConceptMastery.mockResolvedValue(
      weakPrereqSummary("prereq-weak", "Foundation"),
    );
    const recallish = orchestrateFromLearnerState(
      summary({
        facets: {
          recognize: 0.7,
          explain: 0.7,
          apply: 0.65,
          retain: 0.2,
        },
        reviewCount: 5,
        evidenceSourceCounts: {
          quiz: 2,
          flashcard: 2,
          study_evaluate: 0,
          other: 0,
        },
      }),
    );
    expect(["RECALL_GAP", "RETENTION_GAP"]).toContain(recallish.diagnosis);
    const enriched = await enrichOrchestratorWithPrerequisites(recallish);
    expect(enriched.diagnosis).toBe(recallish.diagnosis);
    expect(enriched.prerequisiteHints).toHaveLength(1);
  });

  it("caps evaluated prerequisites at 5 and selects weakest deterministically", async () => {
    const ids = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"];
    mockGetPrerequisiteConceptIds.mockResolvedValue(ids);
    mockGetLearnerConceptMastery.mockImplementation(
      async (_userId: string, conceptId: string) => {
        const scores: Record<string, number> = {
          p1: 0.3,
          p2: 0.1,
          p3: 0.25,
          p4: 0.35,
          p5: 0.4,
          p6: 0.05,
          p7: 0.02,
        };
        return weakPrereqSummary(conceptId, conceptId, scores[conceptId] ?? 0.2);
      },
    );

    const enriched = await enrichOrchestratorWithPrerequisites(
      understandingGapResult(),
    );
    expect(mockGetLearnerConceptMastery).toHaveBeenCalledTimes(
      ORCHESTRATOR_PREREQUISITE_POLICY.maxDirectPrerequisites,
    );
    // Among first 5 (p1–p5), p2 is weakest (0.1). p6/p7 never evaluated.
    expect(enriched.prerequisiteHints?.[0]?.conceptId).toBe("p2");
  });

  it("missing prerequisite evidence does not produce a strong hint", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue(["prereq-empty"]);
    mockGetLearnerConceptMastery.mockResolvedValue(
      summary({
        conceptId: "prereq-empty",
        conceptTitle: "Unknown Base",
        reviewCount: 0,
        evidenceSourceCounts: {
          quiz: 0,
          flashcard: 0,
          study_evaluate: 0,
          other: 0,
        },
        facets: { recognize: 0.1, explain: 0.1 },
      }),
    );
    const enriched = await enrichOrchestratorWithPrerequisites(
      understandingGapResult(),
    );
    expect(enriched.prerequisiteHints).toBeUndefined();
  });

  it("relationship reader throw returns original result", async () => {
    mockGetPrerequisiteConceptIds.mockRejectedValue(new Error("db down"));
    const base = understandingGapResult();
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(enriched).toEqual(base);
  });

  it("mastery lookup throw returns original when all lookups fail", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue(["prereq-1"]);
    mockGetLearnerConceptMastery.mockRejectedValue(new Error("mastery fail"));
    const base = understandingGapResult();
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(enriched.diagnosis).toBe(base.diagnosis);
    expect(enriched.prerequisiteHints).toBeUndefined();
  });

  it("null mastery (cross-user / missing) is skipped", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue(["foreign"]);
    mockGetLearnerConceptMastery.mockResolvedValue(null);
    const enriched = await enrichOrchestratorWithPrerequisites(
      understandingGapResult(),
    );
    expect(enriched.prerequisiteHints).toBeUndefined();
  });

  it("A↔B cycle does not recurse (direct-only, one enrichment pass)", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue(["concept-b"]);
    mockGetLearnerConceptMastery.mockResolvedValue(
      weakPrereqSummary("concept-b", "B"),
    );
    const base = understandingGapResult();
    const enriched = await enrichOrchestratorWithPrerequisites(base);
    expect(mockGetPrerequisiteConceptIds).toHaveBeenCalledTimes(1);
    expect(mockGetPrerequisiteConceptIds).toHaveBeenCalledWith(
      "user-1",
      "concept-1",
    );
    expect(enriched.prerequisiteHints?.[0]?.conceptId).toBe("concept-b");
  });

  it("present softens wording when prerequisite hint is attached", () => {
    const base = understandingGapResult();
    const withHint: OrchestratorResult = {
      ...base,
      confidence: "HIGH",
      reason: `${base.reason} Before continuing with this topic, you may benefit from reviewing “Exceptions.”`,
      prerequisiteHints: [
        {
          conceptId: "prereq-weak",
          conceptTitle: "Exceptions",
          reason:
            'Before continuing with this topic, you may benefit from reviewing “Exceptions.”',
        },
      ],
    };
    const view = presentOrchestratorSuggestion(withHint);
    expect(view?.softWording).toBe(true);
    expect(view?.reason).toContain("may benefit from reviewing");
    expect(view?.state).toBe("recommendation");
  });
});

describe("Phase 2E-3 preservation", () => {
  it("does not add PREREQUISITE_GAP to diagnosis enum", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toMatch(/PREREQUISITE_GAP/);
    expect(diagnose).toContain("UNDERSTANDING_GAP");
    expect(diagnose).toContain("APPLICATION_GAP");
  });

  it("does not traverse graphs or weight relationship confidence", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/prerequisites.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/\bBFS\b|\bDFS\b|while\s*\(.*queue|sourceType|relationship\.confidence/i);
    expect(source).toContain("maxDirectPrerequisites");
    expect(source).toContain("getPrerequisiteConceptIds");
  });

  it("does not modify CORE / Tutor / LUCKY / LearningObject projection", () => {
    const enrich = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/prerequisites.ts"),
      "utf8",
    );
    expect(enrich).not.toMatch(
      /core-bridge|runTutor|RetentionItem|prerequisiteConceptIdsJson|recordEvidence/,
    );
  });

  it("env example documents the Orchestrator prerequisites flag", () => {
    const env = readFileSync(path.join(process.cwd(), ".env.example"), "utf8");
    expect(env).toContain("STUDY_HAUL_ORCHESTRATOR_PREREQUISITES");
    expect(env).toContain("STUDY_HAUL_CONCEPT_RELATIONSHIPS");
  });
});
