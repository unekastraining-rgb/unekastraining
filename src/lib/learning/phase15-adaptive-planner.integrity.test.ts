/**
 * Bundle B Phase 15 — Adaptive Planner integrity.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  attachLearningTargets,
  fromLocalAssignment,
} from "@/lib/learning/academic";
import {
  buildLearningNeed,
  findAvailableStudyWindows,
  learningNeedsFromAcademicItems,
  recalculateAdaptivePlan,
  scheduleLearningActivities,
  sortLearningNeeds,
} from "@/lib/learning/adaptive-planner";
import type { ConceptLearningNeed } from "@/lib/learning/learner-model/knowledge-loop";
import {
  recordLearningEvidence,
  resetLearnerStateForTests,
} from "@/lib/learning/learner-state";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop";
import { recommendSixTechnique } from "@/lib/learning/orchestrator/knowledge-loop";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import "@/lib/learning/knowledge/packs";

function conceptNeed(
  partial: Partial<ConceptLearningNeed> &
    Pick<ConceptLearningNeed, "conceptId" | "action">,
): ConceptLearningNeed {
  return {
    urgency: "medium",
    reason: "test",
    evidence: [],
    recommendedSix: {
      technique: "chunking",
      reasonCode: "new-concept-chunking",
      reason: "new",
    },
    ...partial,
  };
}

describe("Phase 15 — Adaptive Planner", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("learning need generation combines academic urgency + learner evidence", () => {
    const dueSoon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const item = fromLocalAssignment("u1", {
      id: "a1",
      courseId: "c1",
      title: "Java Exceptions Quiz",
      dueDate: dueSoon,
    });
    const need = buildLearningNeed({
      conceptNeed: conceptNeed({
        conceptId: "java-exceptions",
        action: "practice",
        urgency: "medium",
        evidence: ["no_recall"],
      }),
      academicItem: item,
    });
    expect(need.urgency).toBe("high");
    expect(need.academicItemId).toBe(item.id);
    expect(need.evidence.some((e) => e.startsWith("due:"))).toBe(true);
  });

  it("schedules learning activities rather than generic subjects", () => {
    const now = new Date("2026-10-01T08:00:00Z");
    const windows = findAvailableStudyWindows({
      rangeStart: now,
      rangeEnd: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      busy: [],
    });
    const plan = scheduleLearningActivities({
      userId: "u1",
      needs: [
        conceptNeed({
          conceptId: "java-exceptions",
          action: "teach",
          urgency: "high",
          recommendedSix: {
            technique: "detailed-explanation",
            reasonCode: "x",
            reason: "y",
          },
        }),
        conceptNeed({
          conceptId: "java-arraylist",
          action: "practice",
          urgency: "medium",
          recommendedSix: {
            technique: "hands-on-practice",
            reasonCode: "x",
            reason: "y",
          },
        }),
      ].map((n) =>
        buildLearningNeed({ conceptNeed: n }),
      ),
      windows,
      now,
    });
    expect(plan.activities.length).toBeGreaterThanOrEqual(1);
    expect(plan.activities[0].action).toBe("teach");
    expect(plan.activities[0].sixTechnique).toBe("detailed-explanation");
    expect(plan.activities[0].conceptId).toBe("java-exceptions");
    expect(plan.activities[0].room).toBe("learn");
  });

  it("prerequisite / urgency ordering", () => {
    const sorted = sortLearningNeeds([
      buildLearningNeed({
        conceptNeed: conceptNeed({
          conceptId: "java-polymorphism",
          action: "teach",
          urgency: "low",
        }),
      }),
      buildLearningNeed({
        conceptNeed: conceptNeed({
          conceptId: "java-exceptions",
          action: "reteach",
          urgency: "high",
        }),
      }),
    ]);
    expect(sorted[0].conceptId).toBe("java-exceptions");
  });

  it("available study time respects busy calendar blocks", () => {
    const start = new Date("2026-10-01T00:00:00");
    const end = new Date("2026-10-01T23:59:00");
    const busy = [
      {
        startAt: new Date("2026-10-01T09:00:00"),
        endAt: new Date("2026-10-01T17:00:00"),
      },
    ];
    const windows = findAvailableStudyWindows({
      rangeStart: start,
      rangeEnd: end,
      busy,
      dayStartHour: 9,
      dayEndHour: 21,
    });
    for (const w of windows) {
      const overlapsBusy =
        w.startAt < busy[0].endAt && w.endAt > busy[0].startAt;
      expect(overlapsBusy).toBe(false);
    }
    expect(windows.length).toBeGreaterThan(0);
  });

  it("Orchestrator remains authority for WHAT", () => {
    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const decision = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: ctx,
      statesByConceptId: new Map(),
      evidence: [],
    });
    expect(decision.action).toBe("teach");
    const scheduleSrc = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/adaptive-planner/schedule.ts",
      ),
      "utf8",
    );
    expect(scheduleSrc).not.toContain("decideKnowledgeLoop");
  });

  it("Six remains authority for HOW", () => {
    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const decision = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: ctx,
      statesByConceptId: new Map(),
      evidence: [],
    });
    const six = recommendSixTechnique({ decision });
    expect(six.technique).toBe("chunking");
    const scheduleSrc = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/adaptive-planner/schedule.ts",
      ),
      "utf8",
    );
    expect(scheduleSrc).not.toContain("recommendSixTechnique");
  });

  it("planner remains authority for WHEN", () => {
    const planSrc = readFileSync(
      path.join(process.cwd(), "src/lib/learning/adaptive-planner/plan.ts"),
      "utf8",
    );
    expect(planSrc).toContain("findAvailableStudyWindows");
    expect(planSrc).toContain("scheduleLearningActivities");
  });

  it("evidence updates learner model then planner recalculates", async () => {
    const item = attachLearningTargets(
      fromLocalAssignment("u1", {
        id: "a1",
        courseId: "c1",
        title: "ArrayList in Java",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      }),
    );
    expect(item.learningTargets?.length).toBeGreaterThan(0);

    const needsBefore = learningNeedsFromAcademicItems({
      items: [item],
      conceptNeeds: new Map([
        [
          "java-arraylist",
          conceptNeed({ conceptId: "java-arraylist", action: "teach" }),
        ],
      ]),
    });
    const windows = findAvailableStudyWindows({
      rangeStart: new Date(),
      rangeEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      busy: [],
    });
    const plan1 = scheduleLearningActivities({
      userId: "u1",
      needs: needsBefore,
      windows,
    });
    expect(plan1.activities[0]?.action).toBe("teach");

    await recordLearningEvidence({
      userId: "u1",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    await recordLearningEvidence({
      userId: "u1",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
    });

    const needsAfter = learningNeedsFromAcademicItems({
      items: [item],
      conceptNeeds: new Map([
        [
          "java-arraylist",
          conceptNeed({
            conceptId: "java-arraylist",
            action: "recall",
            urgency: "medium",
            recommendedSix: {
              technique: "active-recall",
              reasonCode: "needs-recall",
              reason: "recall",
            },
          }),
        ],
      ]),
    });
    const plan2 = recalculateAdaptivePlan({
      userId: "u1",
      needs: needsAfter,
      windows,
    });
    expect(plan2.activities[0]?.action).toBe("recall");
    expect(plan2.activities[0]?.sixTechnique).toBe("active-recall");
    expect(plan2.activities[0]?.room).toBe("remember");
  });

  it("no duplicate planner/calendar system", () => {
    const planSrc = readFileSync(
      path.join(process.cwd(), "src/lib/learning/adaptive-planner/plan.ts"),
      "utf8",
    );
    expect(planSrc).not.toContain("db.calendarEvent.create");
    expect(planSrc).toContain("Does not write calendar");
  });
});
