/**
 * Phase 2G-40 / 2G-47 — POST /api/study/assessment route contract.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockGetOrCreateDefaultUser,
  mockGetLearnerConceptMastery,
  mockRunConsumer,
} = vi.hoisted(() => ({
  mockGetOrCreateDefaultUser: vi.fn(),
  mockGetLearnerConceptMastery: vi.fn(),
  mockRunConsumer: vi.fn(),
}));

vi.mock("@/lib/user", () => ({
  getOrCreateDefaultUser: mockGetOrCreateDefaultUser,
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor() {
      super("Unauthorized");
      this.name = "UnauthorizedError";
    }
  },
}));

vi.mock("@/lib/learning/learner-model/read", () => ({
  getLearnerConceptMastery: mockGetLearnerConceptMastery,
}));

vi.mock("@/lib/learning/assessment/standalone-assessment-consumer", () => ({
  runStandaloneAssessmentConsumer: mockRunConsumer,
}));

import { UnauthorizedError } from "@/lib/user";
import { POST } from "../../../../app/api/study/assessment/route";

describe("POST /api/study/assessment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultUser.mockResolvedValue({ id: "user-session" });
    mockGetLearnerConceptMastery.mockResolvedValue({
      conceptId: "concept-1",
      learnerId: "user-session",
    });
  });

  it("23. authentication is required", async () => {
    mockGetOrCreateDefaultUser.mockRejectedValue(new UnauthorizedError());
    const response = await POST(
      new Request("http://localhost/api/study/assessment", {
        method: "POST",
        body: JSON.stringify({
          conceptId: "concept-1",
          intent: {
            purpose: "ASSESS",
            source: "EXPLICIT",
            scope: "request",
          },
          diagnosis: "UNDERSTANDING_GAP",
        }),
      }),
    );
    const json = await response.json();
    expect(response.status).toBe(401);
    expect(json).toEqual({ success: false, error: "unauthorized" });
    expect(mockRunConsumer).not.toHaveBeenCalled();
  });

  it("24. malformed request is rejected safely", async () => {
    const response = await POST(
      new Request("http://localhost/api/study/assessment", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(response.status).toBe(400);
    expect(mockRunConsumer).not.toHaveBeenCalled();
  });

  it("25. non-ASSESS request is rejected", async () => {
    mockRunConsumer.mockResolvedValue({
      ok: false,
      code: "invalid_assessment_intent",
    });
    const response = await POST(
      new Request("http://localhost/api/study/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: "concept-1",
          intent: {
            purpose: "PRACTICE",
            source: "EXPLICIT",
            scope: "request",
          },
          diagnosis: "UNDERSTANDING_GAP",
        }),
      }),
    );
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json).toEqual({
      success: false,
      error: "invalid_assessment_intent",
    });
  });

  it("26–27. valid explicit ASSESS returns AssessmentPlan; existing fields intact", async () => {
    mockRunConsumer.mockResolvedValue({
      ok: true,
      handoff: { purpose: "ASSESS" },
      plan: {
        status: "ready",
        assessmentMode: "DIAGNOSTIC",
        conceptId: "concept-1",
      },
      activityOutcome: { status: "skipped" },
    });

    const response = await POST(
      new Request("http://localhost/api/study/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: "concept-1",
          intent: {
            purpose: "ASSESS",
            source: "EXPLICIT",
            scope: "request",
          },
          diagnosis: "UNDERSTANDING_GAP",
          learnerId: "attacker",
          userId: "attacker",
          quizId: "quiz-foreign",
        }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.status).toBe("ready");
    expect(json.assessmentMode).toBe("DIAGNOSTIC");
    expect(json.conceptId).toBe("concept-1");
    expect(json.plan).toEqual({
      status: "ready",
      assessmentMode: "DIAGNOSTIC",
      conceptId: "concept-1",
    });
    expect(json.activityOutcome).toBe("skipped");
    expect(json.questions).toBeUndefined();
    expect(json.score).toBeUndefined();

    expect(mockRunConsumer).toHaveBeenCalledWith(
      expect.objectContaining({
        learnerId: "user-session",
        conceptId: "concept-1",
      }),
    );
    expect(mockRunConsumer.mock.calls[0][0].quizId).toBeUndefined();
    expect(mockRunConsumer).not.toHaveBeenCalledWith(
      expect.objectContaining({ learnerId: "attacker" }),
    );
  });

  it("additive launch fields when adapterKey=quiz and activity ready", async () => {
    mockRunConsumer.mockResolvedValue({
      ok: true,
      handoff: { purpose: "ASSESS" },
      plan: {
        status: "ready",
        assessmentMode: "DIAGNOSTIC",
        conceptId: "concept-1",
        adapterKey: "quiz",
        activityType: "QUIZ_ITEM",
      },
      activityOutcome: {
        status: "ready",
        activity: {
          adapterKey: "quiz",
          activityType: "QUIZ_ITEM",
          conceptId: "concept-1",
          learnerId: "user-session",
          activityRef: { kind: "quiz", id: "quiz-9" },
        },
        launch: {
          adapterKey: "quiz",
          activityType: "QUIZ_ITEM",
          conceptId: "concept-1",
          learnerId: "user-session",
          activityRef: { kind: "quiz", id: "quiz-9" },
          href: "/quizzes/quiz-9",
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/study/assessment", {
        method: "POST",
        body: JSON.stringify({
          conceptId: "concept-1",
          adapterKey: "quiz",
          intent: {
            purpose: "ASSESS",
            source: "EXPLICIT",
            scope: "request",
          },
          diagnosis: "UNDERSTANDING_GAP",
        }),
      }),
    );
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.activityOutcome).toBe("ready");
    expect(json.launch.href).toBe("/quizzes/quiz-9");
    expect(json.activity.activityRef).toEqual({ kind: "quiz", id: "quiz-9" });
    expect(mockRunConsumer).toHaveBeenCalledWith(
      expect.objectContaining({ adapterKey: "quiz" }),
    );
  });

  it("structured unavailable when no Quiz", async () => {
    mockRunConsumer.mockResolvedValue({
      ok: true,
      handoff: { purpose: "ASSESS" },
      plan: {
        status: "ready",
        assessmentMode: "DIAGNOSTIC",
        conceptId: "concept-1",
        adapterKey: "quiz",
      },
      activityOutcome: {
        status: "unavailable",
        reason: "activity_not_available",
      },
    });
    const response = await POST(
      new Request("http://localhost/api/study/assessment", {
        method: "POST",
        body: JSON.stringify({
          conceptId: "concept-1",
          adapterKey: "quiz",
          intent: {
            purpose: "ASSESS",
            source: "EXPLICIT",
            scope: "request",
          },
          diagnosis: "UNDERSTANDING_GAP",
        }),
      }),
    );
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.activityOutcome).toBe("unavailable");
    expect(json.activityError).toBe("activity_not_available");
    expect(json.launch).toBeUndefined();
  });

  it("returns 404 when concept is not owned", async () => {
    mockGetLearnerConceptMastery.mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost/api/study/assessment", {
        method: "POST",
        body: JSON.stringify({
          conceptId: "other-concept",
          intent: {
            purpose: "ASSESS",
            source: "EXPLICIT",
            scope: "request",
          },
          diagnosis: "UNDERSTANDING_GAP",
        }),
      }),
    );
    expect(response.status).toBe(404);
    expect(mockRunConsumer).not.toHaveBeenCalled();
  });

  it("route ignores client quizId; does not execute Quiz", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/api/study/assessment/route.ts"),
      "utf8",
    );
    expect(source).toContain("runStandaloneAssessmentConsumer");
    expect(source).toContain("void body.quizId");
    expect(source).toContain("getOrCreateDefaultUser");
    expect(source).not.toContain("recordQuiz");
    expect(source).not.toContain("startOrResumeAdaptiveSequence");
    expect(source).not.toMatch(/quiz\.create|generateQuiz/);
  });
});
