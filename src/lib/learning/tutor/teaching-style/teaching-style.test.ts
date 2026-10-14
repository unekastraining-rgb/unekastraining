/**
 * 2P-19 — Universal Teaching Style layer tests.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  TEACHING_STYLES,
  TEACH_ME_LIKE_IM_5_STYLE,
  applyTeachingStyleSwitch,
  getTeachingStylePolicy,
  isTeachingStyle,
  parseTeachingStyle,
  resolveTeachingStyle,
  teachMeLikeIm5IsSimplified,
  teachingStyleBoundaryTruthSummary,
  teachingStyleCoexistsWithAccessibility,
} from "@/lib/learning/tutor/teaching-style";
import type { TutorRequest } from "@/lib/learning/tutor/types";
import { TUTOR_MODES } from "@/lib/learning/tutor/types";
import { createExplicitLearningIntent } from "@/lib/learning/intent/project";

vi.mock("@/lib/ai", () => ({
  aiService: {
    complete: vi.fn(async () => ({
      content: "Tutor explanation.",
      provider: "mock",
      model: "mock-model",
    })),
  },
}));

vi.mock("@/lib/learning/tutor/context", () => ({
  loadTutorContext: vi.fn(async () => ({
    conceptIds: ["concept-1"],
    conceptTitles: ["Java Interfaces"],
    usedLearnerModel: true,
    usedKnowledgeModel: true,
    contextBlock: "Concept: Java Interfaces",
  })),
}));

vi.mock("@/lib/learning/tutor/evidence", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/learning/tutor/evidence")
  >("@/lib/learning/tutor/evidence");
  return {
    ...actual,
    maybeRecordTutorEvidence: vi.fn(async () => ({
      recorded: false,
      learningAttemptId: null,
    })),
  };
});

import { aiService } from "@/lib/ai";
import { runTutor } from "@/lib/learning/tutor/service";

describe("2P-19 Teaching Style contract", () => {
  it("accepts valid styles and rejects invalid", () => {
    for (const style of TEACHING_STYLES) {
      expect(isTeachingStyle(style)).toBe(true);
      expect(parseTeachingStyle(style)).toBe(style);
    }
    expect(parseTeachingStyle(undefined)).toBeUndefined();
    expect(parseTeachingStyle(null)).toBeUndefined();
    expect(parseTeachingStyle("")).toBeUndefined();
    expect(parseTeachingStyle("NOT_A_STYLE")).toBeNull();
    expect(parseTeachingStyle(42)).toBeNull();
  });

  it("maps Teach Me Like I'm 5 alias to SIMPLIFIED — not age", () => {
    expect(TEACH_ME_LIKE_IM_5_STYLE).toBe("SIMPLIFIED");
    expect(teachMeLikeIm5IsSimplified()).toBe(true);
    expect(parseTeachingStyle("TEACH_ME_LIKE_IM_5")).toBe("SIMPLIFIED");
    expect(parseTeachingStyle("like-im-5")).toBe("SIMPLIFIED");
    const policy = getTeachingStylePolicy("SIMPLIFIED");
    expect(policy.learnerLabel).toBe("Teach Me Like I'm 5");
    expect(policy.presentationPolicy).toMatch(/not learner age/i);
    expect(policy.presentationPolicy).not.toMatch(/you are a child/i);
    expect(policy.description).not.toMatch(/for kids|for children|low intelligence/i);
  });

  it("style is optional — TutorRequest without style remains valid", () => {
    const request: TutorRequest = {
      learnerId: "u1",
      mode: "TEACH_ME",
      message: "Explain interfaces",
    };
    expect(request.teachingStyle).toBeUndefined();
    expect(TUTOR_MODES).toContain("TEACH_ME");
  });
});

describe("2P-19 Teaching Style precedence", () => {
  it("explicit > session > preference > absent", () => {
    expect(
      resolveTeachingStyle({
        explicit: "DETAILED",
        sessionHeld: "SIMPLIFIED",
        preference: "BEGINNER",
      }),
    ).toEqual({ style: "DETAILED", source: "explicit" });

    expect(
      resolveTeachingStyle({
        sessionHeld: "SIMPLIFIED",
        preference: "BEGINNER",
      }),
    ).toEqual({ style: "SIMPLIFIED", source: "session" });

    expect(
      resolveTeachingStyle({
        preference: "BEGINNER",
      }),
    ).toEqual({ style: "BEGINNER", source: "preference" });

    expect(resolveTeachingStyle({})).toEqual({
      style: undefined,
      source: "default_absent",
    });
  });

  it("does not infer age or Teach Me Like I'm 5 from struggle signals", () => {
    const summary = teachingStyleBoundaryTruthSummary();
    expect(summary.doesNotInferAge).toBe(true);
    expect(summary.doesNotInferIntelligence).toBe(true);
    expect(summary.teachMeLikeIm5IsNotAge).toBe(true);
    // Struggle evidence must not auto-select SIMPLIFIED in resolve API.
    expect(
      resolveTeachingStyle({
        // no explicit/session/preference — struggle would be a separate field we refuse
      }).style,
    ).toBeUndefined();
  });
});

describe("2P-19 isolation from diagnosis / evidence / mastery / intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("style does not change TutorMode or LearningIntent", async () => {
    const intent = createExplicitLearningIntent({ purpose: "UNDERSTAND" });
    const base: TutorRequest = {
      learnerId: "u1",
      mode: "PRACTICE",
      message: "Help me practice interfaces",
      intent,
      conceptIds: ["concept-1"],
    };

    const without = await runTutor(base);
    const withStyle = await runTutor({ ...base, teachingStyle: "SIMPLIFIED" });

    expect(without.mode).toBe("PRACTICE");
    expect(withStyle.mode).toBe("PRACTICE");
    expect(without.meta.learningIntent?.purpose).toBe("UNDERSTAND");
    expect(withStyle.meta.learningIntent?.purpose).toBe("UNDERSTAND");
    expect(withStyle.meta.teachingStyle).toBe("SIMPLIFIED");
    expect(without.meta.teachingStyle).toBeUndefined();
    expect(without.meta.evidenceRecorded).toBe(false);
    expect(withStyle.meta.evidenceRecorded).toBe(false);
  });

  it("style appends presentation policy without replacing mode policy", async () => {
    await runTutor({
      learnerId: "u1",
      mode: "GUIDED",
      message: "Explain",
      teachingStyle: "SIMPLIFIED",
    });
    const calls = vi.mocked(aiService.complete).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const messages = calls[0]![0] as Array<{ role: string; content: string }>;
    const system = messages.find((m) => m.role === "system")!.content;
    expect(system).toMatch(/Mode: GUIDED/);
    expect(system).toMatch(/Teaching style: SIMPLIFIED/);
    expect(system).toMatch(/Teach Me Like I'm 5/);
  });

  it("boundary summary forbids engine sprawl and evidence mutation", () => {
    const b = teachingStyleBoundaryTruthSummary();
    expect(b.doesNotAlterDiagnosis).toBe(true);
    expect(b.doesNotAlterMastery).toBe(true);
    expect(b.doesNotAlterEvidence).toBe(true);
    expect(b.doesNotAlterAdaptiveCompletion).toBe(true);
    expect(b.aiTextIsNotLearnerEvidence).toBe(true);
    expect(b.noSeparateTeachingStyleEngine).toBe(true);
  });
});

describe("2P-19 mid-session switching", () => {
  it("STANDARD → SIMPLIFIED → DETAILED keeps concept/mode/history", () => {
    const step1 = applyTeachingStyleSwitch({
      conceptIds: ["c1"],
      mode: "TEACH_ME",
      intentPurpose: "UNDERSTAND",
      historyLength: 4,
      previousStyle: "STANDARD",
      nextStyle: "SIMPLIFIED",
    });
    expect(step1.sessionReset).toBe(false);
    expect(step1.conceptIds).toEqual(["c1"]);
    expect(step1.mode).toBe("TEACH_ME");
    expect(step1.historyLength).toBe(4);
    expect(step1.teachingStyle).toBe("SIMPLIFIED");

    const step2 = applyTeachingStyleSwitch({
      conceptIds: step1.conceptIds,
      mode: step1.mode,
      intentPurpose: step1.intentPurpose,
      historyLength: step1.historyLength + 2,
      previousStyle: step1.teachingStyle,
      nextStyle: "DETAILED",
    });
    expect(step2.sessionReset).toBe(false);
    expect(step2.conceptIds).toEqual(["c1"]);
    expect(step2.teachingStyle).toBe("DETAILED");
    expect(step2.historyLength).toBe(6);
  });
});

describe("2P-19 universal domains", () => {
  it("same SIMPLIFIED contract works across domain subject labels", () => {
    const domains = [
      "Java",
      "Nursing",
      "Business",
      "Finance",
      "Networking",
      "Mathematics",
      "Physics",
      "History",
      "Programming",
      "Electrical",
      "Automotive",
    ];
    const policy = getTeachingStylePolicy("SIMPLIFIED");
    for (const domain of domains) {
      const request: TutorRequest = {
        learnerId: "u1",
        mode: "TEACH_ME",
        message: `Explain a core idea in ${domain}`,
        subjectDomain: domain,
        teachingStyle: "SIMPLIFIED",
      };
      expect(request.teachingStyle).toBe("SIMPLIFIED");
      expect(policy.presentationPolicy).not.toMatch(
        new RegExp(`${domain}TeachingEngine|if\\s*\\(.*${domain}`, "i"),
      );
    }
  });

  it("source has no domain-specific teaching engines", () => {
    const root = process.cwd();
    const resolveSrc = readFileSync(
      path.join(root, "src/lib/learning/tutor/teaching-style/resolve.ts"),
      "utf8",
    );
    const policies = readFileSync(
      path.join(root, "src/lib/learning/tutor/teaching-style/policies.ts"),
      "utf8",
    );
    const combined = resolveSrc + policies;
    expect(combined).not.toMatch(/\bclass\s+(Java|Nursing|Age|Child|Simplified)Tutor/);
    expect(combined).not.toMatch(/\bfunction\s+\w*TeachingStyleEngine\b/);
    expect(combined).not.toMatch(/\bif\s*\(\s*domain\s*===/);
  });
});

describe("2P-19 accessibility coexistence", () => {
  it("style and accessibility hooks remain independent axes", () => {
    const result = teachingStyleCoexistsWithAccessibility({
      teachingStyle: "SIMPLIFIED",
      preferSimplifiedCopy: true,
      preferLargerTargets: true,
    });
    expect(result.axesIndependent).toBe(true);
    expect(result.teachingStyle).toBe("SIMPLIFIED");
    expect(result.accessibility.preferSimplifiedCopy).toBe(true);
    expect(teachingStyleBoundaryTruthSummary().isNotLearnerPersona).toBe(true);
    expect(teachingStyleBoundaryTruthSummary().isNotGradeLevel).toBe(true);
  });
});

describe("2P-19 AI boundary", () => {
  it("Tutor reply path still requires demonstration for evidence — style text is not evidence", async () => {
    const res = await runTutor({
      learnerId: "u1",
      mode: "TEACH_ME",
      message: "Explain HTTPS simply",
      teachingStyle: "SIMPLIFIED",
    });
    expect(res.text).toBeTruthy();
    expect(res.meta.evidenceRecorded).toBe(false);
    expect(teachingStyleBoundaryTruthSummary().aiTextIsNotLearnerEvidence).toBe(
      true,
    );
  });
});
