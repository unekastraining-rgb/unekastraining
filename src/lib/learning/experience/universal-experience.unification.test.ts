import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  adaptiveLearningActionLabel,
  containsInternalLearningIdLeak,
  learningActionFromHubCta,
  LEARNING_ACTION_CONTINUE_LABEL,
  LEARNING_ACTION_START_LABEL,
  LEARNING_ACTION_TRY_AGAIN_LABEL,
  LEARNING_ACTION_VIEW_PROGRESS_LABEL,
  openActivityLearningAction,
  openCoreLearningAction,
  openHubLearningAction,
  openLuckyLearningAction,
  openTutorLearningAction,
  resolveUniversalAdaptiveLearningAction,
} from "@/lib/learning/experience/learning-action";
import { resolveHubAdaptivePrimaryCta } from "@/lib/learning/orchestrator/hub-adaptive-bridge";
import {
  resolveUniversalActivityState,
  UNIVERSAL_ACTIVITY_STATES,
  universalActivityStateLearnerLine,
} from "@/lib/learning/experience/activity-lifecycle-state";
import {
  presentActivityCompletion,
  presentWhyThisActivity,
} from "@/lib/learning/experience/activity-completion-present";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("2P-25 LearningAction contract", () => {
  it("START_ADAPTIVE when concept only", () => {
    const action = resolveUniversalAdaptiveLearningAction({
      conceptId: "c1",
    });
    expect(action).toEqual({
      action: "START_ADAPTIVE",
      label: LEARNING_ACTION_START_LABEL,
      conceptId: "c1",
    });
  });

  it("CONTINUE_ADAPTIVE when active run", () => {
    const action = resolveUniversalAdaptiveLearningAction({
      conceptId: "c1",
      activeRunId: "run-1",
    });
    expect(action).toEqual({
      action: "CONTINUE_ADAPTIVE",
      label: LEARNING_ACTION_CONTINUE_LABEL,
      href: "/study/adaptive/run-1",
      runId: "run-1",
    });
  });

  it("NONE when no concept and no run", () => {
    expect(resolveUniversalAdaptiveLearningAction({})).toEqual({
      action: "NONE",
      label: "",
    });
  });

  it("maps Hub CTA and fallback open actions", () => {
    const hub = resolveHubAdaptivePrimaryCta({ conceptId: "c1" });
    expect(learningActionFromHubCta(hub).action).toBe("START_ADAPTIVE");
    expect(openActivityLearningAction({ label: "Open lab", href: "/study/activities/lab" }).action).toBe(
      "OPEN_ACTIVITY",
    );
    expect(openCoreLearningAction().href).toBe("/core");
    expect(openHubLearningAction().href).toBe("/study");
    expect(openLuckyLearningAction().href).toBe("/study/lucky");
    expect(openTutorLearningAction({ conceptId: "c1" }).href).toContain(
      "conceptId=c1",
    );
  });

  it("detects internal id / enum leaks for learner copy", () => {
    expect(containsInternalLearningIdLeak("UNDERSTANDING_GAP")).toBe(true);
    expect(containsInternalLearningIdLeak("Let's practice applying this.")).toBe(
      false,
    );
  });

  it("does not write evidence or create runs", () => {
    const src = read("src/lib/learning/experience/learning-action.ts");
    expect(src).not.toMatch(/applyEvidenceToMastery|recordEvidence|\/api\/study\/adaptive\/start/);
    expect(src).toContain("presentation / navigation only");
  });
});

describe("2P-25 activity lifecycle states", () => {
  it("covers the universal state set", () => {
    expect(UNIVERSAL_ACTIVITY_STATES).toContain("LOADING");
    expect(UNIVERSAL_ACTIVITY_STATES).toContain("COMPLETED");
    expect(UNIVERSAL_ACTIVITY_STATES).toContain("UNAVAILABLE");
  });

  it("resolves loading / submitting / completed / unavailable", () => {
    expect(resolveUniversalActivityState({ loading: true })).toBe("LOADING");
    expect(resolveUniversalActivityState({ submitting: true })).toBe(
      "SUBMITTING",
    );
    expect(resolveUniversalActivityState({ completed: true })).toBe(
      "COMPLETED",
    );
    expect(resolveUniversalActivityState({ unavailable: true })).toBe(
      "UNAVAILABLE",
    );
    expect(resolveUniversalActivityState({ hasWork: true })).toBe(
      "IN_PROGRESS",
    );
    expect(resolveUniversalActivityState({})).toBe("READY");
  });

  it("learner lines avoid internal codes", () => {
    for (const state of UNIVERSAL_ACTIVITY_STATES) {
      const line = universalActivityStateLearnerLine(state);
      expect(containsInternalLearningIdLeak(line)).toBe(false);
      expect(line.length).toBeGreaterThan(3);
    }
  });
});

