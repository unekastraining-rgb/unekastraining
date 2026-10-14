/**
 * Bundle F — Learning Workspace UX integrity tests.
 * Presentation refactor only — no new intelligence engines.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  actionDeckPromptFromChunk,
  buildLearningWorkspaceContext,
  chunkRequiresFormativeAction,
  instructionalBlocksFromChunk,
  resolveWorkspaceStage,
  sixApproachTitle,
} from "@/lib/learning/workspace";
import { buildLearningExperienceContext } from "@/lib/learning/unified-experience";
import type { SixLessonChunk } from "@/lib/csl/six-worked-lesson";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

const sampleChunk: SixLessonChunk = {
  title: "Market Research",
  role: "concept",
  explanation:
    "Market research gathers evidence about customer needs so offerings can create value. It is broader than guessing from anecdotes.",
  example: "A bakery surveys lunch customers about preferred price points.",
  representation: "Need → Research → Insight → Offer",
  breakdown: "1) Ask\n2) Observe\n3) Interpret",
  misconception: "Research is not the same as advertising.",
  memoryTrick: "Research before you pitch.",
  checkPrompt: "Why does market research matter before defining the 4Ps?",
};

describe("Bundle F — Learning Workspace presentation", () => {
  it("maps chunks into instructional blocks (not one prose wall)", () => {
    const blocks = instructionalBlocksFromChunk(sampleChunk);
    expect(blocks.length).toBeGreaterThanOrEqual(4);
    expect(blocks.some((b) => b.kind === "core-idea")).toBe(true);
    expect(blocks.some((b) => b.kind === "example" || b.kind === "code")).toBe(
      true,
    );
    expect(blocks.some((b) => b.kind === "visual")).toBe(true);
    expect(blocks.some((b) => b.kind === "common-trap")).toBe(true);
  });

  it("path position is never mastery", () => {
    const experience = buildLearningExperienceContext({
      topic: "Marketing",
      teachingProgression: {
        pathTitle: "Marketing",
        currentIndex: 2,
        total: 6,
        currentConceptTitle: "Market Research",
      },
    });
    const ws = buildLearningWorkspaceContext({
      experience,
      lesson: null,
      activeChunk: sampleChunk,
      formativeComplete: false,
      hasResult: false,
    });
    expect(ws.pathIsNotMastery).toBe(true);
    expect(ws.conceptPosition).toBe(3);
    expect(ws.conceptTotal).toBe(6);
    const blob = JSON.stringify(ws).toLowerCase();
    expect(blob).not.toMatch(/50% mastered|concepts mastered/);
  });

  it("formative gating: checkPrompt requires action; plain explain may not", () => {
    expect(chunkRequiresFormativeAction(sampleChunk)).toBe(true);
    expect(
      chunkRequiresFormativeAction({
        title: "Intro",
        explanation: "A short orientation paragraph about the topic for learners.",
        example: "",
        role: "context",
      }),
    ).toBe(false);
    expect(
      chunkRequiresFormativeAction(
        {
          title: "Intro",
          explanation: "Orientation.",
          example: "",
          role: "context",
        },
        { isLastChunk: true },
      ),
    ).toBe(true);
  });

  it("workspace stage reflects learn → think → feedback", () => {
    expect(
      resolveWorkspaceStage({
        hasLesson: true,
        formativeRequired: false,
        formativeComplete: false,
        hasResult: false,
      }),
    ).toBe("learn");
    expect(
      resolveWorkspaceStage({
        hasLesson: true,
        formativeRequired: true,
        formativeComplete: false,
        hasResult: false,
      }),
    ).toBe("think");
    expect(
      resolveWorkspaceStage({
        hasLesson: true,
        formativeRequired: true,
        formativeComplete: true,
        hasResult: true,
      }),
    ).toBe("feedback");
  });

  it("Six approach titles are learner-facing", () => {
    expect(sixApproachTitle("detailed-explanation")).toMatch(/Understand/i);
    expect(sixApproachTitle("feynman")).toMatch(/Teach it back/i);
    expect(sixApproachTitle("active-recall")).toMatch(/looking/i);
    expect(actionDeckPromptFromChunk(sampleChunk, "Marketing")).toContain(
      "market research",
    );
  });
});

describe("Bundle F — UI composition", () => {
  it("TeachFirstLearnActivity hosts Learning Workspace shell", () => {
    const ui = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(ui).toContain("data-learning-workspace");
    expect(ui).toContain("LearningObjectStage");
    // Stage landmark lives on LearningObjectStage
    expect(
      read("src/components/study/learning-workspace/LearningObjectStage.tsx"),
    ).toContain("data-learning-stage");
    expect(ui).toContain("LearningDock");
    expect(ui).toContain("CurriculumDrawer");
    expect(ui).toContain("CurriculumRail");
    expect(ui).toContain("canAdvanceStep");
    expect(ui).toContain("buildLearningWorkspaceContext");
    expect(ui).not.toContain("decideKnowledgeLoop");
    expect(ui).not.toContain("reasonCode");
  });

  it("in-stage interaction submits via existing evaluate API path", () => {
    const ui = read("src/components/study/TeachFirstLearnActivity.tsx");
    const stage = read(
      "src/components/study/learning-workspace/LearningObjectStage.tsx",
    );
    expect(ui).toContain('/api/study/evaluate');
    expect(ui).toContain("onSubmit={() => void evaluateExplain()}");
    expect(stage).toContain("data-in-stage-interaction");
    expect(stage).toContain("data-action-deck-feedback");
    expect(stage).toContain("data-learning-object");
  });

  it("Learning Dock preserves room deep links + orchestrated next", () => {
    const dock = read(
      "src/components/study/learning-workspace/LearningDock.tsx",
    );
    expect(dock).toContain("data-learning-dock");
    expect(dock).toContain("data-learn-bottom-nav");
    expect(dock).toContain("data-learn-orchestrated-next");
    expect(dock).toContain("practiceHref");
    expect(dock).toContain("rememberHref");
    expect(dock).toContain("data-dock-minimal");
  });

  it("Curriculum drawer marks path position not mastery", () => {
    const drawer = read(
      "src/components/study/learning-workspace/CurriculumDrawer.tsx",
    );
    expect(drawer).toContain("data-curriculum-drawer");
    expect(drawer).toContain("PATH_POSITION_DISCLAIMER");
    expect(drawer).toContain("CurriculumPositionStatus");
    expect(drawer.toLowerCase()).not.toContain("mastered");
  });

  it("responsive layout: collapsible curriculum rail + immersive stage", () => {
    const ui = read("src/components/study/TeachFirstLearnActivity.tsx");
    const rail = read(
      "src/components/study/learning-workspace/CurriculumRail.tsx",
    );
    expect(ui).toContain("CurriculumRail");
    expect(ui).toContain("data-curriculum-open");
    expect(rail).toContain("data-curriculum-hide");
    expect(rail).toContain("data-curriculum-show");
    expect(ui).toContain("lg:hidden");
  });

  it("no prisma / new intelligence layer in workspace modules", () => {
    for (const f of [
      "src/lib/learning/workspace/present.ts",
      "src/components/study/learning-workspace/LearningObjectStage.tsx",
      "src/components/study/learning-workspace/LearningDock.tsx",
    ]) {
      const src = read(f);
      expect(src).not.toMatch(/prisma\.(db push|migrate)/i);
      expect(src).not.toMatch(/decideKnowledgeLoop|recommendSixTechnique/);
    }
  });
});
