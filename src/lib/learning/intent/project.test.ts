/**
 * Phase 2G-23 — Intent projection tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { detectCoreStudyIntent } from "@/lib/core/study-intent";
import {
  createExplicitLearningIntent,
  projectCoreStudyIntentToLearningIntent,
  projectSystemInterventionToLearningIntent,
  projectTutorModeToLearningIntent,
} from "@/lib/learning/intent/project";
import { parseAdaptiveLaunchContext } from "@/lib/learning/sequence/adaptive-launch-context";
import type { TutorMode } from "@/lib/learning/tutor/types";

describe("Phase 2G-23 createExplicitLearningIntent", () => {
  it("builds EXPLICIT intents for all purposes", () => {
    for (const purpose of [
      "UNDERSTAND",
      "PRACTICE",
      "ASSESS",
      "CREATE",
    ] as const) {
      const intent = createExplicitLearningIntent({
        purpose,
        provenance: "user_selection",
        scope: "activity",
      });
      expect(intent).toEqual({
        purpose,
        source: "EXPLICIT",
        scope: "activity",
        provenance: "user_selection",
      });
    }
  });

  it("defaults scope to request", () => {
    expect(
      createExplicitLearningIntent({ purpose: "ASSESS" }).scope,
    ).toBe("request");
  });
});

describe("Phase 2G-23 TutorMode projection", () => {
  it("maps PRACTICE → PRACTICE and EXAM → ASSESS", () => {
    expect(projectTutorModeToLearningIntent("PRACTICE")).toMatchObject({
      purpose: "PRACTICE",
      source: "INFERRED",
      provenance: "tutor_mode",
      scope: "request",
    });
    expect(projectTutorModeToLearningIntent("EXAM")).toMatchObject({
      purpose: "ASSESS",
      source: "INFERRED",
      provenance: "tutor_mode",
    });
  });

  it("uses EXPLICIT + user_selection when learnerSelected", () => {
    expect(
      projectTutorModeToLearningIntent("EXAM", { learnerSelected: true }),
    ).toMatchObject({
      purpose: "ASSESS",
      source: "EXPLICIT",
      provenance: "user_selection",
    });
  });

  it("returns null for teaching/register modes (policy ≠ why-opened)", () => {
    const ambiguous: TutorMode[] = [
      "BEGINNER",
      "TEACH_ME",
      "SOCRATIC",
      "GUIDED",
      "CHALLENGE",
      "ADVANCED",
    ];
    for (const mode of ambiguous) {
      expect(projectTutorModeToLearningIntent(mode)).toBeNull();
    }
  });
});

describe("Phase 2G-23 CoreStudyIntent projection", () => {
  it("maps practice / explain / generate artifacts conservatively", () => {
    expect(projectCoreStudyIntentToLearningIntent("practice")).toMatchObject({
      purpose: "PRACTICE",
      source: "EXPLICIT",
      provenance: "user_utterance",
    });
    expect(projectCoreStudyIntentToLearningIntent("explain")).toMatchObject({
      purpose: "UNDERSTAND",
      source: "EXPLICIT",
    });
    expect(projectCoreStudyIntentToLearningIntent("quiz")).toMatchObject({
      purpose: "CREATE",
    });
    expect(projectCoreStudyIntentToLearningIntent("flashcards")).toMatchObject({
      purpose: "CREATE",
    });
    expect(
      projectCoreStudyIntentToLearningIntent("learning-plan"),
    ).toMatchObject({ purpose: "CREATE" });
  });

  it("omits overloaded study-guide and null", () => {
    expect(projectCoreStudyIntentToLearningIntent("study-guide")).toBeNull();
    expect(projectCoreStudyIntentToLearningIntent(null)).toBeNull();
  });

  it("does not treat conversational quiz me as Core intent → ASSESS", () => {
    expect(detectCoreStudyIntent("Quiz me on exceptions")).toBeNull();
    expect(
      projectCoreStudyIntentToLearningIntent(
        detectCoreStudyIntent("Quiz me on exceptions"),
      ),
    ).toBeNull();
  });

  it("maps test myself → PRACTICE via Core detection", () => {
    const core = detectCoreStudyIntent("Let me test myself on this chapter");
    expect(core).toBe("practice");
    expect(projectCoreStudyIntentToLearningIntent(core)?.purpose).toBe(
      "PRACTICE",
    );
  });

  it("generate quiz Core intent is CREATE not ASSESS", () => {
    const core = detectCoreStudyIntent("generate a quiz on Java");
    expect(core).toBe("quiz");
    expect(projectCoreStudyIntentToLearningIntent(core)?.purpose).toBe(
      "CREATE",
    );
  });
});

describe("Phase 2G-23 system intervention is not learner intent", () => {
  it("always returns null for Orchestrator/Adaptive interventions", () => {
    expect(projectSystemInterventionToLearningIntent("feynman")).toBeNull();
    expect(
      projectSystemInterventionToLearningIntent("active-recall"),
    ).toBeNull();
    expect(projectSystemInterventionToLearningIntent("quiz")).toBeNull();
  });
});

describe("Phase 2G-23 Adaptive + projections (no behavior change)", () => {
  it("carries projected intent optionally without requiring it", () => {
    const without = parseAdaptiveLaunchContext({
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
    });
    expect(without.intent).toBeNull();

    const intent = createExplicitLearningIntent({
      purpose: "PRACTICE",
      provenance: "user_selection",
      scope: "activity",
    });
    const withIntent = parseAdaptiveLaunchContext({
      adaptiveRunId: "run-1",
      adaptiveStep: 0,
      intent,
    });
    expect(withIntent.intent).toEqual(intent);
    expect(withIntent.runId).toBe("run-1");
    expect(withIntent.stepIndex).toBe(0);
  });

  it("does not wire projections into Orchestrator diagnose", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toContain("projectTutorModeToLearningIntent");
    expect(diagnose).not.toContain("createExplicitLearningIntent");
  });
});
