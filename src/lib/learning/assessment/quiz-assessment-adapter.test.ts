/**
 * Phase 2G-44 — Quiz Assessment Adapter registration tests.
 * Proves Quiz plugs in explicitly — never as ASSESS default.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";
import {
  prepareAssessmentActivity,
} from "@/lib/learning/assessment/activity-preparation";
import { resolveAssessmentActivity } from "@/lib/learning/assessment/activity-resolution";
import {
  QUIZ_ASSESSMENT_ACTIVITY_TYPE,
  QUIZ_ASSESSMENT_ADAPTER_KEY,
  createAssessmentAdapterRegistryWithQuiz,
  createQuizAssessmentAdapter,
  registerQuizAssessmentAdapter,
} from "@/lib/learning/assessment/quiz-assessment-adapter";
import { runStandaloneAssessmentEntry } from "@/lib/learning/assessment/standalone-entry";
import {
  runAssessmentWorkflow,
  type AssessmentPlan,
} from "@/lib/learning/assessment/workflow";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";

function readyAssessPlan(partial?: Partial<AssessmentPlan>): AssessmentPlan {
  const base = runAssessmentWorkflow({
    learnerId: "user-1",
    assessmentHandoff: { purpose: "ASSESS" },
    decisionContext: {
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    },
    diagnosis: "UNDERSTANDING_GAP",
    conceptId: "concept-1",
  });
  return { ...base, ...partial };
}

describe("Phase 2G-44 Quiz Assessment Adapter registration", () => {
  it("registers Quiz adapter; lists it; rejects duplicate", () => {
    const registry = createAssessmentAdapterRegistry();
    expect(registry.list()).toEqual([]);
    expect(registerQuizAssessmentAdapter(registry)).toEqual({ ok: true });
    expect(registry.has(QUIZ_ASSESSMENT_ADAPTER_KEY)).toBe(true);
    expect(registry.list().map((a) => a.key)).toEqual([
      QUIZ_ASSESSMENT_ADAPTER_KEY,
    ]);
    expect(registerQuizAssessmentAdapter(registry)).toEqual({
      ok: false,
      reason: "duplicate_key",
    });
  });

  it("createAssessmentAdapterRegistryWithQuiz registers Quiz once", () => {
    const registry = createAssessmentAdapterRegistryWithQuiz();
    expect(registry.list()).toHaveLength(1);
    expect(registry.resolve("quiz").ok).toBe(true);
  });

  it("explicit adapterKey=quiz resolves through registry", () => {
    const registry = createAssessmentAdapterRegistryWithQuiz();
    const result = resolveAssessmentActivity(
      readyAssessPlan({ adapterKey: "quiz" }),
      "user-1",
      registry,
    );
    expect(result).toEqual({
      ok: true,
      resolution: {
        adapterKey: QUIZ_ASSESSMENT_ADAPTER_KEY,
        activityType: QUIZ_ASSESSMENT_ACTIVITY_TYPE,
      },
      learnerId: "user-1",
    });
  });

  it("ready ASSESS plan without adapterKey does NOT resolve to Quiz", () => {
    const registry = createAssessmentAdapterRegistryWithQuiz();
    const plan = readyAssessPlan();
    expect(plan.status).toBe("ready");
    expect(plan.adapterKey).toBeUndefined();

    expect(resolveAssessmentActivity(plan, "user-1", registry)).toEqual({
      ok: false,
      reason: "activity_resolution_unavailable",
    });
  });

  it("wrong adapter key does not resolve to Quiz", () => {
    const registry = createAssessmentAdapterRegistryWithQuiz();
    expect(
      resolveAssessmentActivity(
        readyAssessPlan({ adapterKey: "coding" }),
        "user-1",
        registry,
      ),
    ).toEqual({ ok: false, reason: "not_found" });
  });

  it("canHandle is false for ASSESS without explicit quiz key", () => {
    const adapter = createQuizAssessmentAdapter();
    expect(
      adapter.canHandle({
        plan: readyAssessPlan(),
        learnerId: "user-1",
      }),
    ).toBe(false);
    expect(
      adapter.canHandle({
        plan: readyAssessPlan({ adapterKey: "quiz" }),
        learnerId: "user-1",
      }),
    ).toBe(true);
  });

  it("prepare with injected owned Quiz → opaque quiz activityRef", async () => {
    const registry = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: async () => ({
        ok: true,
        quizId: "quiz-owned-9",
        title: "Loops",
        topicId: "topic-1",
      }),
    });
    const plan = readyAssessPlan({
      adapterKey: "quiz",
      activityType: "QUIZ_ITEM",
    });
    const resolved = resolveAssessmentActivity(plan, "user-1", registry);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const prepared = await prepareAssessmentActivity({
      plan,
      resolution: resolved.resolution,
      learnerId: "user-1",
      registry,
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.descriptor).toEqual({
      adapterKey: "quiz",
      activityType: "QUIZ_ITEM",
      conceptId: "concept-1",
      learnerId: "user-1",
      assessmentMode: "DIAGNOSTIC",
      activityRef: { kind: "quiz", id: "quiz-owned-9" },
    });
  });

  it("standalone entry + explicit quiz adapterKey can resolve/prepare with owned id", async () => {
    const entry = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-standalone",
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      diagnosis: "NO_INTERVENTION",
    });
    expect(entry.ok).toBe(true);
    if (!entry.ok) return;
    // Standalone does not auto-assign Quiz.
    expect(entry.plan.adapterKey).toBeUndefined();

    const plan: AssessmentPlan = {
      ...entry.plan,
      adapterKey: "quiz",
      activityType: "QUIZ_ITEM",
    };
    const registry = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: async () => ({
        ok: true,
        quizId: "quiz-standalone",
        title: "S",
        topicId: "topic-s",
      }),
    });
    const resolved = resolveAssessmentActivity(plan, "user-1", registry);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const prepared = await prepareAssessmentActivity({
      plan,
      resolution: resolved.resolution,
      learnerId: "user-1",
      registry,
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.descriptor.conceptId).toBe("concept-standalone");
    expect(prepared.descriptor.assessmentMode).toBe("VERIFICATION");
    expect(prepared.descriptor.adapterKey).toBe("quiz");
    expect(prepared.descriptor.activityRef).toEqual({
      kind: "quiz",
      id: "quiz-standalone",
    });
  });

  it("adaptive context preserved passively through resolve → prepare", async () => {
    const adaptive = { runId: "run-44", stepIndex: 1 };
    const plan = readyAssessPlan({
      adapterKey: "quiz",
      activityType: "QUIZ_ITEM",
      adaptive,
    });
    const registry = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: async () => ({
        ok: true,
        quizId: "quiz-adapt",
        title: "t",
        topicId: "topic-1",
      }),
    });
    const resolved = resolveAssessmentActivity(plan, "user-1", registry);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const prepared = await prepareAssessmentActivity({
      plan,
      resolution: resolved.resolution,
      learnerId: "user-1",
      registry,
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.descriptor.adaptive).toEqual(adaptive);
    expect(plan.adaptive).toEqual({ runId: "run-44", stepIndex: 1 });
  });

  it("empty createAssessmentAdapterRegistry remains Quiz-free", () => {
    const empty = createAssessmentAdapterRegistry();
    expect(empty.has("quiz")).toBe(false);
    expect(
      resolveAssessmentActivity(
        readyAssessPlan({ adapterKey: "quiz" }),
        "user-1",
        empty,
      ),
    ).toEqual({ ok: false, reason: "not_found" });
  });

  it("no execution / evidence / Adaptive coordinator; reuses findOwnedQuizForConcept only", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/quiz-assessment-adapter.ts",
      ),
      "utf8",
    );
    expect(source).toContain("QUIZ_ASSESSMENT_ADAPTER_KEY");
    expect(source).toContain("findOwnedQuizForConcept");
    expect(source).toContain("QUIZ_ACTIVITY_REF_KIND");
    expect(source).not.toMatch(
      /startOrResume|recordEvidence|applyEvidenceToMastery|recordAdaptive|coordinator|quizAdaptiveHref/,
    );
    expect(source).not.toMatch(/recordQuizAttemptEvidence|prisma|db\./);
  });

  it("workflow / standalone / mode policy do not auto-assign quiz adapterKey", () => {
    for (const file of [
      "src/lib/learning/assessment/workflow.ts",
      "src/lib/learning/assessment/standalone-entry.ts",
      "src/lib/learning/assessment/assessment-mode-policy.ts",
    ]) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/adapterKey\s*[:=]\s*[\"']quiz[\"']/);
      expect(source).not.toContain("registerQuizAssessmentAdapter");
      expect(source).not.toContain("createAssessmentAdapterRegistryWithQuiz");
    }
  });
});
