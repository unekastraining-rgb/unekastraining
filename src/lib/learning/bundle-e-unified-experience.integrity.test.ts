/**
 * Bundle E — Unified Learning Experience integrity tests.
 * Presentation layer only — no new intelligence engines.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import "@/lib/learning/knowledge/packs";
import {
  buildLearningExperienceContext,
  learningExperienceStatusLines,
  PATH_POSITION_DISCLAIMER,
  coreLearningActionLinks,
  sixHowMessageForLearner,
  activityDoingLabel,
} from "@/lib/learning/unified-experience";
import {
  buildCoreLearningContent,
  coreLearningActionHints,
} from "@/lib/learning/core";
import {
  decomposeTeachConceptsDeterministic,
  detectTeachScope,
} from "@/lib/learning/teach";
import {
  understandLearningTarget,
  resetDynamicPathsForTests,
  resetGeneralTeachingRegistryForTests,
} from "@/lib/learning/knowledge/retrieval";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Bundle E — Unified Learning Experience (E1)", () => {
  beforeEach(() => {
    resetDynamicPathsForTests();
    resetGeneralTeachingRegistryForTests();
  });

  it("learning context projects path position separately from mastery", () => {
    const ctx = buildLearningExperienceContext({
      topic: "Marketing",
      teachingProgression: {
        pathTitle: "Marketing",
        currentIndex: 2,
        total: 9,
        currentConceptId: "c3",
        currentConceptTitle: "Market Research",
        nextConceptTitle: "Segmentation",
      },
      orchestration: {
        action: "teach",
        conceptId: "c3",
        reasonCode: "new-concept",
        confidence: "high",
        learnerLabel: "Continue learning",
        learnerHint: "Start with a clear explanation.",
        destination: { action: "teach", href: "/study/teach-me", room: "learn" },
        sixRecommendation: {
          technique: "detailed-explanation",
          reasonCode: "new-concept",
          reason: "New concept",
          confidence: "high",
        },
      },
    });
    expect(ctx.pathIsNotMastery).toBe(true);
    expect(ctx.path?.kind).toBe("path-position");
    expect(ctx.path?.currentIndex).toBe(2);
    expect(ctx.path?.total).toBe(9);
    expect(ctx.currentConcept?.title).toBe("Market Research");
    expect(ctx.sixHowMessage).toMatch(/break this down/i);
    const lines = learningExperienceStatusLines(ctx);
    expect(lines.where).toMatch(/3 of 9/);
    expect(lines.where).toMatch(/path position/i);
    expect(lines.doing).toBe("Learning");
    expect(PATH_POSITION_DISCLAIMER.toLowerCase()).toContain("not");
    expect(PATH_POSITION_DISCLAIMER.toLowerCase()).toContain("mastered");
  });

  it("does not report path position as mastery for mixed evidence", () => {
    const understood = understandLearningTarget("Teach me Java inheritance")!;
    const base = resolveTeachingKnowledgeContext("Java inheritance")!;
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    const ids = decomposed.context.concepts.map((c) => c.id);
    // Mixed evidence A exposed, B incorrect — path position ≠ mastered count.
    // Focus is first not-ready concept (A → practice), not a mastery tally.
    const decision = decideKnowledgeLoop({
      target: "Java inheritance",
      knowledge: decomposed.context,
      statesByConceptId: new Map([
        [
          ids[0]!,
          {
            userId: "u",
            conceptId: ids[0]!,
            exposureCount: 1,
            attemptCount: 0,
            correctCount: 0,
            incorrectCount: 0,
          },
        ],
        [
          ids[1]!,
          {
            userId: "u",
            conceptId: ids[1]!,
            exposureCount: 1,
            attemptCount: 1,
            correctCount: 0,
            incorrectCount: 1,
            lastOutcome: "incorrect",
          },
        ],
      ]),
      evidence: [],
    });
    const ctx = buildLearningExperienceContext({
      topic: "Java inheritance",
      teachingProgression: {
        pathTitle: "Java inheritance",
        currentIndex: 0,
        total: ids.length,
        currentConceptId: decision.conceptId,
        currentConceptTitle: "Concept A",
      },
      orchestration: {
        action: decision.action,
        conceptId: decision.conceptId,
        reasonCode: decision.reasonCode,
        confidence: decision.confidence,
        learnerLabel: "Practice this concept",
      },
    });
    expect(ctx.path?.currentIndex).toBe(0);
    expect(ctx.path?.total).toBe(ids.length);
    expect(["practice", "reteach", "teach"]).toContain(decision.action);
    // Never invent "3 mastered"
    const blob = JSON.stringify(ctx);
    expect(blob.toLowerCase()).not.toMatch(/mastered/);
  });

  it("Orchestrator destinations map to rooms without React re-decision", () => {
    expect(activityDoingLabel("practice")).toBe("Practicing");
    expect(activityDoingLabel("recall")).toBe("Recalling");
    expect(activityDoingLabel("reteach")).toBe("Reviewing again");
    expect(activityDoingLabel("complete")).toBe("Completed");
    const teach = understandLearningTarget("Teach me marketing")!;
    expect(detectTeachScope(teach)).not.toBe("focused-concept");
  });

  it("Six HOW messages stay learner-facing", () => {
    expect(
      sixHowMessageForLearner({
        technique: "hands-on-practice",
        reasonCode: "needs-practice",
        reason: "internal",
        confidence: "high",
      }),
    ).toMatch(/apply/i);
    expect(
      sixHowMessageForLearner({
        technique: "active-recall",
        reasonCode: "needs-recall",
        reason: "internal",
        confidence: "high",
      }),
    ).toMatch(/remember/i);
  });

  it("Learn UI consumes unified experience + path disclaimer", () => {
    const ui = read("src/components/study/TeachFirstLearnActivity.tsx");
    const header = read(
      "src/components/study/learning-workspace/LearningWorkspaceHeader.tsx",
    );
    expect(ui).toContain("buildLearningExperienceContext");
    expect(ui).toContain("LearningWorkspaceHeader");
    expect(header).toContain("data-unified-learning-experience");
    expect(header).toContain("data-path-is-not-mastery");
    expect(header).toContain("PATH_POSITION_DISCLAIMER");
    expect(ui).toContain("LearningDock");
    expect(ui).not.toContain("decideKnowledgeLoop");
  });

  it("completion uses Orchestrator complete action", () => {
    const ctx = buildLearningExperienceContext({
      topic: "Marketing",
      orchestration: {
        action: "complete",
        conceptId: "c1",
        reasonCode: "no-next-concept",
        confidence: "high",
        learnerLabel: "You're caught up",
      },
    });
    expect(ctx.isComplete).toBe(true);
    expect(learningExperienceStatusLines(ctx).next).toMatch(/covered/i);
  });
});

describe("Bundle E — Core → Learning (E2)", () => {
  it("ArrayList note → Learn / Practice / Recall / Explain links", () => {
    const content = buildCoreLearningContent({
      sourceId: "note-1",
      userId: "user-a",
      title: "ArrayList notes",
      content:
        "ArrayList stores multiple objects in a resizable array in Java.",
    });
    const hints = coreLearningActionHints(content);
    expect(hints.some((h) => h.action === "learn")).toBe(true);
    const links = coreLearningActionLinks(content);
    expect(links.find((l) => l.action === "learn")?.href).toMatch(/teach-me/);
    expect(links.find((l) => l.action === "practice")?.href).toBeTruthy();
    expect(links.find((l) => l.action === "recall")?.href).toMatch(/lucky/);
    expect(links.find((l) => l.action === "explain")?.href).toMatch(
      /focus=explain/,
    );
  });

  it("low-information note does not invent a concept", () => {
    const content = buildCoreLearningContent({
      sourceId: "note-2",
      userId: "user-a",
      content: "ok",
    });
    const links = coreLearningActionLinks(content);
    expect(links.every((l) => !l.href || l.action === "connect-concept")).toBe(
      true,
    );
    expect(
      links.some((l) =>
        (l.disabledReason ?? l.reason).toLowerCase().includes("couldn't identify"),
      ),
    ).toBe(true);
  });

  it("Core UI exposes Learn this without mutating notes", () => {
    const panel = read("src/components/core/CoreLearningActionsPanel.tsx");
    const studio = read("src/components/core/CoreStudioPanel.tsx");
    const api = read("app/api/core/learning-actions/route.ts");
    expect(studio).toContain("CoreLearningActionsPanel");
    expect(panel).toContain("data-core-learning-actions");
    expect(panel).toContain("Learn from this note");
    expect(panel).toContain("data-core-learn-action");
    expect(panel).toContain("Your note stays unchanged");
    expect(api).toContain("contentUnchanged: true");
    expect(read("src/lib/learning/unified-experience/core-actions.ts")).toContain(
      '"Learn this"',
    );
    expect(api).toContain("userId: user.id");
    expect(api).not.toMatch(/note\.update|db\.note\.update/);
  });

  it("ownership: learning-actions scopes note by session user", () => {
    const api = read("app/api/core/learning-actions/route.ts");
    expect(api).toContain("where: { id: noteId, userId: user.id }");
    expect(api).not.toMatch(/body\.userId/);
  });
});

describe("Bundle E — Student Home / Hub (E3)", () => {
  it("Study Haul welcome mounts Continue Learning experience", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).toContain("ContinueLearningExperienceCard");
    expect(center).toContain("LearnerGrowthContinuityStrip");
    expect(center).not.toContain("OrchestratorSuggestionCard");
  });

  it("Academic Hub dashboard mounts Continue Learning additively", () => {
    const dash = read("src/components/hub/HubDashboardTab.tsx");
    expect(dash).toContain("ContinueLearningExperienceCard");
    expect(dash).toContain("HubStudyNowCard");
  });

  it("Continue Learning card consumes orchestrator API (no local rules)", () => {
    const card = read(
      "src/components/study/ContinueLearningExperienceCard.tsx",
    );
    expect(card).toContain("/api/study/orchestrator-suggestion");
    expect(card).toContain("data-continue-learning-experience");
    expect(card).toContain("resolveHubAdaptivePrimaryCta");
    expect(card).not.toMatch(/if\s*\(.*lastTopic/);
    expect(card).toContain("touch-manipulation");
    expect(card).toContain("min-h-11");
  });

  it("Growth Center retains OrchestratorSuggestionCard", () => {
    const growth = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(growth).toContain("OrchestratorSuggestionCard");
  });

  it("front-door IA still demotes OrchestratorSuggestionCard from hub shell", () => {
    const hub = read("app/study/study-hub-view.tsx");
    expect(hub).not.toContain("OrchestratorSuggestionCard");
  });
});

describe("Bundle E — journeys (composition)", () => {
  it("Journey A/D wiring: Teach + Core → Learn paths exist", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("teachingProgression");
    expect(route).toContain("resolveKnowledgeLoopOrchestration");
    expect(read("app/api/core/learning-actions/route.ts")).toContain(
      "coreLearningActionLinks",
    );
  });

  it("no prisma migration in Bundle E modules", () => {
    for (const f of [
      "src/lib/learning/unified-experience/present.ts",
      "src/lib/learning/unified-experience/core-actions.ts",
      "app/api/core/learning-actions/route.ts",
      "src/components/study/ContinueLearningExperienceCard.tsx",
      "src/components/core/CoreLearningActionsPanel.tsx",
    ]) {
      const src = read(f);
      expect(src).not.toMatch(/prisma\.(db push|migrate)/i);
      expect(src).not.toMatch(/schema\.prisma/);
    }
  });
});
