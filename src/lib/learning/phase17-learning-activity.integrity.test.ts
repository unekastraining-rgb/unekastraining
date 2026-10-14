/**
 * Bundle C Phase 17 — Learning Activity framework integrity.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildActivityEvaluation,
  evidenceTypeForActivity,
  learningActivitiesFromCore,
  learningActivityFromNeed,
  learningActivityFromPlanned,
  listSupportedActivityTypes,
  recordActivityEvaluationEvidence,
  resolveLearningActivity,
  activityTypeForOrchestratorAction,
  LEARNING_ACTIVITY_REGISTRY,
} from "@/lib/learning/activity/framework";
import { buildCoreLearningContent } from "@/lib/learning/core";
import { getLearnerModel } from "@/lib/learning/learner-model/knowledge-loop";
import {
  resetLearnerStateForTests,
} from "@/lib/learning/learner-state";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop";
import { recommendSixTechnique } from "@/lib/learning/orchestrator/knowledge-loop";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import type { LearningNeed } from "@/lib/learning/adaptive-planner/types";
import type { PlannedLearningActivity } from "@/lib/learning/adaptive-planner/types";
import "@/lib/learning/knowledge/packs";

describe("Phase 17 — Learning Activity Framework", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("common Learning Activity contract / registry covers required types", () => {
    const types = listSupportedActivityTypes();
    for (const required of [
      "lesson",
      "practice",
      "recall",
      "coding",
      "lab",
      "project",
      "simulation",
      "writing",
      "presentation",
      "visual",
      "problem-solving",
    ] as const) {
      expect(types).toContain(required);
    }
    expect(LEARNING_ACTIVITY_REGISTRY.length).toBeGreaterThanOrEqual(11);
  });

  it("lesson / practice / recall activities resolve", () => {
    const lesson = resolveLearningActivity({
      type: "lesson",
      conceptIds: ["java-arraylist"],
      orchestratorAction: "teach",
    })!;
    expect(lesson.implementationKey).toBe("six-lesson");
    expect(lesson.orchestratorAction).toBe("teach");

    const practice = resolveLearningActivity({
      type: "practice",
      conceptIds: ["java-arraylist"],
      orchestratorAction: "practice",
    })!;
    expect(practice.implementationKey).toBe("study-practice");

    const recall = resolveLearningActivity({
      type: "recall",
      conceptIds: ["java-arraylist"],
      orchestratorAction: "recall",
    })!;
    expect(recall.implementationKey).toBe("lucky-remember");
  });

  it("coding / lab / project / writing / presentation / visual / problem-solving", () => {
    expect(
      resolveLearningActivity({
        type: "coding",
        conceptIds: ["java-arraylist"],
      })?.implementationKey,
    ).toBe("activities/coding");
    expect(
      LEARNING_ACTIVITY_REGISTRY.find((e) => e.type === "lab")?.foundationType,
    ).toBe("LAB");
    expect(
      resolveLearningActivity({ type: "lab", conceptIds: ["java-arraylist"] })
        ?.implementationKey,
    ).toBeTruthy();
    expect(
      resolveLearningActivity({
        type: "project",
        conceptIds: ["java-arraylist"],
      })?.implementationKey,
    ).toContain("project");
    expect(
      resolveLearningActivity({
        type: "writing",
        conceptIds: ["java-arraylist"],
      })?.implementationKey,
    ).toBe("activities/writing");
    expect(
      resolveLearningActivity({
        type: "presentation",
        conceptIds: ["java-arraylist"],
      })?.implementationKey,
    ).toContain("presentation");
    expect(
      resolveLearningActivity({
        type: "visual",
        conceptIds: ["java-arraylist"],
      })?.implementationKey,
    ).toBe("six-visualization");
    expect(
      resolveLearningActivity({
        type: "problem-solving",
        conceptIds: ["java-arraylist"],
      })?.type,
    ).toBe("problem-solving");
    expect(
      resolveLearningActivity({
        type: "simulation",
        conceptIds: ["java-arraylist"],
      })?.type,
    ).toBe("simulation");
  });

  it("evaluation → existing evidence types", () => {
    expect(evidenceTypeForActivity("coding")).toBe("application_attempt");
    expect(evidenceTypeForActivity("writing")).toBe("explanation_attempt");
    expect(evidenceTypeForActivity("visual")).toBe("visualization_attempt");
    expect(evidenceTypeForActivity("recall")).toBe("recall_result");
    expect(evidenceTypeForActivity("lesson")).toBe("lesson_exposure");

    const evaluation = buildActivityEvaluation({
      activityId: "act-1",
      userId: "u1",
      activityType: "coding",
      conceptIds: ["java-arraylist"],
      outcome: "SUCCESS",
    });
    expect(evaluation.outcome).toBe("correct");
    expect(evaluation.evidenceType).toBe("application_attempt");
  });

  it("evidence → Learner Model", async () => {
    const evaluation = buildActivityEvaluation({
      activityId: "act-code-1",
      userId: "u1",
      activityType: "coding",
      conceptIds: ["java-arraylist"],
      outcome: "correct",
    });
    const recorded = await recordActivityEvaluationEvidence(evaluation);
    expect(recorded.some((r) => r.recorded)).toBe(true);

    const model = await getLearnerModel("u1");
    expect(
      model.knowledge.concepts.some((c) => c.conceptId === "java-arraylist"),
    ).toBe(true);
    expect(model.capabilityEvidence.application.length).toBeGreaterThan(0);
  });

  it("Orchestrator remains WHAT", () => {
    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const decision = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: ctx,
      statesByConceptId: new Map(),
      evidence: [],
    });
    expect(decision.action).toBe("teach");
    expect(activityTypeForOrchestratorAction(decision.action)).toBe("lesson");
    const resolveSrc = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/activity/framework/resolve.ts",
      ),
      "utf8",
    );
    expect(resolveSrc).not.toContain("decideKnowledgeLoop");
  });

  it("Six remains HOW", () => {
    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const decision = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: ctx,
      statesByConceptId: new Map(),
      evidence: [],
    });
    const six = recommendSixTechnique({ decision });
    expect(six.technique).toBe("chunking");
    expect(
      activityTypeForOrchestratorAction("practice", "visualization"),
    ).toBe("visual");
  });

  it("Planner remains WHEN — planned activity maps to DO", () => {
    const planned: PlannedLearningActivity = {
      id: "p1",
      conceptId: "java-exceptions",
      title: "Exceptions",
      action: "practice",
      sixTechnique: "hands-on-practice",
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(),
      minutes: 25,
      urgency: "high",
      reason: "due soon",
      academicItemId: "local:a1",
    };
    const activity = learningActivityFromPlanned(planned)!;
    expect(activity.orchestratorAction).toBe("practice");
    expect(activity.sixTechnique).toBe("hands-on-practice");
    expect(activity.source?.academicItemId).toBe("local:a1");

    const need: LearningNeed = {
      conceptId: "java-exceptions",
      action: "recall",
      urgency: "medium",
      reason: "needs recall",
      evidence: ["missing_recall"],
      recommendedSix: {
        technique: "active-recall",
        reasonCode: "needs-recall",
        reason: "recall",
      },
    };
    expect(learningActivityFromNeed(need)?.type).toBe("recall");
  });

  it("Core → activities", () => {
    const core = buildCoreLearningContent({
      sourceId: "note-1",
      userId: "u1",
      title: "ArrayList in Java",
      content: "ArrayList dynamically resizes.",
    });
    const activities = learningActivitiesFromCore(core);
    expect(activities.length).toBe(3);
    expect(activities.map((a) => a.type).sort()).toEqual([
      "lesson",
      "practice",
      "recall",
    ]);
    expect(activities.every((a) => a.source?.coreSourceId === "note-1")).toBe(
      true,
    );
  });

  it("does not replace existing activity implementations", () => {
    const coding = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/activities/coding/service.ts",
      ),
      "utf8",
    );
    expect(coding).toContain("submitCodingChallenge");
    expect(coding).toContain("recordAuthoritativeActivityEvidence");
  });
});
