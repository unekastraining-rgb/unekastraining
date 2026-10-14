import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  mockProjectLearnerConceptState,
  mockResolveLearningMaterialContext,
  mockListActiveRuns,
  mockLearningSpaceFindFirst,
  mockConceptFindFirst,
  mockLearnerProfileFindUnique,
  mockParseLearningIntent,
} = vi.hoisted(() => ({
  mockProjectLearnerConceptState: vi.fn(),
  mockResolveLearningMaterialContext: vi.fn(),
  mockListActiveRuns: vi.fn(),
  mockLearningSpaceFindFirst: vi.fn(),
  mockConceptFindFirst: vi.fn(),
  mockLearnerProfileFindUnique: vi.fn(),
  mockParseLearningIntent: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learningSpace: { findFirst: mockLearningSpaceFindFirst },
    concept: { findFirst: mockConceptFindFirst },
    learnerProfile: { findUnique: mockLearnerProfileFindUnique },
  },
}));

vi.mock("@/lib/learning/learner-model/project", () => ({
  projectLearnerConceptState: (...args: unknown[]) =>
    mockProjectLearnerConceptState(...args),
}));

vi.mock("@/lib/learning/material-context", () => ({
  resolveLearningMaterialContext: (...args: unknown[]) =>
    mockResolveLearningMaterialContext(...args),
}));

vi.mock("@/lib/learning/sequence/coordinator", () => ({
  listActiveAdaptiveSequenceRuns: (...args: unknown[]) =>
    mockListActiveRuns(...args),
}));

vi.mock("@/lib/learning/intent/parse", () => ({
  parseLearningIntent: (...args: unknown[]) => mockParseLearningIntent(...args),
}));

vi.mock("@/lib/learning/persona-accessibility-hooks", () => ({
  resolvePersonaPresentationHooks: () => ({
    reducedMotion: false,
    largerText: false,
  }),
}));

import {
  LEARNER_CONTEXT_PRECEDENCE,
  learnerContextPrecedenceSummary,
  presentUniversalLearnerContext,
  resolveUniversalLearnerContext,
  toOrchestrateDecisionContextOptions,
  UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY,
  universalLearnerContextCreatesEvidence,
} from "@/lib/learning/universal-learner-context";

const LEARNER_A = "learner-a";
const LEARNER_B = "learner-b";
const CONCEPT_A = "concept-a";
const CONCEPT_B = "concept-b";

function ownedProjection(overrides: Record<string, unknown> = {}) {
  return {
    learnerId: LEARNER_A,
    conceptId: CONCEPT_A,
    conceptTitle: "SQL JOIN",
    learningSpaceId: "space-a",
    mastery: { status: "available" },
    recentActivity: { totalAttempts: 2, bySource: {} },
    activeAdaptiveRun: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockProjectLearnerConceptState.mockResolvedValue(null);
  mockResolveLearningMaterialContext.mockResolvedValue({
    context: null,
    prioritySource: "none",
    createsEvidence: false,
  });
  mockListActiveRuns.mockResolvedValue([]);
  mockLearningSpaceFindFirst.mockResolvedValue(null);
  mockConceptFindFirst.mockResolvedValue(null);
  mockLearnerProfileFindUnique.mockResolvedValue(null);
  mockParseLearningIntent.mockImplementation((v: unknown) =>
    v === undefined ? undefined : v,
  );
});

describe("2P-29 evidence boundary", () => {
  it("resolve/display/growth/hub/tutor never create evidence", () => {
    expect(
      UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY.resolveCreatesLearningAttempt,
    ).toBe(false);
    expect(
      UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY.displayCreatesLearningAttempt,
    ).toBe(false);
    expect(
      UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY.growthCenterViewCreatesLearningAttempt,
    ).toBe(false);
    expect(
      UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY.hubViewCreatesLearningAttempt,
    ).toBe(false);
    expect(
      UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY.tutorWithContextCreatesAutomaticEvidence,
    ).toBe(false);
    expect(
      UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY.startAdaptiveCreatesLearningAttempt,
    ).toBe(false);
    expect(
      universalLearnerContextCreatesEvidence("activityInteractionMayCreateEvidence"),
    ).toBe(true);
  });

  it("resolved context flags createsEvidence/createsMastery false", async () => {
    const ctx = await resolveUniversalLearnerContext({ learnerId: LEARNER_A });
    expect(ctx.createsEvidence).toBe(false);
    expect(ctx.createsMastery).toBe(false);
    expect(presentUniversalLearnerContext(ctx).createsEvidence).toBe(false);
  });
});

describe("2P-29 precedence", () => {
  it("documents ordered precedence without scores", () => {
    expect(LEARNER_CONTEXT_PRECEDENCE[0]).toBe("canonical_mastery_evidence");
    expect(LEARNER_CONTEXT_PRECEDENCE.at(-1)).toBe("presentation_preferences");
    const summary = learnerContextPrecedenceSummary();
    expect(summary.presentationNeverOverridesDiagnosis).toBe(true);
    expect(summary.noPersonalizationScore).toBe(true);
    expect(summary.orchestratorRemainsAuthoritative).toBe(true);
  });
});