describe("2P-25 completion presentation", () => {
  it("does not create evidence", () => {
    const p = presentActivityCompletion({
      adaptiveRunId: "run-9",
      outcomeLabel: "PASS",
    });
    expect(p.createsEvidence).toBe(false);
    expect(p.continueAdaptiveHref).toBe("/study/adaptive/run-9");
    expect(p.continueAdaptiveLabel).toBe(LEARNING_ACTION_CONTINUE_LABEL);
    expect(p.growthCenterHref).toBe("/study/learner-model");
  });

  it("why-this-activity prefers whyReason then purpose", () => {
    expect(
      presentWhyThisActivity({
        whyReason: "Let's practice applying this idea.",
        purpose: "fallback",
      }),
    ).toBe("Let's practice applying this idea.");
    expect(
      presentWhyThisActivity({
        purpose: "Practice writing.",
        conceptTitle: "Essay structure",
      }),
    ).toBe("Practice writing.");
  });

  it("AdaptiveReturnStrip is presentation-only shared surface", () => {
    const strip = read("src/components/study/AdaptiveReturnStrip.tsx");
    expect(strip).toContain("presentActivityCompletion");
    expect(strip).toContain("data-adaptive-return");
    expect(strip).not.toMatch(/fetch\(|LearningAttempt|applyEvidence/);
    const workspace = read("src/components/study/ActivityWorkspace.tsx");
    expect(workspace).toContain("AdaptiveReturnStrip");
    expect(workspace).toContain("data-activity-state");
  });
});

describe("2P-33 experience unification connectors", () => {
  it("adaptiveLearningActionLabel distinguishes Start vs Continue", () => {
    expect(adaptiveLearningActionLabel(false)).toBe(LEARNING_ACTION_START_LABEL);
    expect(adaptiveLearningActionLabel(true)).toBe(LEARNING_ACTION_CONTINUE_LABEL);
    expect(LEARNING_ACTION_VIEW_PROGRESS_LABEL).toBe("View progress");
    expect(LEARNING_ACTION_TRY_AGAIN_LABEL).toBe("Practice again");
  });

  it("Materials and Assignments use shared ContinueLearningButton / Start-Continue labels", () => {
    const materials = read("src/components/materials/MaterialLearningPanel.tsx");
    expect(materials).toContain("ContinueLearningButton");
    expect(materials).toContain("data-material-start-learning");
    expect(materials).not.toMatch(/Start learning\s*<\/button>/);

    const assignments = read("src/components/hub/HubAssignmentsPanel.tsx");
    expect(assignments).toContain("ContinueLearningButton");
    expect(assignments).not.toContain('label="Study this"');
    expect(assignments).toContain("Study this assignment");

    const studyNow = read("src/components/study/StudySessionRunner.tsx");
    expect(studyNow).toContain("Adaptive practice");
    expect(studyNow).not.toContain("Practice ·");
  });

  it("SIX Adaptive-bound exposes Continue learning return", () => {
    const six = read("src/components/study/SixGuidedSession.tsx");
    expect(six).toContain("data-six-adaptive-return");
    expect(six).toContain("Continue learning");
    expect(six).toContain("data-six-return-growth");
  });

  it("Growth copy avoids Orchestrator jargon for learners", () => {
    const growth = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(growth).not.toMatch(/Orchestrator recommendation/i);
    expect(growth).toContain("demonstrated progress");
    expect(growth).toContain("Start or Continue learning");
  });

  it("Hub presents Study Hub home without inventing evidence writers", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(hub).toContain("Study Hub");
    expect(center).toContain("What are you here to learn?");
    expect(center).toContain("Learn Something New");
    expect(hub).not.toMatch(/LearningAttempt|applyEvidenceToMastery/);
  });
});
