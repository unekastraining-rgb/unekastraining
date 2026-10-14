/**
 * Phase 2G-53 — Flashcard Assessment Adapter foundation tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";
import { launchAssessmentActivity } from "@/lib/learning/assessment/activity-launch";
import { prepareAssessmentActivity } from "@/lib/learning/assessment/activity-preparation";
import { resolveAssessmentActivity } from "@/lib/learning/assessment/activity-resolution";
import {
  FLASHCARD_ACTIVITY_REF_KIND,
  FLASHCARD_ASSESSMENT_ACTIVITY_TYPE,
  FLASHCARD_ASSESSMENT_ADAPTER_KEY,
  FLASHCARD_ASSESSMENT_ALLOWED_MODE,
  createAssessmentAdapterRegistryWithFlashcard,
  createFlashcardAssessmentAdapter,
  findOwnedDueFlashcardForConcept,
  flashcardAssessmentHref,
  registerFlashcardAssessmentAdapter,
} from "@/lib/learning/assessment/flashcard-assessment-adapter";
import {
  QUIZ_ASSESSMENT_ADAPTER_KEY,
  createAssessmentAdapterRegistryWithQuiz,
} from "@/lib/learning/assessment/quiz-assessment-adapter";
import { runStandaloneAssessmentConsumer } from "@/lib/learning/assessment/standalone-assessment-consumer";
import {
  runAssessmentWorkflow,
  type AssessmentPlan,
} from "@/lib/learning/assessment/workflow";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";

function readyPlan(partial?: Partial<AssessmentPlan>): AssessmentPlan {
  const base = runAssessmentWorkflow({
    learnerId: "user-1",
    assessmentHandoff: { purpose: "ASSESS" },
    decisionContext: {
      intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
    },
    // RETENTION_GAP → PRACTICE_CHECK via mode policy
    diagnosis: "RETENTION_GAP",
    conceptId: "concept-1",
  });
  return {
    ...base,
    assessmentMode: FLASHCARD_ASSESSMENT_ALLOWED_MODE,
    ...partial,
  };
}

describe("Phase 2G-53 Flashcard Assessment Adapter", () => {
  describe("canHandle / resolve", () => {
    it("ready + flashcard + PRACTICE_CHECK → handles", () => {
      const adapter = createFlashcardAssessmentAdapter();
      expect(
        adapter.canHandle({
          plan: readyPlan({ adapterKey: "flashcard" }),
          learnerId: "user-1",
        }),
      ).toBe(true);
    });

    it("ready + flashcard + DIAGNOSTIC → does not handle", () => {
      const adapter = createFlashcardAssessmentAdapter();
      expect(
        adapter.canHandle({
          plan: readyPlan({
            adapterKey: "flashcard",
            assessmentMode: "DIAGNOSTIC",
          }),
          learnerId: "user-1",
        }),
      ).toBe(false);
    });

    it("ready + flashcard + VERIFICATION → does not handle", () => {
      const adapter = createFlashcardAssessmentAdapter();
      expect(
        adapter.canHandle({
          plan: readyPlan({
            adapterKey: "flashcard",
            assessmentMode: "VERIFICATION",
          }),
          learnerId: "user-1",
        }),
      ).toBe(false);
    });

    it("wrong adapter key → does not handle", () => {
      const adapter = createFlashcardAssessmentAdapter();
      expect(
        adapter.canHandle({
          plan: readyPlan({ adapterKey: "quiz" }),
          learnerId: "user-1",
        }),
      ).toBe(false);
    });

    it("non-ready plan → does not handle", () => {
      const adapter = createFlashcardAssessmentAdapter();
      expect(
        adapter.canHandle({
          plan: {
            status: "blocked",
            conceptId: "concept-1",
            adapterKey: "flashcard",
            assessmentMode: "PRACTICE_CHECK",
            blockReason: "missing",
          },
          learnerId: "user-1",
        }),
      ).toBe(false);
    });

    it("resolve returns FLASHCARD activity type", () => {
      const adapter = createFlashcardAssessmentAdapter();
      expect(
        adapter.resolve({
          plan: readyPlan({ adapterKey: "flashcard" }),
          learnerId: "user-1",
        }),
      ).toEqual({
        adapterKey: FLASHCARD_ASSESSMENT_ADAPTER_KEY,
        activityType: FLASHCARD_ASSESSMENT_ACTIVITY_TYPE,
      });
    });
  });

  describe("ownership / prepare", () => {
    it("owned Flashcard resolves to opaque activityRef", async () => {
      const registry = createAssessmentAdapterRegistryWithFlashcard({
        findOwnedDueFlashcard: async () => ({
          ok: true,
          flashcardId: "card-owned-1",
          topicId: "topic-1",
          courseId: "course-1",
          topicName: "Photosynthesis",
        }),
      });
      const plan = readyPlan({ adapterKey: "flashcard" });
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
        kind: FLASHCARD_ACTIVITY_REF_KIND,
        id: "card-owned-1",
      });
      expect(prepared.descriptor.learnerId).toBe("user-1");
      expect(prepared.descriptor.conceptId).toBe("concept-1");
      expect(prepared.descriptor.assessmentMode).toBe("PRACTICE_CHECK");
      expect(prepared.descriptor.adapterKey).toBe("flashcard");
      expect(prepared.descriptor.activityType).toBe("FLASHCARD");
    });

    it("foreign-user / missing Flashcard → unavailable", async () => {
      const registry = createAssessmentAdapterRegistryWithFlashcard({
        findOwnedDueFlashcard: async () => ({
          ok: false,
          reason: "NO_FLASHCARD",
        }),
      });
      const plan = readyPlan({ adapterKey: "flashcard" });
      const resolved = resolveAssessmentActivity(plan, "user-1", registry);
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) return;

      const prepared = await prepareAssessmentActivity({
        plan,
        resolution: resolved.resolution,
        learnerId: "user-1",
        registry,
      });
      expect(prepared).toEqual({
        ok: false,
        reason: "activity_not_available",
      });
    });

    it("concept mismatch (NO_TOPIC) → unavailable", async () => {
      const registry = createAssessmentAdapterRegistryWithFlashcard({
        findOwnedDueFlashcard: async () => ({
          ok: false,
          reason: "NO_TOPIC",
        }),
      });
      const plan = readyPlan({ adapterKey: "flashcard" });
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

    it("findOwnedDueFlashcardForConcept rejects empty identity without lookup", async () => {
      await expect(
        findOwnedDueFlashcardForConcept({ userId: "", conceptId: "c1" }),
      ).resolves.toEqual({ ok: false, reason: "invalid_request" });
      await expect(
        findOwnedDueFlashcardForConcept({ userId: "u1", conceptId: "" }),
      ).resolves.toEqual({ ok: false, reason: "invalid_request" });
    });

    it("prepare does not write evidence / mastery / SM-2 / LUCKY / Adaptive", () => {
      const source = readFileSync(
        path.join(
          process.cwd(),
          "src/lib/learning/assessment/flashcard-assessment-adapter.ts",
        ),
        "utf8",
      );
      expect(source).not.toMatch(
        /recordEvidence|applyEvidenceToMastery|applySm2Review|syncFlashcardRetentionItem|recordAdaptive|LearningAttempt/,
      );
      expect(source).not.toMatch(/flashcard\.create|Flashcard\.create|db\.flashcard\.create/);
      expect(source).not.toMatch(/flashcard\.update|db\.flashcard\.update/);
    });
  });

  describe("launch", () => {
    it("returns existing Flashcard route; preserves activityRef; passive adaptive", async () => {
      const result = await launchAssessmentActivity({
        descriptor: {
          adapterKey: FLASHCARD_ASSESSMENT_ADAPTER_KEY,
          activityType: "FLASHCARD",
          conceptId: "concept-1",
          learnerId: "user-1",
          assessmentMode: "PRACTICE_CHECK",
          activityRef: { kind: FLASHCARD_ACTIVITY_REF_KIND, id: "card-9" },
          adaptive: { runId: "run-53", stepIndex: 2 },
        },
        resolveFlashcardLaunchContext: async () => ({
          ok: true,
          flashcardId: "card-9",
          courseId: "course-abc",
          topicName: "Cell Division",
        }),
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.launch.href).toBe(
        "/flashcards?courseId=course-abc&topic=Cell+Division&adaptiveRunId=run-53&adaptiveStep=2",
      );
      expect(result.launch.activityRef).toEqual({
        kind: "flashcard",
        id: "card-9",
      });
      expect(result.launch).not.toHaveProperty("flashcardId");
      expect(result.launch.href).toContain("adaptiveRunId=run-53");
      expect(result.launch.href).toContain("adaptiveStep=2");
      expect(result.launch.adaptive).toEqual({
        runId: "run-53",
        stepIndex: 2,
      });
    });

    it("flashcardAssessmentHref uses existing query shape only", () => {
      expect(flashcardAssessmentHref({ courseId: "c1" })).toBe(
        "/flashcards?courseId=c1",
      );
      expect(
        flashcardAssessmentHref({ courseId: "c1", topicName: "Mitosis" }),
      ).toBe("/flashcards?courseId=c1&topic=Mitosis");
    });

    it("verifyOwnedFlashcard mismatch → activity_not_available", async () => {
      expect(
        await launchAssessmentActivity({
          descriptor: {
            adapterKey: FLASHCARD_ASSESSMENT_ADAPTER_KEY,
            activityType: "FLASHCARD",
            conceptId: "concept-1",
            learnerId: "user-1",
            activityRef: { kind: "flashcard", id: "card-a" },
          },
          verifyOwnedFlashcard: async () => ({
            ok: true,
            flashcardId: "card-other",
            topicId: "t1",
            courseId: "c1",
            topicName: "T",
          }),
          resolveFlashcardLaunchContext: async () => ({
            ok: true,
            flashcardId: "card-a",
            courseId: "c1",
            topicName: "T",
          }),
        }),
      ).toEqual({ ok: false, reason: "activity_not_available" });
    });
  });

  describe("registry", () => {
    it("default empty registry unchanged; Flashcard opt-in; Quiz unchanged", () => {
      expect(createAssessmentAdapterRegistry().list()).toHaveLength(0);

      const withFlashcard = createAssessmentAdapterRegistryWithFlashcard();
      expect(withFlashcard.list().map((a) => a.key)).toEqual([
        FLASHCARD_ASSESSMENT_ADAPTER_KEY,
      ]);

      const withQuiz = createAssessmentAdapterRegistryWithQuiz();
      expect(withQuiz.list().map((a) => a.key)).toEqual([
        QUIZ_ASSESSMENT_ADAPTER_KEY,
      ]);
      expect(withQuiz.has("flashcard")).toBe(false);

      const registry = createAssessmentAdapterRegistry();
      expect(registerFlashcardAssessmentAdapter(registry)).toEqual({ ok: true });
      expect(registerFlashcardAssessmentAdapter(registry)).toEqual({
        ok: false,
        reason: "duplicate_key",
      });
    });

    it("DIAGNOSTIC flashcard plan cannot resolve through registry", () => {
      const registry = createAssessmentAdapterRegistryWithFlashcard();
      expect(
        resolveAssessmentActivity(
          readyPlan({
            adapterKey: "flashcard",
            assessmentMode: "DIAGNOSTIC",
          }),
          "user-1",
          registry,
        ),
      ).toEqual({ ok: false, reason: "adapter_cannot_handle" });
    });
  });

  describe("consumer + evidence boundary", () => {
    it("standalone consumer launches Flashcard for PRACTICE_CHECK", async () => {
      const result = await runStandaloneAssessmentConsumer({
        learnerId: "user-1",
        conceptId: "concept-1",
        intent: createExplicitLearningIntent({ purpose: "ASSESS" }),
        diagnosis: "RETENTION_GAP",
        adapterKey: "flashcard",
        verifyOwnedFlashcard: async () => ({
          ok: true,
          flashcardId: "card-55",
          topicId: "topic-1",
          courseId: "course-1",
          topicName: "Topic",
        }),
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.activityOutcome.status).toBe("ready");
      if (result.activityOutcome.status !== "ready") return;
      expect(result.activityOutcome.launch.href).toContain("/flashcards?");
      expect(result.activityOutcome.launch.activityRef).toEqual({
        kind: "flashcard",
        id: "card-55",
      });
      expect(result.plan.assessmentMode).toBe("PRACTICE_CHECK");
    });

    it("no new Flashcard UI; evidence path untouched in adapter/launch/consumer", () => {
      for (const rel of [
        "src/lib/learning/assessment/flashcard-assessment-adapter.ts",
        "src/lib/learning/assessment/activity-launch.ts",
        "src/lib/learning/assessment/standalone-assessment-consumer.ts",
      ]) {
        const src = readFileSync(path.join(process.cwd(), rel), "utf8");
        expect(src).not.toMatch(
          /recordFlashcardReviewEvidence|recordEvidence|applyEvidenceToMastery|applySm2Review/,
        );
        expect(src).not.toMatch(
          /bindFlashcard|recordAdaptiveSequenceCompletion/,
        );
      }
      expect(
        readFileSync(
          path.join(process.cwd(), "app/flashcards/flashcards-view.tsx"),
          "utf8",
        ),
      ).toContain("AGAIN");
    });
  });
});
