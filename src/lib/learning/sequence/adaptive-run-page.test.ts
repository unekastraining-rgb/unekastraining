/**
 * Phase 2G-9 — read-only adaptive run page model.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

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
    note: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
    learningSpace: { findFirst: vi.fn() },
    courseMaterial: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/materials/workbook-from-material", () => ({
  loadMaterialForUser: vi.fn().mockResolvedValue(null),
}));

import { loadAdaptiveRunPageView } from "@/lib/learning/sequence/adaptive-run-page";

const USER = "user-a";
const RUN = "run-a";
const CONCEPT = "concept-a";

function activeResume(overrides: Record<string, unknown> = {}) {
  return {
    kind: "active" as const,
    run: {
      id: RUN,
      userId: USER,
      conceptId: CONCEPT,
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
    ...overrides,
  };
}

describe("Phase 2G-9 loadAdaptiveRunPageView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConceptFindFirst.mockResolvedValue({ title: "Exceptions" });
    mockTopicFindFirst.mockResolvedValue({
      id: "topic-1",
      name: "Exceptions",
      courseId: "course-1",
    });
    mockOrchestrateForConcept.mockResolvedValue(null);
  });

  it("loads owned ACTIVE run with SIX href via existing adapter", async () => {
    mockResumeAdaptiveSequenceRun.mockResolvedValue(activeResume());

    const view = await loadAdaptiveRunPageView(USER, RUN);

    expect(view.kind).toBe("active");
    if (view.kind !== "active") return;
    expect(view.conceptTitle).toBe("Exceptions");
    expect(view.stepNumber).toBe(1);
    expect(view.totalSteps).toBe(1);
    expect(view.activityTitle).toMatch(/Hands-on/i);
    expect(view.sixHref).toContain("/study/six/hands-on-practice");
    expect(view.sixHref).toContain("courseId=course-1");
    expect(view.sixHref).toContain(`adaptiveRunId=${RUN}`);
    expect(view.sixHref).toContain("adaptiveStep=0");
    expect(view.stopNotice).toBeNull();
    expect(mockResumeAdaptiveSequenceRun).toHaveBeenCalledWith(USER, RUN);
  });

  it("loads COMPLETED and ABANDONED without mutating", async () => {
    mockResumeAdaptiveSequenceRun.mockResolvedValue({
      kind: "terminal",
      run: { id: RUN, conceptId: CONCEPT, status: "COMPLETED", steps: [] },
      status: "COMPLETED",
    });
    expect((await loadAdaptiveRunPageView(USER, RUN)).kind).toBe("completed");

    mockResumeAdaptiveSequenceRun.mockResolvedValue({
      kind: "terminal",
      run: { id: RUN, conceptId: CONCEPT, status: "ABANDONED", steps: [] },
      status: "ABANDONED",
    });
    expect((await loadAdaptiveRunPageView(USER, RUN)).kind).toBe("abandoned");
  });

  it("foreign/missing run is not_found", async () => {
    mockResumeAdaptiveSequenceRun.mockResolvedValue({ kind: "not_found" });
    const view = await loadAdaptiveRunPageView(USER, "foreign");
    expect(view).toEqual({ kind: "not_found" });
    expect(mockConceptFindFirst).not.toHaveBeenCalled();
  });

  it("unresolved SIX intervention fails safely without inventing a step", async () => {
    mockResumeAdaptiveSequenceRun.mockResolvedValue(
      activeResume({
        currentStep: { intervention: "not-a-real-six", learningObjectId: null },
        run: {
          id: RUN,
          userId: USER,
          conceptId: CONCEPT,
          status: "ACTIVE",
          currentStepIndex: 0,
          steps: [{ intervention: "not-a-real-six", learningObjectId: null }],
          interventionHistory: [],
          lastAttemptId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    );

    const view = await loadAdaptiveRunPageView(USER, RUN);
    expect(view.kind).toBe("active");
    if (view.kind !== "active") return;
    expect(view.sixHref).toBeNull();
    expect(view.sixUnavailableReason).toBeTruthy();
  });

  it("awaiting-next ACTIVE run shows safe unavailable CTA (no Orchestrator repair)", async () => {
    mockResumeAdaptiveSequenceRun.mockResolvedValue(
      activeResume({
        currentStep: null,
        awaitingNext: true,
        run: {
          id: RUN,
          userId: USER,
          conceptId: CONCEPT,
          status: "ACTIVE",
          currentStepIndex: 1,
          steps: [{ intervention: "chunking", learningObjectId: null }],
          interventionHistory: [],
          lastAttemptId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    );

    const view = await loadAdaptiveRunPageView(USER, RUN);
    expect(view.kind).toBe("active");
    if (view.kind !== "active") return;
    expect(view.awaitingNext).toBe(true);
    expect(view.sixHref).toBeNull();
  });

  it("2G-73: coding Adaptive step launches via universal activity href", async () => {
    mockResumeAdaptiveSequenceRun.mockResolvedValue(
      activeResume({
        currentStep: { intervention: "coding", learningObjectId: null },
        run: {
          id: RUN,
          userId: USER,
          conceptId: CONCEPT,
          status: "ACTIVE",
          currentStepIndex: 0,
          steps: [{ intervention: "coding", learningObjectId: null }],
          interventionHistory: [],
          lastAttemptId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    );

    const view = await loadAdaptiveRunPageView(USER, RUN);
    expect(view.kind).toBe("active");
    if (view.kind !== "active") return;
    expect(view.activityTitle).toBe("Coding practice");
    expect(view.activityTitle?.toLowerCase()).not.toContain("adapter");
    expect(view.sixHref).toContain("/study/activities/coding");
    expect(view.sixHref).toContain(`conceptId=${CONCEPT}`);
    expect(view.sixHref).toContain(`adaptiveRunId=${RUN}`);
    expect(view.sixHref).toContain("adaptiveStep=0");
    expect(view.sixUnavailableReason).toBeNull();
  });

  it("preservation — page/route do not record, complete, or return-to-sequence", () => {
    const page = readFileSync(
      path.join(process.cwd(), "app/study/adaptive/[runId]/page.tsx"),
      "utf8",
    );
    expect(page).toContain("loadAdaptiveRunPageView");
    expect(page).not.toMatch(
      /recordAdaptiveSequenceCompletion|completeAdaptiveSequence|abandonAdaptiveSequence|orchestrateForConcept|recordEvidence/,
    );

    const model = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/sequence/adaptive-run-page.ts",
      ),
      "utf8",
    );
    expect(model).toContain("resumeAdaptiveSequenceRun");
    expect(model).toContain("resolveSixSequenceStep");
    expect(model).toContain("adaptiveRunId");
    expect(model).toContain("orchestrateForConcept");
    expect(model).toContain("buildAdaptiveLearnerStateVisibility");
    expect(model).not.toMatch(
      /recordAdaptiveSequenceCompletion|completeAdaptiveSequence|updateAdaptiveSequenceRunState|applyEvidenceToMastery|recordEvidence/,
    );

    const sixPage = readFileSync(
      path.join(process.cwd(), "app/study/six/[component]/page.tsx"),
      "utf8",
    );
    // SIX page itself remains free of sequence orchestration; context is query-only.
    expect(sixPage).not.toMatch(/recordAdaptiveSequenceCompletionAndPlanNext/);

    expect(
      existsSync(path.join(process.cwd(), "app/api/study/adaptive/start/route.ts")),
    ).toBe(true);
  });
});
