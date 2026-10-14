/**
 * Final Hardening — End-to-end student journey integrity.
 * Exercises Bundles A–C without network AI (mocks only).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { emptyDocument } from "@/lib/core/note-types";
import {
  prepareNoteDocumentForSave,
  ensureNotebookPages,
} from "@/lib/core/notebook-pages";
import { parseNoteDocument } from "@/lib/core/note-types";
import {
  resolveCanvasCssSize,
  shouldApplySaveResult,
} from "@/lib/core/canvas-buffer-size";
import {
  attachLearningTargets,
  fromLocalAssignment,
  filterAcademicItemsForUser,
  academicSyncFailure,
  mergeAcademicItemsAfterSyncFailure,
} from "@/lib/learning/academic";
import {
  findAvailableStudyWindows,
  scheduleLearningActivities,
  learningNeedsFromAcademicItems,
  recalculateAdaptivePlan,
} from "@/lib/learning/adaptive-planner";
import {
  buildActivityEvaluation,
  learningActivitiesFromCore,
  learningActivityFromPlanned,
  recordActivityEvaluationEvidence,
  evidenceTypeForActivity,
} from "@/lib/learning/activity/framework";
import {
  buildCoreLearningContent,
  filterCoreContentForUser,
} from "@/lib/learning/core";
import {
  createMockGeneralKnowledgeProvider,
  understandLearningTarget,
  retrieveTeachingKnowledge,
  toTeachingKnowledgeContext,
  learningPathFromTeachingContext,
  resetGeneralTeachingRegistryForTests,
  resetDynamicPathsForTests,
} from "@/lib/learning/knowledge/retrieval";
import {
  resolveTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  getLearnerModel,
  getConceptLearningNeed,
  deriveMisconceptionEvidence,
} from "@/lib/learning/learner-model/knowledge-loop";
import {
  recordLearningEvidence,
  resetLearnerStateForTests,
  getLearnerConceptState,
  listEvidence,
} from "@/lib/learning/learner-state";
import {
  decideKnowledgeLoop,
  recommendSixTechnique,
  summarizeConceptEvidence,
} from "@/lib/learning/orchestrator/knowledge-loop";
import type { ConceptLearningNeed } from "@/lib/learning/learner-model/knowledge-loop";
import "@/lib/learning/knowledge/packs";

/** Truly unknown topic — psychology is now in the Knowledge Library. */
function mockQuantumGardening() {
  return {
    targetTitle: "Quantum gardening",
    subject: "quantum-gardening",
    domain: "general" as const,
    summary:
      "Quantum gardening is a fictional study topic used only to exercise Universal Retrieval when no canonical Knowledge Library pack exists.",
    concepts: [
      {
        id: "foundations",
        title: "Foundations",
        explanation:
          "Introduces the fictional framing so retrieval can assemble a non-canonical teaching path without promoting content to the Knowledge Library.",
      },
      {
        id: "practice",
        title: "Practice ideas",
        explanation:
          "Offers a second staged concept so sequence and orchestration still have something to teach after the first chunk.",
      },
    ],
    suggestedSequence: ["foundations", "practice"],
  };
}

