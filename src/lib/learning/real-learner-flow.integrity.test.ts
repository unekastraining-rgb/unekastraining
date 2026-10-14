import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../..");

function readSrc(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-1 real learner flow — Adaptive return UX", () => {
  it("ActivityWorkspace offers Continue learning after bind via shared strip", () => {
    const src = readSrc("src/components/study/ActivityWorkspace.tsx");
    expect(src).toContain("AdaptiveReturnStrip");
    expect(src).toContain('adaptive?.kind === "bound"');
    expect(src).toContain("learnerFacingActivityError");
    expect(src).toContain("foreign_concept");
    const strip = readSrc("src/components/study/AdaptiveReturnStrip.tsx");
    expect(strip).toContain("data-adaptive-return");
    expect(strip).toContain("presentActivityCompletion");
    const completion = readSrc(
      "src/lib/learning/experience/activity-completion-present.ts",
    );
    expect(completion).toContain("LEARNING_ACTION_CONTINUE_LABEL");
    expect(completion).toContain("createsEvidence: false");
  });

  it("FlashcardsView offers Continue learning after review bind", () => {
    const src = readSrc("app/flashcards/flashcards-view.tsx");
    expect(src).toContain("AdaptiveReturnStrip");
    expect(src).toContain("data-adaptive-return-panel");
    expect(src).toContain("setAdaptiveReturn");
    expect(src).toContain("data.adaptive");
  });

  it("QuizTaker already returns to Adaptive (preserved)", () => {
    const src = readSrc("app/quizzes/[id]/quiz-taker.tsx");
    expect(src).toContain("AdaptiveReturnStrip");
    expect(src).toContain("adaptiveReturn");
  });

  it("SixGuidedSession auto-returns to Adaptive (preserved)", () => {
    const src = readSrc("src/components/study/SixGuidedSession.tsx");
    expect(src).toContain("/study/adaptive/");
    expect(src).toContain("router.push");
  });

  it("completed Adaptive shell links Lucky without redesigning Lucky", () => {
    const shell = readSrc(
      "src/components/study/AdaptiveSequenceRunShell.tsx",
    );
    expect(shell).toContain("data-adaptive-lucky-handoff");
    expect(shell).toContain("/study/lucky");
    expect(shell).toContain("Open Lucky retention");
    expect(shell).toContain("Back to Study Hub");
  });

  it("unavailable Adaptive step explains finish vs abandon", () => {
    const shell = readSrc(
      "src/components/study/AdaptiveSequenceRunShell.tsx",
    );
    expect(shell).toContain("Finish adaptive study");
    expect(shell).toContain("no launchable activity");
  });
});

describe("2P-1 real learner flow — direct access preserved", () => {
  it("entry-point still distinguishes Adaptive vs Direct vs Content", () => {
    const entry = readSrc("src/lib/learning/entry-point.ts");
    expect(entry).toContain("ADAPTIVE_LEARNING");
    expect(entry).toContain("DIRECT_ACTIVITY");
    expect(entry).toContain("CONTENT_MANAGEMENT");
  });

  it("direct SIX / Quiz / Flashcard routes remain first-class", () => {
    expect(readSrc("app/study/six/[component]/page.tsx").length).toBeGreaterThan(
      50,
    );
    expect(readSrc("app/quizzes/[id]/page.tsx").length).toBeGreaterThan(50);
    expect(readSrc("app/flashcards/page.tsx").length).toBeGreaterThan(50);
  });

  it("Hub Adaptive CTA still uses canonical start API", () => {
    const card = readSrc("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("/api/study/adaptive/start");
  });
});

describe("2P-1 real learner flow — security & Lucky terminal", () => {
  it("activity submit rejects foreign concept (server)", () => {
    const route = readSrc("app/api/study/activities/[kind]/route.ts");
    expect(route).toContain("foreign_concept");
    expect(route).toContain("bindUniversalActivityToAdaptive");
  });

  it("Lucky handoff remains complete-only", () => {
    const coord = readSrc("src/lib/learning/sequence/coordinator.ts");
    expect(coord).toContain("syncLuckyRetentionAfterSequenceComplete");
    const completeFn = coord.slice(
      coord.indexOf("export async function completeAdaptiveSequence"),
    );
    const abandonFn = coord.slice(
      coord.indexOf("export async function abandonAdaptiveSequence"),
    );
    expect(completeFn.slice(0, 600)).toContain(
      "syncLuckyRetentionAfterSequenceComplete",
    );
    expect(abandonFn.slice(0, 600)).not.toContain(
      "syncLuckyRetentionAfterSequenceComplete",
    );
  });

  it("CORE does not write mastery on continue-learning bridge", () => {
    const core = readSrc(
      "src/lib/learning/orchestrator/core-adaptive-bridge.ts",
    );
    expect(core).not.toContain("recordEvidence");
    expect(core).not.toContain("applyEvidenceToMastery");
  });

  it("public Tutor cannot authorize evidence", () => {
    const route = readSrc("app/api/study/tutor/route.ts");
    expect(route).toMatch(/evidenceIntent:\s*["']none["']/);
  });
});

describe("2P-1 audit artifact", () => {
  it("REAL_LEARNER_FLOW_AUDIT.md documents journeys and fixes", () => {
    const doc = readSrc("src/lib/learning/REAL_LEARNER_FLOW_AUDIT.md");
    expect(doc).toContain("Executive Summary");
    expect(doc).toContain("ActivityWorkspace");
    expect(doc).toContain("flashcards-view");
    expect(doc).toContain("CORE → SIX → LUCKY");
    expect(doc).toContain("NAVIGATION GAP");
  });
});
