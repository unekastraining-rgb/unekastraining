/**
 * 2G-78 — Adaptive entry-point integrity (classification + convergence).
 */

import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import {
  CANONICAL_ADAPTIVE_START_PATH,
  classifyAdaptiveLearningEntry,
  entryPointIntegrityTruthSummary,
  getStudyHaulEntryPoint,
  listEntryPointsByKind,
  listStudyHaulEntryPoints,
} from "@/lib/learning/entry-point";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("2G-78 entry-point classification", () => {
  it("inventories Adaptive / Direct / Content kinds without forcing everything Adaptive", () => {
    const all = listStudyHaulEntryPoints();
    expect(all.length).toBeGreaterThan(10);
    expect(listEntryPointsByKind("ADAPTIVE_LEARNING").length).toBeGreaterThan(2);
    expect(listEntryPointsByKind("DIRECT_ACTIVITY").length).toBeGreaterThan(4);
    expect(listEntryPointsByKind("CONTENT_MANAGEMENT").length).toBeGreaterThan(2);

    const t = entryPointIntegrityTruthSummary();
    expect(t.everyClickIsAdaptive).toBe(false);
    expect(t.hubActivityOpenIsDirect).toBe(true);
    expect(t.assignmentsPracticeActivitiesIsDirect).toBe(true);
    expect(t.canonicalAdaptiveStartOnly).toBe(true);
    expect(t.clientLearnerIdTrusted).toBe(false);
  });

  it("classifies Adaptive CTAs only when concept or run is present", () => {
    expect(classifyAdaptiveLearningEntry({})).toBe("none");
    expect(classifyAdaptiveLearningEntry({ conceptId: "  " })).toBe("none");
    expect(
      classifyAdaptiveLearningEntry({ conceptId: "concept-1" }),
    ).toBe("ADAPTIVE_LEARNING");
    expect(
      classifyAdaptiveLearningEntry({ activeRunId: "run-1" }),
    ).toBe("ADAPTIVE_LEARNING");
  });

  it("documents Hub activity open and Assignments practice as DIRECT_ACTIVITY", () => {
    expect(getStudyHaulEntryPoint("hub_orchestrator_activity_open")?.kind).toBe(
      "DIRECT_ACTIVITY",
    );
    expect(
      getStudyHaulEntryPoint("assignments_practice_activities")?.kind,
    ).toBe("DIRECT_ACTIVITY");
    expect(getStudyHaulEntryPoint("quiz_open_known")?.kind).toBe(
      "DIRECT_ACTIVITY",
    );
    expect(getStudyHaulEntryPoint("flashcard_review")?.kind).toBe(
      "DIRECT_ACTIVITY",
    );
    expect(getStudyHaulEntryPoint("six_direct_technique")?.kind).toBe(
      "DIRECT_ACTIVITY",
    );
  });
});