describe("2P-29 ownership", () => {
  it("foreign conceptId yields null concept (no leak)", async () => {
    mockProjectLearnerConceptState.mockResolvedValue(null);
    const ctx = await resolveUniversalLearnerContext({
      learnerId: LEARNER_A,
      conceptId: CONCEPT_B,
    });
    expect(ctx.concept).toBeNull();
    expect(mockProjectLearnerConceptState).toHaveBeenCalledWith(
      LEARNER_A,
      CONCEPT_B,
    );
  });

  it("foreign LearningSpace is excluded", async () => {
    mockProjectLearnerConceptState.mockResolvedValue(ownedProjection());
    mockConceptFindFirst.mockResolvedValue({ learningSpaceId: "space-b" });
    mockLearningSpaceFindFirst.mockResolvedValue(null); // ownership filter failed
    const ctx = await resolveUniversalLearnerContext({
      learnerId: LEARNER_A,
      conceptId: CONCEPT_A,
      learningSpaceId: "space-b",
    });
    expect(ctx.learningSpace).toBeNull();
    expect(mockLearningSpaceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "space-b", userId: LEARNER_A },
      }),
    );
  });

  it("material resolve always uses session learnerId", async () => {
    mockProjectLearnerConceptState.mockResolvedValue(ownedProjection());
    mockResolveLearningMaterialContext.mockResolvedValue({
      context: {
        materialId: "mat-a",
        title: "DB Notes",
        provenance: { label: "Source: DB Notes" },
      },
      prioritySource: "explicit",
      createsEvidence: false,
    });
    const ctx = await resolveUniversalLearnerContext({
      learnerId: LEARNER_A,
      conceptId: CONCEPT_A,
      materialId: "mat-foreign",
    });
    expect(mockResolveLearningMaterialContext).toHaveBeenCalledWith(
      expect.objectContaining({ userId: LEARNER_A }),
    );
    expect(ctx.material?.materialId).toBe("mat-a");
  });

  it("User B identity never appears when resolving as User A", async () => {
    mockProjectLearnerConceptState.mockResolvedValue(ownedProjection());
    const ctx = await resolveUniversalLearnerContext({
      learnerId: LEARNER_A,
      conceptId: CONCEPT_A,
    });
    expect(ctx.learnerId).toBe(LEARNER_A);
    expect(ctx.learnerId).not.toBe(LEARNER_B);
  });
});

describe("2P-29 cold start / absence", () => {
  it("works with no mastery, material, space, intent, or run", async () => {
    const ctx = await resolveUniversalLearnerContext({ learnerId: LEARNER_A });
    expect(ctx.concept).toBeNull();
    expect(ctx.material).toBeNull();
    expect(ctx.learningSpace).toBeNull();
    expect(ctx.intent).toBeUndefined();
    expect(ctx.teachingStyle).toBeNull();
    expect(ctx.activeLearning).toBeNull();
    expect(presentUniversalLearnerContext(ctx).lines).toEqual([]);
  });

  it("does not invent intent when absent", async () => {
    const ctx = await resolveUniversalLearnerContext({
      learnerId: LEARNER_A,
      conceptId: CONCEPT_A,
    });
    expect(ctx.intent).toBeUndefined();
    expect(mockParseLearningIntent).not.toHaveBeenCalled();
  });
});

describe("2P-29 presentation", () => {
  it("emits human lines without raw ids", async () => {
    mockProjectLearnerConceptState.mockResolvedValue(ownedProjection());
    mockLearningSpaceFindFirst.mockResolvedValue({
      id: "space-a",
      title: "Database Systems",
      subjectDomain: "CS",
      kind: "COURSE",
    });
    mockConceptFindFirst.mockResolvedValue({ learningSpaceId: "space-a" });
    mockResolveLearningMaterialContext.mockResolvedValue({
      context: {
        materialId: "mat-a",
        title: "Chapter 5",
        provenance: { label: "Source: Chapter 5 notes" },
      },
      prioritySource: "explicit",
      createsEvidence: false,
    });

    const ctx = await resolveUniversalLearnerContext({
      learnerId: LEARNER_A,
      conceptId: CONCEPT_A,
      teachingStyle: "DETAILED",
      intent: { purpose: "PRACTICE", source: "EXPLICIT" },
    });
    const presentation = presentUniversalLearnerContext(ctx);
    expect(presentation.lines.some((l) => l.includes("Database Systems"))).toBe(
      true,
    );
    expect(presentation.lines.some((l) => /Source:/i.test(l))).toBe(true);
    expect(presentation.lines.join(" ")).not.toContain(CONCEPT_A);
    expect(presentation.lines.join(" ")).not.toContain(LEARNER_A);
  });

  it("teaching style is presentation only — does not invent diagnosis", async () => {
    const ctx = await resolveUniversalLearnerContext({
      learnerId: LEARNER_A,
      teachingStyle: "EXAM",
    });
    expect(ctx.teachingStyle).toBe("EXAM");
    expect(ctx.concept).toBeNull();
    const opts = toOrchestrateDecisionContextOptions(ctx);
    expect(opts.decisionContext).not.toHaveProperty("diagnosis");
  });
});

describe("2P-29 active Adaptive state", () => {
  it("exposes active run as progression context", async () => {
    mockProjectLearnerConceptState.mockResolvedValue(
      ownedProjection({
        activeAdaptiveRun: {
          runId: "run-1",
          status: "ACTIVE",
          currentStepIndex: 2,
        },
      }),
    );
    const ctx = await resolveUniversalLearnerContext({
      learnerId: LEARNER_A,
      conceptId: CONCEPT_A,
    });
    expect(ctx.activeLearning).toEqual({
      runId: "run-1",
      conceptId: CONCEPT_A,
      status: "ACTIVE",
      currentStepIndex: 2,
    });
    expect(ctx.createsMastery).toBe(false);
  });
});
