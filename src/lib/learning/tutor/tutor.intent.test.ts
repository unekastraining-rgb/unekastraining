/**
 * Phase 2G-24 — Tutor LearningIntent capture & propagation.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import {
  getTutorModePolicy,
  resolveTutorLearningIntent,
  shouldRecordTutorEvidence,
  withResolvedTutorLearningIntent,
  type TutorRequest,
} from "@/lib/learning/tutor";
import { runTutor } from "@/lib/learning/tutor/service";

vi.mock("@/lib/ai", () => ({
  aiService: {
    complete: vi.fn(async () => ({
      content: "Tutor reply for intent tests.",
      provider: "mock",
      model: "mock-model",
    })),
  },
}));

vi.mock("@/lib/learning/tutor/context", () => ({
  loadTutorContext: vi.fn(async () => ({
    conceptIds: ["concept-1"],
    conceptTitles: ["Exceptions"],
    usedLearnerModel: false,
    usedKnowledgeModel: false,
    contextBlock: "Mock context",
  })),
}));

vi.mock("@/lib/learning/tutor/evidence", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/learning/tutor/evidence")
  >("@/lib/learning/tutor/evidence");
  return {
    ...actual,
    maybeRecordTutorEvidence: vi.fn(async () => ({
      learningAttemptId: null,
      recorded: false,
    })),
  };
});

function baseRequest(
  partial: Partial<TutorRequest> & Pick<TutorRequest, "mode">,
): TutorRequest {
  return {
    learnerId: "learner-1",
    message: "Help me with this concept.",
    evidenceIntent: "none",
    ...partial,
  };
}

describe("Phase 2G-24 Tutor LearningIntent resolution", () => {
  it("1. Explicit assessment via modeLearnerSelected + EXAM", () => {
    const intent = resolveTutorLearningIntent(
      baseRequest({ mode: "EXAM", modeLearnerSelected: true }),
    );
    expect(intent).toEqual({
      purpose: "ASSESS",
      source: "EXPLICIT",
      provenance: "user_selection",
      scope: "request",
    });
  });

  it("2. Inferred assessment from TutorMode.EXAM without selection", () => {
    const intent = resolveTutorLearningIntent(baseRequest({ mode: "EXAM" }));
    expect(intent).toMatchObject({
      purpose: "ASSESS",
      source: "INFERRED",
      provenance: "tutor_mode",
      scope: "request",
    });
  });

  it("3. PRACTICE projects to PRACTICE (INFERRED)", () => {
    expect(
      resolveTutorLearningIntent(baseRequest({ mode: "PRACTICE" })),
    ).toMatchObject({
      purpose: "PRACTICE",
      source: "INFERRED",
      provenance: "tutor_mode",
    });
  });

  it("4. Ambiguous Tutor modes produce null", () => {
    for (const mode of [
      "BEGINNER",
      "TEACH_ME",
      "SOCRATIC",
      "GUIDED",
      "CHALLENGE",
      "ADVANCED",
    ] as const) {
      expect(resolveTutorLearningIntent(baseRequest({ mode }))).toBeNull();
    }
  });

  it("5. Existing requests with no intent still resolve safely", () => {
    const req = baseRequest({ mode: "GUIDED" });
    expect(req.intent).toBeUndefined();
    const resolved = withResolvedTutorLearningIntent(req);
    expect(resolved.intent).toBeNull();
    expect(resolved.mode).toBe("GUIDED");
    expect(resolved.message).toBe(req.message);
  });

  it("5b. Explicit opt-out intent:null stays null even for EXAM", () => {
    expect(
      resolveTutorLearningIntent(
        baseRequest({ mode: "EXAM", intent: null }),
      ),
    ).toBeNull();
  });

  it("5c. Caller-supplied EXPLICIT ASSESS is preserved", () => {
    const supplied = createExplicitLearningIntent({
      purpose: "ASSESS",
      provenance: "user_selection",
      scope: "request",
    });
    expect(
      resolveTutorLearningIntent(
        baseRequest({ mode: "GUIDED", intent: supplied }),
      ),
    ).toEqual(supplied);
  });

  it("6. TutorEvidenceIntent behavior unchanged", () => {
    expect(shouldRecordTutorEvidence("none")).toBe(false);
    expect(shouldRecordTutorEvidence("practice_answer")).toBe(true);
    expect(shouldRecordTutorEvidence("explain")).toBe(true);
    const evidence = readFileSync(
      path.join(process.cwd(), "src/lib/learning/tutor/evidence.ts"),
      "utf8",
    );
    expect(evidence).not.toContain("LearningIntent");
    expect(evidence).not.toContain("resolveTutorLearningIntent");
  });

  it("7. Intent does not change TutorMode/policy selection", () => {
    const examPolicy = getTutorModePolicy("EXAM");
    const withIntent = withResolvedTutorLearningIntent(
      baseRequest({ mode: "EXAM", modeLearnerSelected: true }),
    );
    expect(withIntent.mode).toBe("EXAM");
    expect(getTutorModePolicy(withIntent.mode)).toEqual(examPolicy);
    expect(withIntent.intent?.purpose).toBe("ASSESS");
  });

  it("8. Intent is not written into evidence / history persistence paths", () => {
    const service = readFileSync(
      path.join(process.cwd(), "src/lib/learning/tutor/service.ts"),
      "utf8",
    );
    expect(service).toContain("learningIntent: resolved.intent");
    expect(service).not.toMatch(
      /maybeRecordTutorEvidence\([\s\S]*intent:/,
    );
    expect(service).not.toMatch(/history\.push.*intent|intent.*history/);
  });

  it("9. Orchestrator diagnose does not import LearningIntent for diagnosis", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toMatch(/import\s+.*LearningIntent/);
    expect(diagnose).not.toContain("resolveTutorLearningIntent");
  });

  it("10. Intent does not affect authorization — learnerId stays session-bound", () => {
    const route = readFileSync(
      path.join(process.cwd(), "app/api/study/tutor/route.ts"),
      "utf8",
    );
    expect(route).toContain("learnerId: user.id");
    expect(route).toMatch(/Ignored if present — ownership is session-bound/);
    expect(route).toContain("parseLearningIntent");
  });
});

describe("Phase 2G-24 runTutor carries intent in meta only", () => {
  it("echoes inferred ASSESS for EXAM without changing reply mode", async () => {
    const response = await runTutor(
      baseRequest({ mode: "EXAM", message: "Assess my answer." }),
    );
    expect(response.mode).toBe("EXAM");
    expect(response.meta.learningIntent).toMatchObject({
      purpose: "ASSESS",
      source: "INFERRED",
      provenance: "tutor_mode",
    });
    expect(response.text).toBe("Tutor reply for intent tests.");
  });

  it("leaves learningIntent null for GUIDED", async () => {
    const response = await runTutor(baseRequest({ mode: "GUIDED" }));
    expect(response.meta.learningIntent).toBeNull();
  });

  it("does not invent CREATE from Tutor text generation", () => {
    expect(
      resolveTutorLearningIntent(baseRequest({ mode: "TEACH_ME" })),
    ).toBeNull();
  });
});
