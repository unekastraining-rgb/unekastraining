/**
 * Phase 2G-46 — Assessment activity launch boundary tests.
 * Instruction only — no Quiz attempt / evidence / Adaptive mutation.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { launchAssessmentActivity } from "@/lib/learning/assessment/activity-launch";
import type { AssessmentActivityDescriptor } from "@/lib/learning/assessment/activity-preparation";
import {
  QUIZ_ACTIVITY_REF_KIND,
  QUIZ_ASSESSMENT_ADAPTER_KEY,
} from "@/lib/learning/assessment/quiz-assessment-adapter";

function quizDescriptor(
  partial?: Partial<AssessmentActivityDescriptor>,
): AssessmentActivityDescriptor {
  return {
    adapterKey: QUIZ_ASSESSMENT_ADAPTER_KEY,
    activityType: "QUIZ_ITEM",
    conceptId: "concept-1",
    learnerId: "user-1",
    assessmentMode: "DIAGNOSTIC",
    activityRef: { kind: QUIZ_ACTIVITY_REF_KIND, id: "quiz-owned-9" },
    ...partial,
  };
}

describe("Phase 2G-46 launchAssessmentActivity", () => {
  it("1–5. prepared Quiz → launch with canonical route; opaque ref; ids preserved", async () => {
    const result = await launchAssessmentActivity({
      descriptor: quizDescriptor(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.launch.href).toBe("/quizzes/quiz-owned-9");
    expect(result.launch.activityRef).toEqual({
      kind: "quiz",
      id: "quiz-owned-9",
    });
    expect(result.launch).not.toHaveProperty("quizId");
    expect(result.launch.conceptId).toBe("concept-1");
    expect(result.launch.learnerId).toBe("user-1");
    expect(result.launch.adapterKey).toBe("quiz");
    expect(result.launch.activityType).toBe("QUIZ_ITEM");
    expect(result.launch.adaptive).toBeUndefined();
  });

  it("6. standalone launch has no adaptive context", async () => {
    const result = await launchAssessmentActivity({
      descriptor: quizDescriptor({ adaptive: undefined }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.launch.adaptive).toBeUndefined();
    expect(result.launch.href).not.toContain("adaptiveRunId");
    expect(result.launch.href).not.toContain("adaptiveStep");
  });

  it("7–8. adaptive launch preserves runId and stepIndex in href", async () => {
    const adaptive = { runId: "run-46", stepIndex: 3 };
    const result = await launchAssessmentActivity({
      descriptor: quizDescriptor({ adaptive }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.launch.adaptive).toEqual(adaptive);
    expect(result.launch.href).toBe(
      "/quizzes/quiz-owned-9?adaptiveRunId=run-46&adaptiveStep=3",
    );
  });

  it("9–10. launch does not mutate adaptive object / AdaptiveSequenceRun", async () => {
    const adaptive = { runId: "run-46", stepIndex: 1 };
    const descriptor = quizDescriptor({ adaptive });
    await launchAssessmentActivity({ descriptor });
    expect(adaptive).toEqual({ runId: "run-46", stepIndex: 1 });
    expect(descriptor.adaptive).toEqual({ runId: "run-46", stepIndex: 1 });

    const source = readFileSync(
      path.join(process.cwd(), "src/lib/learning/assessment/activity-launch.ts"),
      "utf8",
    );
    expect(source).not.toMatch(
      /recordAdaptive|startOrResume|coordinator|completeStep|planNext/,
    );
  });

  it("11. missing activityRef → unavailable", async () => {
    expect(
      await launchAssessmentActivity({
        descriptor: quizDescriptor({ activityRef: undefined }),
      }),
    ).toEqual({ ok: false, reason: "activity_ref_required" });
  });

  it("12. wrong activityRef kind → unavailable", async () => {
    expect(
      await launchAssessmentActivity({
        descriptor: quizDescriptor({
          activityRef: { kind: "coding_challenge", id: "x" },
        }),
      }),
    ).toEqual({ ok: false, reason: "activity_ref_invalid" });
  });

  it("13. malformed activityRef → unavailable", async () => {
    expect(
      await launchAssessmentActivity({
        descriptor: quizDescriptor({
          activityRef: { kind: "quiz", id: "  " },
        }),
      }),
    ).toEqual({ ok: false, reason: "activity_ref_invalid" });
  });

  it("14–16. missing / foreign / concept-mismatched Quiz via optional verify", async () => {
    const missing = vi.fn(async () => ({
      ok: false as const,
      reason: "NO_QUIZ" as const,
    }));
    expect(
      await launchAssessmentActivity({
        descriptor: quizDescriptor(),
        verifyOwnedQuiz: missing,
      }),
    ).toEqual({ ok: false, reason: "activity_not_available" });

    const foreign = vi.fn(async () => ({
      ok: true as const,
      quizId: "quiz-other-user",
      title: "Other",
      topicId: "topic-1",
    }));
    expect(
      await launchAssessmentActivity({
        descriptor: quizDescriptor({
          activityRef: { kind: "quiz", id: "quiz-owned-9" },
        }),
        verifyOwnedQuiz: foreign,
      }),
    ).toEqual({ ok: false, reason: "activity_not_available" });

    const conceptMismatch = vi.fn(async () => ({
      ok: false as const,
      reason: "NO_TOPIC" as const,
    }));
    expect(
      await launchAssessmentActivity({
        descriptor: quizDescriptor({ conceptId: "concept-orphan" }),
        verifyOwnedQuiz: conceptMismatch,
      }),
    ).toEqual({ ok: false, reason: "activity_not_available" });
  });

  it("17. incomplete / non-prepared descriptor → blocked", async () => {
    expect(
      await launchAssessmentActivity({
        descriptor: {
          adapterKey: "",
          activityType: "QUIZ_ITEM",
          conceptId: "concept-1",
          learnerId: "user-1",
          activityRef: { kind: "quiz", id: "quiz-1" },
        },
      }),
    ).toEqual({ ok: false, reason: "invalid_request" });
  });

  it("18. unsupported / missing adapter path → adapter_unsupported", async () => {
    expect(
      await launchAssessmentActivity({
        descriptor: {
          adapterKey: "coding",
          activityType: "CODING_CHALLENGE",
          conceptId: "concept-1",
          learnerId: "user-1",
          activityRef: { kind: "coding_challenge", id: "c-1" },
        },
      }),
    ).toEqual({ ok: false, reason: "adapter_unsupported" });
  });

  it("no execution: launch source has no attempt/evidence/mastery/LUCKY side effects", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/learning/assessment/activity-launch.ts"),
      "utf8",
    );
    expect(source).toContain("launchAssessmentActivity");
    expect(source).toContain("quizAdaptiveHref");
    expect(source).not.toMatch(
      /recordQuizAttemptEvidence|recordEvidence|applyEvidenceToMastery|QuizAttempt|prisma|db\.|lucky|startOrResume/,
    );
    expect(source).not.toMatch(/quiz\.create|generateQuiz/);
  });

  it("optional verify success when owned id matches activityRef", async () => {
    const verify = vi.fn(async () => ({
      ok: true as const,
      quizId: "quiz-owned-9",
      title: "Loops",
      topicId: "topic-1",
    }));
    const result = await launchAssessmentActivity({
      descriptor: quizDescriptor(),
      verifyOwnedQuiz: verify,
    });
    expect(result.ok).toBe(true);
    expect(verify).toHaveBeenCalledWith({
      userId: "user-1",
      conceptId: "concept-1",
    });
  });
});
