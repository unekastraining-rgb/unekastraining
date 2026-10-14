/**
 * Phase 2G-47 — Standalone Assessment launch consumer tests.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { runStandaloneAssessmentConsumer } from "@/lib/learning/assessment/standalone-assessment-consumer";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import type { FindOwnedQuizForConceptFn } from "@/lib/learning/assessment/quiz-assessment-adapter";

function explicitAssessInput(partial?: {
  adapterKey?: string;
  adaptive?: { runId: string; stepIndex: number };
  verifyOwnedQuiz?: FindOwnedQuizForConceptFn;
  diagnosis?: "UNDERSTANDING_GAP" | "NO_INTERVENTION";
  purpose?: "ASSESS" | "PRACTICE";
  source?: "EXPLICIT" | "INFERRED";
}) {
  const purpose = partial?.purpose ?? "ASSESS";
  const source = partial?.source ?? "EXPLICIT";
  return {
    learnerId: "user-1",
    conceptId: "concept-1",
    intent:
      purpose === "ASSESS" && source === "EXPLICIT"
        ? createExplicitLearningIntent({ purpose: "ASSESS" })
        : purpose === "PRACTICE"
          ? createExplicitLearningIntent({ purpose: "PRACTICE" })
          : {
              purpose: "ASSESS" as const,
              source: "INFERRED" as const,
              scope: "request" as const,
              provenance: "tutor_mode" as const,
            },
    diagnosis: partial?.diagnosis ?? "UNDERSTANDING_GAP",
    ...(partial?.adapterKey ? { adapterKey: partial.adapterKey } : {}),
    ...(partial?.adaptive ? { adaptive: partial.adaptive } : {}),
    ...(partial?.verifyOwnedQuiz
      ? { verifyOwnedQuiz: partial.verifyOwnedQuiz }
      : {}),
  };
}

describe("Phase 2G-47 runStandaloneAssessmentConsumer", () => {
  it("1–3. explicit ASSESS + adapterKey=quiz + owned Quiz → canonical launch", async () => {
    const verifyOwnedQuiz = vi.fn(async () => ({
      ok: true as const,
      quizId: "quiz-owned-9",
      title: "Loops",
      topicId: "topic-1",
    }));

    const result = await runStandaloneAssessmentConsumer(
      explicitAssessInput({ adapterKey: "quiz", verifyOwnedQuiz }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.status).toBe("ready");
    expect(result.activityOutcome.status).toBe("ready");
    if (result.activityOutcome.status !== "ready") return;
    expect(result.activityOutcome.launch.href).toBe("/quizzes/quiz-owned-9");
    expect(result.activityOutcome.launch.activityRef).toEqual({
      kind: "quiz",
      id: "quiz-owned-9",
    });
    expect(result.activityOutcome.activity.conceptId).toBe("concept-1");
  });

  it("4. adaptive context reaches launch href query params", async () => {
    const result = await runStandaloneAssessmentConsumer(
      explicitAssessInput({
        adapterKey: "quiz",
        adaptive: { runId: "run-47", stepIndex: 2 },
        verifyOwnedQuiz: async () => ({
          ok: true,
          quizId: "quiz-adapt",
          title: "t",
          topicId: "topic-1",
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.activityOutcome.status).toBe("ready");
    if (result.activityOutcome.status !== "ready") return;
    expect(result.activityOutcome.launch.href).toBe(
      "/quizzes/quiz-adapt?adaptiveRunId=run-47&adaptiveStep=2",
    );
    expect(result.activityOutcome.launch.adaptive).toEqual({
      runId: "run-47",
      stepIndex: 2,
    });
  });

  it("5. without adapterKey — plan only (existing fields; launch skipped)", async () => {
    const result = await runStandaloneAssessmentConsumer(explicitAssessInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.adapterKey).toBeUndefined();
    expect(result.activityOutcome).toEqual({ status: "skipped" });
    expect(result.handoff).toEqual({ purpose: "ASSESS" });
  });

  it("6–7. PRACTICE / inferred ASSESS do not enter standalone consumer path", async () => {
    expect(
      await runStandaloneAssessmentConsumer(
        explicitAssessInput({ purpose: "PRACTICE", adapterKey: "quiz" }),
      ),
    ).toEqual({ ok: false, code: "invalid_assessment_intent" });

    expect(
      await runStandaloneAssessmentConsumer(
        explicitAssessInput({ source: "INFERRED", adapterKey: "quiz" }),
      ),
    ).toEqual({ ok: false, code: "explicit_assess_required" });
  });

  it("13. no matching Quiz → structured unavailable", async () => {
    const result = await runStandaloneAssessmentConsumer(
      explicitAssessInput({
        adapterKey: "quiz",
        verifyOwnedQuiz: async () => ({ ok: false, reason: "NO_QUIZ" }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.activityOutcome).toEqual({
      status: "unavailable",
      reason: "activity_not_available",
    });
  });

  it("14. client cannot force a foreign Quiz — ownership comes from lookup only", async () => {
    const verifyOwnedQuiz = vi.fn(async () => ({
      ok: false as const,
      reason: "NO_QUIZ" as const,
    }));
    const result = await runStandaloneAssessmentConsumer(
      explicitAssessInput({ adapterKey: "quiz", verifyOwnedQuiz }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.activityOutcome).toEqual({
      status: "unavailable",
      reason: "activity_not_available",
    });
    expect(verifyOwnedQuiz).toHaveBeenCalled();
  });

  it("15–16. unknown adapter / non-ready path", async () => {
    const unknown = await runStandaloneAssessmentConsumer(
      explicitAssessInput({ adapterKey: "coding" }),
    );
    expect(unknown.ok).toBe(true);
    if (!unknown.ok) return;
    expect(unknown.activityOutcome).toEqual({
      status: "unresolved",
      reason: "activity_resolution_unavailable",
    });
  });

  it("mutation boundary: consumer source has no execution side effects", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/standalone-assessment-consumer.ts",
      ),
      "utf8",
    );
    expect(source).toContain("runStandaloneAssessmentConsumer");
    expect(source).toContain("launchAssessmentActivity");
    expect(source).not.toMatch(
      /recordQuiz|recordEvidence|applyEvidenceToMastery|startOrResume|recordAdaptive|lucky|QuizAttempt|prisma|db\./,
    );
  });

  it("8–12. non-ASSESS surfaces remain free of consumer wiring", () => {
    const files = [
      "src/lib/learning/tutor/index.ts",
      "src/lib/csl/lucky-engine.ts",
      "app/core/page.tsx",
      "app/study/study-hub-view.tsx",
      "src/lib/learning/orchestrator/diagnose.ts",
      "src/lib/learning/intent/project.ts",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toContain("runStandaloneAssessmentConsumer");
      expect(source).not.toContain("launchAssessmentActivity");
    }
  });
});
