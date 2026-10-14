/**
 * Phase 2G-22 — Learning Intent contract tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  LEARNING_INTENT_PROVENANCES,
  LEARNING_INTENT_PURPOSES,
  LEARNING_INTENT_SCOPES,
  LEARNING_INTENT_SOURCES,
  isLearningIntent,
  isLearningIntentProvenance,
  isLearningIntentPurpose,
  isLearningIntentScope,
  isLearningIntentSource,
  parseLearningIntent,
} from "@/lib/learning/intent";
import {
  parseAdaptiveLaunchContext,
  parseAdaptiveRunId,
  parseAdaptiveStepIndex,
} from "@/lib/learning/sequence/adaptive-launch-context";

describe("Phase 2G-22 Learning Intent contract", () => {
  it("accepts all canonical purposes", () => {
    for (const purpose of LEARNING_INTENT_PURPOSES) {
      expect(isLearningIntentPurpose(purpose)).toBe(true);
      expect(
        parseLearningIntent({
          purpose,
          source: "EXPLICIT",
          scope: "request",
        })?.purpose,
      ).toBe(purpose);
    }
  });

  it("accepts EXPLICIT and INFERRED sources only", () => {
    for (const source of LEARNING_INTENT_SOURCES) {
      expect(isLearningIntentSource(source)).toBe(true);
    }
    expect(isLearningIntentSource("SYSTEM")).toBe(false);
    expect(
      parseLearningIntent({
        purpose: "ASSESS",
        source: "SYSTEM",
        scope: "request",
      }),
    ).toBeNull();
  });

  it("accepts request / activity / session_hold scopes", () => {
    for (const scope of LEARNING_INTENT_SCOPES) {
      expect(isLearningIntentScope(scope)).toBe(true);
      expect(
        parseLearningIntent({
          purpose: "PRACTICE",
          source: "EXPLICIT",
          scope,
        })?.scope,
      ).toBe(scope);
    }
  });

  it("accepts approved provenance values", () => {
    for (const provenance of LEARNING_INTENT_PROVENANCES) {
      expect(isLearningIntentProvenance(provenance)).toBe(true);
      expect(
        parseLearningIntent({
          purpose: "UNDERSTAND",
          source: "EXPLICIT",
          scope: "activity",
          provenance,
        })?.provenance,
      ).toBe(provenance);
    }
  });

  it("allows optional concept / learningSpace / provenance / all fields", () => {
    expect(
      isLearningIntent({
        purpose: "ASSESS",
        source: "EXPLICIT",
        scope: "request",
      }),
    ).toBe(true);

    expect(
      parseLearningIntent({
        purpose: "ASSESS",
        source: "EXPLICIT",
        scope: "request",
        conceptId: "concept-1",
      }),
    ).toMatchObject({ conceptId: "concept-1" });

    expect(
      parseLearningIntent({
        purpose: "CREATE",
        source: "INFERRED",
        scope: "session_hold",
        learningSpaceId: "space-1",
      }),
    ).toMatchObject({ learningSpaceId: "space-1" });

    expect(
      parseLearningIntent({
        purpose: "UNDERSTAND",
        source: "EXPLICIT",
        scope: "activity",
        provenance: "user_utterance",
        conceptId: "c1",
        learningSpaceId: "ls1",
      }),
    ).toEqual({
      purpose: "UNDERSTAND",
      source: "EXPLICIT",
      scope: "activity",
      provenance: "user_utterance",
      conceptId: "c1",
      learningSpaceId: "ls1",
    });
  });

  it("rejects malformed purpose / source / scope / provenance safely", () => {
    expect(
      parseLearningIntent({
        purpose: "LEARN",
        source: "EXPLICIT",
        scope: "request",
      }),
    ).toBeNull();
    expect(
      parseLearningIntent({
        purpose: "REVIEW",
        source: "EXPLICIT",
        scope: "request",
      }),
    ).toBeNull();
    expect(
      parseLearningIntent({
        purpose: "ASSESS",
        source: "EXPLICIT",
        scope: "goal",
      }),
    ).toBeNull();
    expect(
      parseLearningIntent({
        purpose: "ASSESS",
        source: "EXPLICIT",
        scope: "request",
        provenance: "orchestrator",
      }),
    ).toBeNull();
    expect(parseLearningIntent("ASSESS")).toBeNull();
    expect(parseLearningIntent([])).toBeNull();
  });

  it("treats absent intent as null without throwing", () => {
    expect(parseLearningIntent(undefined)).toBeNull();
    expect(parseLearningIntent(null)).toBeNull();
  });

  it("does not invent ASSESS from ambiguous payloads", () => {
    expect(parseLearningIntent({ text: "quiz me" })).toBeNull();
    expect(parseLearningIntent({ purpose: "quiz" })).toBeNull();
  });

  it("documents ASSESS ≠ Quiz and no Orchestrator consumption yet", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toContain("LearningIntent");
    expect(diagnose).not.toContain("parseLearningIntent");
    expect(diagnose).not.toMatch(/purpose:\s*["']ASSESS["']/);

    const intent = parseLearningIntent({
      purpose: "ASSESS",
      source: "EXPLICIT",
      scope: "request",
    });
    expect(intent?.purpose).toBe("ASSESS");
    // Contract only — no activity selection implied
    expect(intent).not.toHaveProperty("activity");
    expect(intent).not.toHaveProperty("quizId");
  });
});

describe("Phase 2G-22 Adaptive launch context + intent", () => {
  it("preserves runId / stepIndex parsing when intent is absent", () => {
    const ctx = parseAdaptiveLaunchContext({
      adaptiveRunId: " run-1 ",
      adaptiveStep: "2",
    });
    expect(ctx.runId).toBe("run-1");
    expect(ctx.stepIndex).toBe(2);
    expect(ctx.intent).toBeNull();

    expect(parseAdaptiveRunId(" run-1 ")).toBe("run-1");
    expect(parseAdaptiveStepIndex(0)).toBe(0);
    expect(parseAdaptiveStepIndex(-1)).toBeNull();
  });

  it("round-trips intent alongside Adaptive fields", () => {
    const ctx = parseAdaptiveLaunchContext({
      adaptiveRunId: "run-9",
      adaptiveStep: 0,
      intent: {
        purpose: "PRACTICE",
        source: "EXPLICIT",
        scope: "activity",
        provenance: "user_selection",
        conceptId: "concept-x",
      },
    });
    expect(ctx).toEqual({
      runId: "run-9",
      stepIndex: 0,
      intent: {
        purpose: "PRACTICE",
        source: "EXPLICIT",
        scope: "activity",
        provenance: "user_selection",
        conceptId: "concept-x",
      },
    });
  });

  it("malformed intent does not break Adaptive context parsing", () => {
    const ctx = parseAdaptiveLaunchContext({
      adaptiveRunId: "run-ok",
      adaptiveStep: 1,
      intent: { purpose: "LEARN", source: "EXPLICIT", scope: "request" },
    });
    expect(ctx.runId).toBe("run-ok");
    expect(ctx.stepIndex).toBe(1);
    expect(ctx.intent).toBeNull();
  });

  it("intent is not used as ownership — adapters still own validation", () => {
    const quiz = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/quiz-adapter.ts"),
      "utf8",
    );
    const bind = readFileSync(
      path.join(process.cwd(), "src/lib/learning/sequence/quiz-submit-bind.ts"),
      "utf8",
    );
    expect(quiz).toContain("resolveOwnedQuizSequenceStep");
    expect(quiz).toContain("QUIZ_NOT_OWNED");
    expect(bind).toContain("not owned");
    expect(quiz).not.toContain("parseLearningIntent");
    expect(bind).not.toContain("parseLearningIntent");
  });
});
