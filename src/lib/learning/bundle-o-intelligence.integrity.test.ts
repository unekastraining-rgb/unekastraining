/**
 * Bundle O — Intelligence & personalization integrity.
 * Recommendation-only; no mastery mutation; unknown targets stay honest.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { presentAdaptiveNextAction } from "@/lib/learning/adaptive-next-action";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop";
import { recommendSixTechnique } from "@/lib/learning/orchestrator/knowledge-loop/six-intelligence";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import "@/lib/learning/knowledge/packs";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Bundle O — Adaptive next action", () => {
  it("struggle → reteach/Six-oriented next steps (not generic continue)", () => {
    const next = presentAdaptiveNextAction({
      outcome: "incorrect",
      score: 35,
      conceptId: "java-arraylist",
      conceptTitle: "ArrayList in Java",
      courseId: "course-1",
    });
    expect(next.nextSteps.join(" ")).not.toMatch(/Great job/i);
    expect(next.nextSteps.join(" ")).not.toBe("Continue when you are ready.");
    expect(next.links.some((l) => /six|practice|lucky|quiz/i.test(l.href))).toBe(
      true,
    );
    expect(next.disclaimer).toMatch(/not mastery/i);
  });

  it("success → application/practice oriented next steps", () => {
    const next = presentAdaptiveNextAction({
      outcome: "correct",
      score: 100,
      conceptId: "java-arraylist",
      conceptTitle: "ArrayList in Java",
      courseId: "course-1",
      demonstratedRecognition: true,
    });
    expect(next.nextSteps.some((s) => /apply|practice/i.test(s))).toBe(true);
    expect(next.links.some((l) => l.href.includes("practice-hub"))).toBe(true);
  });

  it("TeachFirst consumes presentAdaptiveNextAction", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).toContain("presentAdaptiveNextAction");
    expect(teach).not.toContain('nextSteps: ["Continue when you are ready."]');
  });
});

describe("Bundle O — Orchestrator does not write mastery", () => {
  it("decideKnowledgeLoop is recommendation-only (no mastery writes in module)", () => {
    const decide = read(
      "src/lib/learning/orchestrator/knowledge-loop/decide.ts",
    );
    expect(decide).not.toContain("conceptMastery.update");
    expect(decide).not.toContain("db.conceptMastery");
    const d = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: resolveTeachingKnowledgeContext("ArrayList in Java"),
      statesByConceptId: new Map(),
      evidence: [],
    });
    expect(["teach", "practice", "reteach", "recall", "advance", "complete"]).toContain(
      d.action,
    );
  });

  it("Six technique responds to incorrect evidence", () => {
    const rec = recommendSixTechnique({
      decision: {
        action: "reteach",
        reasonCode: "recent-incorrect",
        conceptId: "java-arraylist",
        reason: "miss",
        confidence: "high",
        trace: {
          target: "ArrayList",
          focusConceptId: "java-arraylist",
          exposureCount: 1,
          attemptCount: 2,
          correctCount: 0,
          incorrectCount: 2,
          lastOutcome: "incorrect",
          hasPracticeEvidence: false,
          hasCheckEvidence: false,
          hasRecallEvidence: false,
        },
      },
      summary: {
        conceptId: "java-arraylist",
        exposureCount: 1,
        attemptCount: 2,
        correctCount: 0,
        incorrectCount: 2,
        lastOutcome: "incorrect",
        hasPracticeEvidence: false,
        hasCheckEvidence: false,
        hasRecallEvidence: false,
      },
      topic: "ArrayList",
    });
    expect(["feynman", "detailed-explanation"]).toContain(rec.technique);
  });
});

describe("Bundle O — Tutor / Haul / unknown honesty", () => {
  it("Tutor context includes activity and artifact focus", () => {
    const ctx = read("src/lib/learning/tutor/context.ts");
    expect(ctx).toContain("Active activity focus");
    expect(ctx).toContain("Learner artifact");
    expect(ctx).toContain("Instructional context");
  });

  it("Haul remains linked to Learning via teachMeHref (writing knowledge path)", () => {
    const haul = read("src/components/haul/HaulWritingWorkspace.tsx");
    expect(haul).toContain("teachMeHref");
    expect(haul).toContain("getCanonicalConceptsForWritingType");
  });

  it("unknown concept stays honest (no fabricated KL context)", () => {
    expect(
      resolveTeachingKnowledgeContext("obscure quantum gardening theory xyz"),
    ).toBeNull();
  });
});
