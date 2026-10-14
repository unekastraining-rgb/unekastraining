/**
 * Phase 2G-45 — Owned Quiz identity into non-executing descriptor.
 * Uses injected findOwnedQuiz — no Quiz creation / attempt / evidence.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";
import { prepareAssessmentActivity } from "@/lib/learning/assessment/activity-preparation";
import { resolveAssessmentActivity } from "@/lib/learning/assessment/activity-resolution";
import {
  QUIZ_ACTIVITY_REF_KIND,
  QUIZ_ASSESSMENT_ADAPTER_KEY,
  createAssessmentAdapterRegistryWithQuiz,
  createQuizAssessmentAdapter,
  registerQuizAssessmentAdapter,
  type FindOwnedQuizForConceptFn,
} from "@/lib/learning/assessment/quiz-assessment-adapter";
import { runStandaloneAssessmentEntry } from "@/lib/learning/assessment/standalone-entry";
import {
  runAssessmentWorkflow,
  type AssessmentPlan,
} from "@/lib/learning/assessment/workflow";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";

function readyQuizPlan(partial?: Partial<AssessmentPlan>): AssessmentPlan {
  const base = runAssessmentWorkflow({
    learnerId: "user-1",
    assessmentHandoff: { purpose: "ASSESS" },
    decisionContext: {
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    },
    diagnosis: "UNDERSTANDING_GAP",
    conceptId: "concept-1",
  });
  return {
    ...base,
    adapterKey: "quiz",
    activityType: "QUIZ_ITEM",
    ...partial,
  };
}

function ownedFinder(
  result: Awaited<ReturnType<FindOwnedQuizForConceptFn>>,
): FindOwnedQuizForConceptFn {
  return vi.fn(async () => result);
}

describe("Phase 2G-45 owned Quiz identity → descriptor", () => {
  it("1. ready Quiz plan + owned matching Quiz → opaque activityRef", async () => {
    const findOwnedQuiz = ownedFinder({
      ok: true,
      quizId: "quiz-owned-9",
      title: "Loops",
      topicId: "topic-1",
    });
    const registry = createAssessmentAdapterRegistryWithQuiz({ findOwnedQuiz });
    const plan = readyQuizPlan();
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
    expect(prepared.descriptor.activityRef).toEqual({
      kind: QUIZ_ACTIVITY_REF_KIND,
      id: "quiz-owned-9",
    });
    expect(findOwnedQuiz).toHaveBeenCalledWith({
      userId: "user-1",
      conceptId: "concept-1",
    });
  });

  it("2. no matching Quiz → activity_not_available", async () => {
    const registry = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: ownedFinder({ ok: false, reason: "NO_QUIZ" }),
    });
    const plan = readyQuizPlan();
    const resolved = resolveAssessmentActivity(plan, "user-1", registry);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    expect(
      await prepareAssessmentActivity({
        plan,
        resolution: resolved.resolution,
        learnerId: "user-1",
        registry,
      }),
    ).toEqual({ ok: false, reason: "activity_not_available" });
  });

  it("3–4. foreign / concept mismatch → unavailable (canonical lookup fails)", async () => {
    // Foreign Quiz never returned by findOwnedQuizForConcept (userId filter).
    const foreign = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: ownedFinder({ ok: false, reason: "NO_QUIZ" }),
    });
    const plan = readyQuizPlan();
    const resolved = resolveAssessmentActivity(plan, "user-1", foreign);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(
      await prepareAssessmentActivity({
        plan,
        resolution: resolved.resolution,
        learnerId: "user-1",
        registry: foreign,
      }),
    ).toEqual({ ok: false, reason: "activity_not_available" });

    const noTopic = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: ownedFinder({ ok: false, reason: "NO_TOPIC" }),
    });
    expect(
      await prepareAssessmentActivity({
        plan: readyQuizPlan({ conceptId: "concept-orphan" }),
        resolution: {
          adapterKey: "quiz",
          activityType: "QUIZ_ITEM",
        },
        learnerId: "user-1",
        registry: noTopic,
      }),
    ).toEqual({ ok: false, reason: "activity_not_available" });
  });

  it("5. non-ready plan → rejected before lookup", async () => {
    const findOwnedQuiz = ownedFinder({
      ok: true,
      quizId: "quiz-1",
      title: "t",
      topicId: "topic-1",
    });
    const registry = createAssessmentAdapterRegistryWithQuiz({ findOwnedQuiz });
    expect(
      await prepareAssessmentActivity({
        plan: {
          status: "deferred",
          conceptId: "concept-1",
          adapterKey: "quiz",
        },
        resolution: { adapterKey: "quiz", activityType: "QUIZ_ITEM" },
        learnerId: "user-1",
        registry,
      }),
    ).toEqual({ ok: false, reason: "plan_not_ready" });
    expect(findOwnedQuiz).not.toHaveBeenCalled();
  });

  it("6. missing adapter key → unresolved (no Quiz default)", () => {
    const registry = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: ownedFinder({
        ok: true,
        quizId: "quiz-1",
        title: "t",
        topicId: "topic-1",
      }),
    });
    const plan = readyQuizPlan({ adapterKey: undefined, activityType: undefined });
    expect(plan.adapterKey).toBeUndefined();
    expect(resolveAssessmentActivity(plan, "user-1", registry)).toEqual({
      ok: false,
      reason: "activity_resolution_unavailable",
    });
  });

  it("7. wrong adapter key — Quiz adapter does not handle", () => {
    const adapter = createQuizAssessmentAdapter();
    expect(
      adapter.canHandle({
        plan: readyQuizPlan({ adapterKey: "coding" }),
        learnerId: "user-1",
      }),
    ).toBe(false);
  });

  it("8. malformed Quiz identity from lookup → unavailable", async () => {
    const registry = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: ownedFinder({
        ok: true,
        quizId: "   ",
        title: "t",
        topicId: "topic-1",
      }),
    });
    expect(
      await prepareAssessmentActivity({
        plan: readyQuizPlan(),
        resolution: { adapterKey: "quiz", activityType: "QUIZ_ITEM" },
        learnerId: "user-1",
        registry,
      }),
    ).toEqual({ ok: false, reason: "activity_not_available" });
  });

  it("9. standalone context: explicit quiz + owned id", async () => {
    const entry = runStandaloneAssessmentEntry({
      learnerId: "user-1",
      conceptId: "concept-standalone",
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
      diagnosis: "NO_INTERVENTION",
    });
    expect(entry.ok).toBe(true);
    if (!entry.ok) return;
    expect(entry.plan.adapterKey).toBeUndefined();

    const plan: AssessmentPlan = {
      ...entry.plan,
      adapterKey: "quiz",
      activityType: "QUIZ_ITEM",
    };
    const registry = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: ownedFinder({
        ok: true,
        quizId: "quiz-standalone",
        title: "Standalone quiz",
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
    expect(prepared.descriptor.activityRef).toEqual({
      kind: "quiz",
      id: "quiz-standalone",
    });
  });

  it("10. adaptive context preserved passively", async () => {
    const adaptive = { runId: "run-45", stepIndex: 2 };
    const plan = readyQuizPlan({ adaptive });
    const registry = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: ownedFinder({
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
    expect(plan.adaptive).toEqual({ runId: "run-45", stepIndex: 2 });
  });

  it("11–15. no Quiz creation / attempt / evidence / mastery / Adaptive mutation", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/assessment/quiz-assessment-adapter.ts",
      ),
      "utf8",
    );
    expect(source).toContain("findOwnedQuizForConcept");
    expect(source).toContain("QUIZ_ACTIVITY_REF_KIND");
    expect(source).not.toMatch(
      /quiz\.create|generateQuiz|recordQuizAttemptEvidence|quizAdaptiveHref|recordAdaptive|startOrResume|applyEvidenceToMastery/,
    );
    expect(source).not.toMatch(/\bdb\./);

    const empty = createAssessmentAdapterRegistry();
    expect(empty.has(QUIZ_ASSESSMENT_ADAPTER_KEY)).toBe(false);
    registerQuizAssessmentAdapter(empty, {
      findOwnedQuiz: ownedFinder({
        ok: true,
        quizId: "q",
        title: "t",
        topicId: "t",
      }),
    });
    expect(empty.has("quiz")).toBe(true);
  });
});
