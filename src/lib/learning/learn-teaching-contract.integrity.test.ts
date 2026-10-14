/**
 * Learn teaching contract — instructional structure, not UI polish.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  assessInstructionalStructure,
  assessProgrammingInstruction,
  buildSixLessonSystemPrompt,
  buildSixLessonUserPrompt,
  buildSubjectAwareFallbackLesson,
  parseSixWorkedLesson,
} from "@/lib/csl/six-worked-lesson";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Learn teaching contract", () => {
  it("Classes & Objects offline lesson teaches a real sequence (not a definition card)", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson).not.toBeNull();
    const first = lesson!.chunks[0]!;
    expect(first.title).not.toMatch(/^a class is/i);
    expect(first.explanation).not.toMatch(
      /^A class is a blueprint for creating objects\.?$/i,
    );
    expect(first.explanation.toLowerCase()).toMatch(
      /dealership|imagine|hundreds of cars|why/,
    );

    const structure = assessInstructionalStructure(lesson!);
    expect(structure.hasContextOrProblem).toBe(true);
    expect(structure.hasConceptExplanation).toBe(true);
    expect(structure.hasExample).toBe(true);
    expect(structure.hasRepresentation).toBe(true);
    expect(structure.hasWorkedExample).toBe(true);
    expect(structure.hasBreakdown).toBe(true);
    expect(structure.hasLearnerInteraction).toBe(true);
    expect(structure.hasProgression).toBe(true);
    expect(structure.sufficient).toBe(true);

    const titles = lesson!.chunks.map((c) => c.title).join(" | ");
    expect(titles).toMatch(/Why|problem|class|Field|Method|new|object|Constructor/i);

    const programming = assessProgrammingInstruction(lesson!);
    expect(programming.hasCodeExample).toBe(true);
    expect(programming.hasCodeExplanation).toBe(true);
    expect(programming.hasCodeBreakdown).toBe(true);
    expect(programming.hasApplication).toBe(true);
    expect(programming.sufficient).toBe(true);
  });

  it("detailed-explanation prompts require teaching sequence depth", () => {
    const system = buildSixLessonSystemPrompt("detailed-explanation");
    expect(system).toMatch(/TEACHING SEQUENCE/);
    expect(system).toMatch(/concrete situation|context\/why/i);
    expect(system).toMatch(/NOT a summary card|not a summary/i);

    const user = buildSixLessonUserPrompt({
      component: "detailed-explanation",
      topic: "Classes & Objects",
      courseTitle: "Java",
    });
    expect(user).toMatch(/First chunk = concrete context\/problem/);
    expect(user).toMatch(/representation/);
    expect(user).toMatch(/breakdown/);
    expect(user).toMatch(/checkPrompt/);
    expect(user).toMatch(/role/);
  });

  it("parser preserves instructional fields on chunks", () => {
    const lesson = parseSixWorkedLesson(
      JSON.stringify({
        learningFrame: "Learn stacks via a real sequence.",
        roadmap: ["Why", "Concept", "Worked"],
        chunks: [
          {
            title: "Why stacks",
            role: "context",
            explanation: "Imagine undoing edits in an editor — last action first.",
            example: "Ctrl+Z pops the last action.",
            representation: "top → [A] [B] [C] ← bottom",
            checkPrompt: "What comes off first?",
          },
          {
            title: "Meet push/pop",
            role: "concept",
            explanation: "A stack stores items so the most recent is removed first (LIFO).",
            example: "push(1); push(2); pop() → 2",
            breakdown: "push adds · pop removes top",
          },
          {
            title: "Worked trace",
            role: "worked",
            explanation: "Trace three operations and watch the top change.",
            example: "push A; push B; pop → B",
            misconception: "People confuse stacks with queues (FIFO).",
          },
        ],
        cheatSheet: "LIFO · push · pop",
        practicePrompts: [
          { title: "Recognize", prompt: "Identify a stack use case.", tip: "Undo" },
          { title: "Apply", prompt: "Trace push/pop on paper.", tip: "Draw top" },
        ],
      }),
      { component: "detailed-explanation", topic: "Stacks" },
    );

    expect(lesson.chunks[0]?.role).toBe("context");
    expect(lesson.chunks[0]?.representation).toMatch(/top/);
    expect(lesson.chunks[1]?.breakdown).toMatch(/push/);
    expect(lesson.chunks[2]?.misconception).toMatch(/queue/i);
    expect(assessInstructionalStructure(lesson).sufficient).toBe(true);
  });

  it("Learn UI renders teaching sequence fields and compact room nav", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const stage = read(
      "src/components/study/learning-workspace/LearningObjectStage.tsx",
    );
    const dock = read(
      "src/components/study/learning-workspace/LearningDock.tsx",
    );
    // Stage owns teaching-sequence fields; TeachFirst owns workspace chrome.
    expect(stage).toContain("data-learn-teaching-sequence");
    expect(stage).toContain("data-learn-continue-step");
    expect(teach).toContain("data-learn-workspace");
    expect(teach).toContain("data-learn-canvas");
    expect(dock).toContain("data-learn-bottom-nav");
    expect(teach).not.toContain("How Study Haul helps you learn");
    expect(teach).not.toContain("StudyLoopStrip");
    expect(teach).not.toContain("What would you like to learn?");
    expect(dock).toMatch(/Practice/);
    expect(dock).toMatch(/>\s*Check\s*</);
    expect(dock).toMatch(/Remember/);
    expect(dock).toMatch(/Tutor/);
    expect(teach).toContain("TeachingStyleSelector");
  });

  it("My Courses / My Learning require topic WHAT before HOW", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).toContain("data-hub-what-topic-pick");
    expect(center).toContain("selectCourseForWhat");
    expect(center).toContain("selectTopicForHow");
    expect(center).toContain("readyForHow");
    expect(center).toMatch(/urlTopic \|\| urlMaterialId/);
  });
});
