/**
 * Engine → learner experience: rooms launch capabilities; no technique catalogs.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  listContextualPracticeChoices,
  resolveContextualPractice,
} from "@/lib/study/practice-landscape";
import { resolveStudyRoomHref } from "@/lib/study/resolve-study-room";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Engine → learner experience", () => {
  it("Practice for OOD/Classes & Objects stays scoped — coding or hands-on, not SQL/Math catalog", () => {
    const hay = "Classes & Objects Object-Oriented Design";
    const chosen = resolveContextualPractice(hay);
    expect(chosen.activityKey === "coding" || chosen.id === "six-hands-on").toBe(
      true,
    );
    const choices = listContextualPracticeChoices(hay);
    expect(choices.every((c) => c.activityKey !== "sql")).toBe(true);
    expect(choices.every((c) => c.activityKey !== "math")).toBe(true);
    expect(choices.every((c) => c.activityKey !== "networking")).toBe(true);
    expect(choices.length).toBeLessThanOrEqual(2);
  });

  it("resolveStudyRoomHref keeps course/topic across rooms", () => {
    const ctx = {
      courseId: "c-ood",
      topic: "Classes & Objects",
      materialId: "m1",
      courseTitle: "Object-Oriented Design",
    };
    expect(resolveStudyRoomHref("learn", ctx)).toContain("/study/teach-me");
    expect(resolveStudyRoomHref("learn", ctx)).toContain("topic=Classes");
    expect(resolveStudyRoomHref("learn", ctx)).toContain("courseId=c-ood");

    const practice = resolveStudyRoomHref("practice", ctx);
    expect(practice).toMatch(/\/study\/(activities\/coding|six\/hands-on)/);
    expect(practice).toContain("topic=Classes");

    expect(resolveStudyRoomHref("check", ctx)).toContain("/flashcards");
    expect(resolveStudyRoomHref("check", ctx)).toContain("courseId=c-ood");

    expect(resolveStudyRoomHref("remember", ctx)).toContain("/study/lucky");
    expect(resolveStudyRoomHref("remember", ctx)).toContain("topic=Classes");

    expect(resolveStudyRoomHref("tutor", ctx)).toContain("focus=tutor");
    expect(resolveStudyRoomHref("tutor", ctx)).toContain("topic=Classes");
  });

  it("TopicStudyHaul does not present capability catalog or SIX technique menu", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    const rooms = read("src/lib/study/resolve-study-room.ts");
    expect(topic).toContain("listContextualPracticeChoices");
    expect(topic).toContain("resolveStudyRoomHref");
    expect(topic).toContain("practiceMore: []");
    expect(topic).not.toContain("Break It Down");
    expect(topic).not.toContain("Visualize It");
    expect(topic).not.toContain("Explain It Yourself");
    expect(topic).not.toContain("Active Recall");
    expect(topic).not.toContain("Open Workspace");
    expect(topic).toContain("Teach Me");
    expect(topic).toContain("Ask a Question");
    expect(rooms).toContain("/study/lucky");
  });

  it("Learn sticky nav Check/Remember use retention and retrieval, not blurting-only", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const dock = read(
      "src/components/study/learning-workspace/LearningDock.tsx",
    );
    expect(teach).toContain('resolveStudyRoomHref("check"');
    expect(teach).toContain('resolveStudyRoomHref("remember"');
    expect(teach).toContain('resolveStudyRoomHref("practice"');
    expect(teach).toContain("checkHref={checkHref}");
    expect(dock).toContain("href={checkHref}");
    expect(teach).not.toContain("blurtingHref");
  });

  it("How I Learn uses visual preference tiles, not a text-only chip row", () => {
    const prefs = read("src/components/study/LearnPreferencesControls.tsx");
    const visual = read("src/components/study/HowILearnPrefVisual.tsx");
    const labels = read("src/lib/learning/learner-preferences.ts");
    expect(prefs).toContain("data-how-i-learn-visual-grid");
    expect(prefs).toContain("HowILearnPrefVisual");
    expect(labels).toContain("Learn through examples");
    expect(visual).toContain("HowILearnPrefVisual");
    expect(visual).toContain("<svg");
    expect(prefs).not.toMatch(/Chunking|Feynman|Active Recall|LUCKY Engine/);
  });
});
