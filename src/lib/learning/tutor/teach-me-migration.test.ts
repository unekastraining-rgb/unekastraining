import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockTopicFindFirst,
  mockLearningSpaceFindFirst,
} = vi.hoisted(() => ({
  mockTopicFindFirst: vi.fn(),
  mockLearningSpaceFindFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    topic: { findFirst: mockTopicFindFirst },
    learningSpace: { findFirst: mockLearningSpaceFindFirst },
  },
}));

import { isTeachMeUnifiedEnabled } from "@/lib/learning/tutor/teach-me-feature-flag";
import {
  buildTeachMeInstructionalContext,
  buildTeachMeUserPayload,
  parseTeachMeEvaluation,
  TeachMeAdapterError,
  toTutorRequestFromTeachMe,
} from "@/lib/learning/tutor/teach-me-adapter";

describe("Phase 2D-4 feature flag — STUDY_HAUL_TEACH_ME_UNIFIED", () => {
  const original = process.env.STUDY_HAUL_TEACH_ME_UNIFIED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_TEACH_ME_UNIFIED;
    } else {
      process.env.STUDY_HAUL_TEACH_ME_UNIFIED = original;
    }
  });

  it("defaults OFF (legacy Teach Me preserved)", () => {
    delete process.env.STUDY_HAUL_TEACH_ME_UNIFIED;
    expect(isTeachMeUnifiedEnabled()).toBe(false);
  });

  it("enables for 1/true/on/yes", () => {
    process.env.STUDY_HAUL_TEACH_ME_UNIFIED = "1";
    expect(isTeachMeUnifiedEnabled()).toBe(true);
    process.env.STUDY_HAUL_TEACH_ME_UNIFIED = "true";
    expect(isTeachMeUnifiedEnabled()).toBe(true);
  });

  it("stays OFF for other values", () => {
    process.env.STUDY_HAUL_TEACH_ME_UNIFIED = "0";
    expect(isTeachMeUnifiedEnabled()).toBe(false);
  });
});

describe("Teach Me → Tutor adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTopicFindFirst.mockResolvedValue(null);
    mockLearningSpaceFindFirst.mockResolvedValue(null);
  });

  it("uses TEACH_ME mode with Feynman evaluate context and evidenceIntent none", async () => {
    const req = await toTutorRequestFromTeachMe({
      learnerId: "user-1",
      userResponse: "Inheritance lets a subclass reuse a superclass.",
      topic: "Inheritance",
      courseId: "course-1",
      sourceBlock: "Course: CS101\nMaterial:\nInheritance…",
      sourceModeInstruction: "Prefer course materials.",
    });

    expect(req.learnerId).toBe("user-1");
    expect(req.mode).toBe("TEACH_ME");
    expect(req.evidenceIntent).toBe("none");
    expect(req.signal).toBe("teach_me:evaluate");
    expect(req.temperature).toBe(0.2);
    expect(req.jsonMode).toBe(true);
    expect(req.instructionalContext).toMatch(/Feynman teach-back/);
    expect(req.message).toMatch(/STUDENT EXPLANATION/);
    expect(req.message).toMatch(/Inheritance lets a subclass/);
    expect(req.message).toMatch(/REFERENCE MATERIAL/);
    expect(req.learnerDemonstration).toBeUndefined();
    expect(req.conceptIds).toBeUndefined();
    expect(req.history).toBeUndefined();
  });

  it("preserves existing conceptId when Topic already linked — does not invent", async () => {
    mockTopicFindFirst.mockResolvedValue({ conceptId: "concept-known" });
    mockLearningSpaceFindFirst.mockResolvedValue({ id: "space-1" });

    const req = await toTutorRequestFromTeachMe({
      learnerId: "user-1",
      userResponse: "My explanation…",
      topic: "Polymorphism",
      courseId: "course-1",
      sourceBlock: "",
      sourceModeInstruction: "x",
    });

    expect(req.conceptIds).toEqual(["concept-known"]);
    expect(req.learningSpaceId).toBe("space-1");
  });

  it("rejects empty userResponse", async () => {
    await expect(
      toTutorRequestFromTeachMe({
        learnerId: "user-1",
        userResponse: "  ",
        sourceBlock: "",
        sourceModeInstruction: "x",
      }),
    ).rejects.toBeInstanceOf(TeachMeAdapterError);
  });

  it("parses evaluation JSON shape", () => {
    const parsed = parseTeachMeEvaluation(
      JSON.stringify({
        score: 82,
        summary: "Solid teach-back",
        strengths: ["clear definition"],
        gaps: ["missed polymorphism"],
        misconceptions: [],
        nextSteps: ["add an example"],
      }),
    );
    expect(parsed.score).toBe(82);
    expect(parsed.gaps).toEqual(["missed polymorphism"]);
  });

  it("builds instructional context and user payload like legacy", () => {
    expect(buildTeachMeInstructionalContext()).toMatch(/Respond JSON only/);
    const payload = buildTeachMeUserPayload({
      topic: "Trees",
      sourceBlock: "REF",
      userResponse: "A tree is…",
      sourceModeInstruction: "inst",
    });
    expect(payload).toMatch(/Topic: Trees/);
    expect(payload).toMatch(/STUDENT EXPLANATION/);
  });
});