describe("Hardening — End-to-end journeys", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
    resetGeneralTeachingRegistryForTests();
    resetDynamicPathsForTests();
  });

  it("Journey A — known concept teach → incorrect → reteach → correct → recall → next", async () => {
    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    expect(ctx.source).toBe("knowledge-library");
    expect(ctx.primaryConcept?.id).toBe("java-arraylist");

    let decision = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: ctx,
      statesByConceptId: new Map(),
      evidence: [],
    });
    expect(decision.action).toBe("teach");
    const six = recommendSixTechnique({ decision });
    expect(six.technique).toBe("chunking");

    await recordLearningEvidence({
      userId: "u1",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
      source: "six-lesson",
    });
    await recordLearningEvidence({
      userId: "u1",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "incorrect",
      source: "practice",
    });

    const stateAfterMiss = await getLearnerConceptState("u1", "java-arraylist");
    const evidence = await listEvidence("u1");
    decision = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: ctx,
      statesByConceptId: new Map([["java-arraylist", stateAfterMiss]]),
      evidence,
    });
    expect(decision.action).toBe("reteach");
    expect(recommendSixTechnique({ decision, summary: summarizeConceptEvidence("java-arraylist", stateAfterMiss, evidence) }).technique).toMatch(
      /detailed-explanation|feynman/,
    );

    await recordLearningEvidence({
      userId: "u1",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
      source: "practice",
    });
    const stateOk = await getLearnerConceptState("u1", "java-arraylist");
    const evidence2 = await listEvidence("u1");
    decision = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: ctx,
      statesByConceptId: new Map([["java-arraylist", stateOk]]),
      evidence: evidence2,
    });
    expect(decision.action).toBe("recall");

    await recordLearningEvidence({
      userId: "u1",
      type: "recall_result",
      conceptId: "java-arraylist",
      outcome: "correct",
      source: "lucky",
    });
    const stateDone = await getLearnerConceptState("u1", "java-arraylist");
    const evidence3 = await listEvidence("u1");
    decision = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: ctx,
      statesByConceptId: new Map([["java-arraylist", stateDone]]),
      evidence: evidence3,
    });
    expect(["advance", "complete", "practice"]).toContain(decision.action);

    const model = await getLearnerModel("u1");
    expect(model.capabilityEvidence.application.length).toBeGreaterThan(0);
    expect(model.capabilityEvidence.recall.length).toBeGreaterThan(0);
  });

  it("Journey B — unknown topic via Universal Retrieval (mocked AI)", async () => {
    const target = understandLearningTarget(
      "Teach me obscure quantum gardening theory xyz.",
    )!;
    expect(target.resolution).toBe("resolved");

    const result = await retrieveTeachingKnowledge({
      target: "Teach me obscure quantum gardening theory xyz",
      generalProvider: createMockGeneralKnowledgeProvider(() =>
        mockQuantumGardening(),
      ),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toBe("general-ai");
    const ctx = toTeachingKnowledgeContext(result.knowledge);
    const path = learningPathFromTeachingContext(ctx)!;
    expect(path.canonical).toBe(false);
    expect(path.concepts.every((c) => c.conceptId.startsWith("general:"))).toBe(
      true,
    );

    const decision = decideKnowledgeLoop({
      target: "obscure quantum gardening theory xyz",
      knowledge: ctx,
      statesByConceptId: new Map(),
      evidence: [],
    });
    expect(decision.action).toBe("teach");
  });

  it("Journey B — AI unavailable fails honestly (no fabricated KL)", async () => {
    const result = await retrieveTeachingKnowledge({
      target: "Teach me obscure quantum gardening theory xyz",
      disableGeneralAi: true,
    });
    expect(result.ok).toBe(false);
    expect(resolveTeachingKnowledgeContext("obscure quantum gardening theory xyz")).toBeNull();
  });

  it("Journey C — personal notes ground without promoting to KL", async () => {
    const note = `
My Java exceptions notes Chapter 13: try catch finally throw throws.
Checked vs unchecked. Always close resources. Exception vs RuntimeException.
`.repeat(3);
    const result = await retrieveTeachingKnowledge({
      target: "Java exceptions",
      noteText: note,
      noteTitle: "Ch13 notes",
      noteId: "note-u1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.knowledge.sources?.some((s) => s.kind === "knowledge-library"),
    ).toBe(true);
    expect(result.knowledge.sources?.some((s) => s.kind === "user-note")).toBe(
      true,
    );
    expect(result.knowledge.concepts.some((c) => c.id === "java-exceptions")).toBe(
      true,
    );
  });

  it("Journey D — school assignment → need → planner → activity", async () => {
    const item = attachLearningTargets(
      fromLocalAssignment("u1", {
        id: "asg1",
        courseId: "c1",
        title: "ArrayList in Java",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      }),
    );
    expect(item.learningTargets?.some((t) => t.conceptId === "java-arraylist")).toBe(
      true,
    );

    const need = await getConceptLearningNeed("u1", "java-arraylist");
    expect(need).not.toBeNull();
    expect(need!.action).toBe("teach");

    const conceptNeeds = new Map<string, ConceptLearningNeed>([
      ["java-arraylist", need!],
    ]);
    const needs = learningNeedsFromAcademicItems({
      items: [item],
      conceptNeeds,
    });
    const windows = findAvailableStudyWindows({
      rangeStart: new Date(),
      rangeEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      busy: [],
    });
    const plan = scheduleLearningActivities({
      userId: "u1",
      needs,
      windows,
    });
    expect(plan.activities.length).toBeGreaterThan(0);
    const activity = learningActivityFromPlanned(plan.activities[0])!;
    expect(activity.orchestratorAction).toBe(plan.activities[0].action);
    expect(activity.conceptIds).toContain("java-arraylist");

    // Planner route contract: planned ≠ calendar written.
    const plannerRoute = readFileSync(
      path.join(process.cwd(), "app/api/planner/route.ts"),
      "utf8",
    );
    expect(plannerRoute).toContain("calendarWritten: false");
  });

  it("Journey E — Core note → association → learning actions", () => {
    const doc = emptyDocument("type");
    doc.outlineNodes = [];
    doc.typed =
      "An ArrayList dynamically changes size. Prefer add() over fixed arrays.";
    const json = JSON.stringify(doc);
    const content = buildCoreLearningContent({
      sourceId: "note-core-1",
      userId: "u1",
      title: "ArrayList in Java",
      contentJson: json,
    });
    // Content unchanged
    expect(JSON.parse(json).typed).toBe(doc.typed);
    expect(content.concepts?.some((c) => c.conceptId === "java-arraylist")).toBe(
      true,
    );
    const activities = learningActivitiesFromCore(content);
    expect(activities.map((a) => a.type).sort()).toEqual([
      "lesson",
      "practice",
      "recall",
    ]);
  });

  it("Journey F — application activity → evidence → learner model", async () => {
    expect(evidenceTypeForActivity("coding")).toBe("application_attempt");
    const evaluation = buildActivityEvaluation({
      activityId: "code-1",
      userId: "u1",
      activityType: "coding",
      conceptIds: ["java-arraylist"],
      outcome: "SUCCESS",
    });
    const recorded = await recordActivityEvaluationEvidence(evaluation);
    expect(recorded.some((r) => r.recorded)).toBe(true);
    const model = await getLearnerModel("u1");
    expect(model.capabilityEvidence.application.length).toBeGreaterThan(0);
    const need = await getConceptLearningNeed("u1", "java-arraylist");
    expect(need).not.toBeNull();
  });

  it("Journey G — returning learner recovers evidence across decisions", async () => {
    await recordLearningEvidence({
      userId: "u1",
      type: "lesson_exposure",
      conceptId: "java-exceptions",
      outcome: "completed",
    });
    await recordLearningEvidence({
      userId: "u1",
      type: "practice_attempt",
      conceptId: "java-exceptions",
      outcome: "correct",
    });

    // "Leave" then return — same persistence store, re-read.
    const state = await getLearnerConceptState("u1", "java-exceptions");
    expect(state?.exposureCount).toBe(1);
    expect(state?.correctCount).toBe(1);

    const model = await getLearnerModel("u1");
    expect(model.learningHistory.recentConcepts).toContain("java-exceptions");

    const ctx = resolveTeachingKnowledgeContext("Java exceptions")!;
    const decision = decideKnowledgeLoop({
      target: "Java exceptions",
      knowledge: ctx,
      statesByConceptId: new Map([["java-exceptions", state]]),
      evidence: await listEvidence("u1"),
    });
    expect(decision.action).toBe("recall");
  });

  it("Ambiguous topic is represented, not silently invented", () => {
    const t = understandLearningTarget("Teach me 1900s biblical times.")!;
    expect(t.resolution).toBe("needs-clarification");
  });

  it("Six failure falls back; does not block", () => {
    const decision = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: resolveTeachingKnowledgeContext("ArrayList in Java"),
      statesByConceptId: new Map(),
      evidence: [],
    });
    const bad = {
      ...decision,
      trace: null as unknown as typeof decision.trace,
    };
    const rec = recommendSixTechnique({ decision: bad });
    expect(rec.technique).toBeTruthy();
  });

  it("Core note save/reopen roundtrip preserves ink + typed", () => {
    const stroke = {
      id: "s1",
      tool: "pen" as const,
      color: "#111",
      width: 2,
      points: [
        { x: 1, y: 1, pressure: 0.5 },
        { x: 4, y: 4, pressure: 0.5 },
      ],
    };
    let doc = emptyDocument("sketch");
    doc.typed = "keep me";
    doc.strokes = [stroke];
    doc = ensureNotebookPages(doc);
    const saved = prepareNoteDocumentForSave(doc);
    const raw = JSON.stringify(saved);
    const reopened = ensureNotebookPages(parseNoteDocument(raw));
    expect(reopened.typed).toContain("keep me");
    expect(reopened.strokes?.some((s) => s.id === "s1")).toBe(true);
  });

  it("0×0 canvas measure stays provisional and redraw-capable", () => {
    const size = resolveCanvasCssSize({
      measureClientWidth: 0,
      measureClientHeight: 0,
    });
    expect(size.provisional).toBe(true);
    expect(size.cssW).toBeGreaterThanOrEqual(1);
    expect(shouldApplySaveResult(1, 2)).toBe(false);
  });

  it("LMS failure preserves local academic items", () => {
    const local = [
      fromLocalAssignment("u1", {
        id: "a1",
        courseId: "c1",
        title: "Quiz",
      }),
    ];
    const merged = mergeAcademicItemsAfterSyncFailure({
      localItems: local,
      failure: academicSyncFailure("canvas", "timeout"),
    });
    expect(merged.items).toHaveLength(1);
    expect(merged.failure.localDataPreserved).toBe(true);
  });

  it("misconception requires repeated incorrect — not one miss", () => {
    const once = deriveMisconceptionEvidence("u1", [
      {
        id: "1",
        userId: "u1",
        type: "practice_attempt",
        conceptId: "java-arraylist",
        outcome: "incorrect",
        occurredAt: new Date(),
      },
    ]);
    expect(once).toHaveLength(0);
  });

  it("planner recalculates after new evidence mapping", () => {
    const plan1 = scheduleLearningActivities({
      userId: "u1",
      needs: [
        {
          conceptId: "java-arraylist",
          action: "teach",
          urgency: "high",
          reason: "new",
          evidence: [],
          recommendedSix: {
            technique: "chunking",
            reasonCode: "x",
            reason: "y",
          },
        },
      ],
      windows: findAvailableStudyWindows({
        rangeStart: new Date(),
        rangeEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        busy: [],
      }),
    });
    const plan2 = recalculateAdaptivePlan({
      userId: "u1",
      needs: [
        {
          conceptId: "java-arraylist",
          action: "recall",
          urgency: "medium",
          reason: "recall",
          evidence: ["missing_recall"],
          recommendedSix: {
            technique: "active-recall",
            reasonCode: "needs-recall",
            reason: "r",
          },
        },
      ],
      windows: plan1.windowsUsed.length
        ? plan1.windowsUsed
        : findAvailableStudyWindows({
            rangeStart: new Date(),
            rangeEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            busy: [],
          }),
    });
    expect(plan2.activities[0]?.action).toBe("recall");
  });
});