describe("2G-78 Adaptive start convergence", () => {
  it("all Adaptive Learning callers use canonical POST /api/study/adaptive/start", () => {
    expect(CANONICAL_ADAPTIVE_START_PATH).toBe("/api/study/adaptive/start");

    const startRoute = read("app/api/study/adaptive/start/route.ts");
    expect(startRoute).toContain("startOrResumeAdaptiveSequenceForConcept");
    expect(startRoute).toContain("getOrCreateDefaultUser");
    expect(startRoute).toMatch(/void body\?\.(userId|learnerId)/);

    const hub = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(hub).toContain('"/api/study/adaptive/start"');
    expect(hub).toContain('data-entry-kind="adaptive-learning"');

    const core = read("src/components/core/CoreKnowledgeBridgePanel.tsx");
    expect(core).toContain('"/api/study/adaptive/start"');
    expect(core).toContain('data-entry-kind="adaptive-learning"');

    const studyNow = read("src/components/study/ContinueLearningButton.tsx");
    expect(studyNow).toContain('"/api/study/adaptive/start"');
    expect(studyNow).toContain('data-entry-kind="adaptive-learning"');

    const startHelper = read("src/lib/learning/sequence/start-or-resume.ts");
    expect(startHelper).toContain("startAdaptiveSequenceRun");

    // No second Adaptive start API
    expect(
      existsSync(
        path.join(process.cwd(), "app/api/study/adaptive-sequence/route.ts"),
      ),
    ).toBe(false);
  });

  it("Hub activity Open remains direct (not Adaptive start)", () => {
    const hub = read("src/components/study/OrchestratorSuggestionCard.tsx");
    const activityIdx = hub.indexOf("data-hub-activity-intervention");
    const adaptiveIdx = hub.indexOf("data-orchestrator-adaptive-study");
    expect(activityIdx).toBeGreaterThan(-1);
    expect(adaptiveIdx).toBeGreaterThan(-1);
    expect(hub).toContain('data-hub-secondary-cta="direct-activity"');
    expect(hub).toContain("suggestion.activityIntervention.href");
    // Activity open does not call adaptive start
    const openBlock = hub.slice(
      activityIdx,
      hub.indexOf("data-orchestrator-adaptive-study"),
    );
    expect(openBlock).not.toContain("/api/study/adaptive/start");
  });

  it("AssignmentsTab practice link remains direct catalog access", () => {
    const tab = read("src/components/hub/AssignmentsTab.tsx");
    expect(tab).toContain('href="/study/activities/coding"');
    expect(tab).toContain('data-entry-kind="direct-activity"');
    expect(tab).toContain("data-assignments-practice-activities");
    expect(tab).not.toContain("/api/study/adaptive/start");
  });

  it("preserves direct SIX / Quiz / Flashcard / CORE / Study Now surfaces", () => {
    expect(existsSync(path.join(process.cwd(), "app/study/six/[component]/page.tsx"))).toBe(
      true,
    );
    expect(read("src/lib/csl/six-guides.ts")).toContain("/study/six/");

    const quizPage = existsSync(path.join(process.cwd(), "app/quizzes"));
    expect(quizPage).toBe(true);

    const flash = existsSync(path.join(process.cwd(), "app/flashcards"));
    expect(flash).toBe(true);

    const studyNowBridge = read("src/lib/learning/study-now-ule-bridge.ts");
    expect(studyNowBridge).toContain("replacesPlanner: false");
    expect(studyNowBridge).toContain("inventsConcepts: false");

    const coreBridge = read("src/lib/learning/orchestrator/core-adaptive-bridge.ts");
    expect(coreBridge).toContain("Continue learning");
  });
});

describe("2G-78 Lucky terminal handoff boundary", () => {
  it("completeAdaptiveSequence is the sole Lucky handoff call site in coordinator", () => {
    const coord = read("src/lib/learning/sequence/coordinator.ts");
    const handoff = "syncLuckyRetentionAfterSequenceComplete";
    const callSites = coord.match(
      new RegExp(`await\\s+${handoff}\\s*\\(`, "g"),
    );
    expect(callSites).toHaveLength(1);
    expect(coord).toContain("import { syncLuckyRetentionAfterSequenceComplete");

    const completeIdx = coord.indexOf(
      "export async function completeAdaptiveSequence",
    );
    const callIdx = coord.indexOf(`await ${handoff}`);
    expect(completeIdx).toBeGreaterThan(-1);
    expect(callIdx).toBeGreaterThan(completeIdx);

    const abandon = read("app/api/study/adaptive/[runId]/abandon/route.ts");
    expect(abandon).not.toContain(handoff);

    const planFnStart = coord.indexOf(
      "export async function recordAdaptiveSequenceCompletionAndPlanNext",
    );
    const planFnEnd = coord.indexOf(
      "export async function resumeAdaptiveSequenceRun",
      planFnStart,
    );
    const planSlice = coord.slice(planFnStart, planFnEnd);
    expect(planSlice).not.toContain(`await ${handoff}`);
  });
});

describe("2G-78 title-only selection is policy metadata, not entry bypass", () => {
  it("compatibility title cues do not invent Concepts or Adaptive start APIs", () => {
    const compat = read(
      "src/lib/learning/orchestrator/activity-intervention-compatibility.ts",
    );
    expect(compat).toContain("title_topic_cue_match");
    expect(compat).not.toContain("createConcept");
    expect(compat).not.toContain("/api/study/adaptive/start");

    const t = entryPointIntegrityTruthSummary();
    expect(t.inventsConceptsFromTitles).toBe(false);
  });
});

describe("2G-78 / 2P-24 browser E2E harness", () => {
  it("Playwright config exists; Cypress not introduced", () => {
    expect(existsSync(path.join(process.cwd(), "playwright.config.ts"))).toBe(
      true,
    );
    expect(existsSync(path.join(process.cwd(), "cypress.config.ts"))).toBe(
      false,
    );
    expect(existsSync(path.join(process.cwd(), "e2e/canonical-adaptive.spec.ts"))).toBe(
      true,
    );
    const docs = read("src/lib/learning/BROWSER_E2E_LEARNER_JOURNEY.md");
    expect(docs).toMatch(/Playwright/i);
    expect(docs).toMatch(/Launch ≠ LearningAttempt|Launch ≠ Evidence/i);
  });
});