describe("Hardening — Data-safety / ownership isolation", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("User A evidence never appears in User B learner model", async () => {
    await recordLearningEvidence({
      userId: "user-a",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
    });
    const modelB = await getLearnerModel("user-b");
    expect(modelB.knowledge.concepts).toHaveLength(0);
    expect(modelB.capabilityEvidence.application).toHaveLength(0);
    expect(await listEvidence("user-b")).toHaveLength(0);
  });

  it("Academic items filtered by user", () => {
    const items = [
      fromLocalAssignment("user-a", {
        id: "1",
        courseId: "c1",
        title: "A",
      }),
      fromLocalAssignment("user-b", {
        id: "2",
        courseId: "c2",
        title: "B",
      }),
    ];
    expect(filterAcademicItemsForUser("user-a", items)).toHaveLength(1);
    expect(filterAcademicItemsForUser("user-a", items)[0].userId).toBe("user-a");
  });

  it("Core content filtered by user", () => {
    const content = buildCoreLearningContent({
      sourceId: "n1",
      userId: "user-a",
      content: "ArrayList notes",
      title: "ArrayList in Java",
    });
    expect(filterCoreContentForUser("user-a", content)).not.toBeNull();
    expect(filterCoreContentForUser("user-b", content)).toBeNull();
  });

  it("Activity evidence for user A does not update user B", async () => {
    await recordActivityEvaluationEvidence(
      buildActivityEvaluation({
        activityId: "act-a",
        userId: "user-a",
        activityType: "coding",
        conceptIds: ["java-exceptions"],
        outcome: "correct",
      }),
    );
    expect(await getLearnerConceptState("user-b", "java-exceptions")).toBeNull();
    expect(
      (await getLearnerConceptState("user-a", "java-exceptions"))?.correctCount,
    ).toBe(1);
  });
});

describe("Hardening — Architecture single-authority invariants", () => {
  it("Orchestrator / Six / Planner / Activity remain separate modules", () => {
    const decide = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/orchestrator/knowledge-loop/decide.ts",
      ),
      "utf8",
    );
    const six = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/orchestrator/knowledge-loop/six-intelligence.ts",
      ),
      "utf8",
    );
    const plan = readFileSync(
      path.join(process.cwd(), "src/lib/learning/adaptive-planner/plan.ts"),
      "utf8",
    );
    const activity = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/activity/framework/resolve.ts",
      ),
      "utf8",
    );
    expect(decide).not.toContain("recommendSixTechnique");
    expect(decide).not.toContain("buildAdaptiveLearningPlan");
    expect(six).toContain("recommendSixTechnique");
    expect(plan).toContain("Does not write calendar");
    expect(activity).not.toContain("decideKnowledgeLoop");
  });

  it("Core intelligence does not mutate NoteDocument storage helpers", () => {
    const build = readFileSync(
      path.join(process.cwd(), "src/lib/learning/core/build.ts"),
      "utf8",
    );
    expect(build).not.toContain("db.note");
    expect(build).toContain("contentUnchanged");
  });
});
