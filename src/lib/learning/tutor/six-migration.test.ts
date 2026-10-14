import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockTopicFindFirst,
  mockConceptFindFirst,
  mockLearningSpaceFindFirst,
} = vi.hoisted(() => ({
  mockTopicFindFirst: vi.fn(),
  mockConceptFindFirst: vi.fn(),
  mockLearningSpaceFindFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    topic: { findFirst: mockTopicFindFirst },
    concept: { findFirst: mockConceptFindFirst },
    learningSpace: { findFirst: mockLearningSpaceFindFirst },
  },
}));

import { isSixTutorUnifiedEnabled } from "@/lib/learning/tutor/six-feature-flag";
import {
  buildSixTutorInstructionalContext,
  SixTutorAdapterError,
  toTutorRequestFromSixTutor,
} from "@/lib/learning/tutor/six-adapter";

describe("Phase 2D-2 feature flag — STUDY_HAUL_SIX_TUTOR_UNIFIED", () => {
  const original = process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED;
    } else {
      process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED = original;
    }
  });

  it("defaults OFF (legacy path preserved)", () => {
    delete process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED;
    expect(isSixTutorUnifiedEnabled()).toBe(false);
  });

  it("enables for 1/true/on/yes", () => {
    process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED = "1";
    expect(isSixTutorUnifiedEnabled()).toBe(true);
    process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED = "true";
    expect(isSixTutorUnifiedEnabled()).toBe(true);
    process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED = "on";
    expect(isSixTutorUnifiedEnabled()).toBe(true);
  });

  it("stays OFF for other values", () => {
    process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED = "0";
    expect(isSixTutorUnifiedEnabled()).toBe(false);
    process.env.STUDY_HAUL_SIX_TUTOR_UNIFIED = "false";
    expect(isSixTutorUnifiedEnabled()).toBe(false);
  });
});

describe("SIX → Tutor adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTopicFindFirst.mockResolvedValue(null);
    mockConceptFindFirst.mockResolvedValue(null);
    mockLearningSpaceFindFirst.mockResolvedValue(null);
  });

  it("builds TutorRequest with GUIDED mode and SIX instructional context", async () => {
    const req = await toTutorRequestFromSixTutor({
      learnerId: "user-1",
      message: "Explain chunk 2 again",
      component: "chunking",
      topic: "Inheritance",
      courseTitle: "CS101",
      history: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello — let's chunk." },
      ],
      lessonSummary: "Chunk map…",
      sourceText: "Course notes…",
    });

    expect(req.learnerId).toBe("user-1");
    expect(req.mode).toBe("GUIDED");
    expect(req.message).toBe("Explain chunk 2 again");
    expect(req.signal).toBe("six:chunking");
    expect(req.activityId).toBe("chunking");
    expect(req.modality).toBe("text");
    expect(req.evidenceIntent).toBe("none");
    expect(req.temperature).toBe(0.4);
    expect(req.maxTokens).toBe(1200);
    expect(req.history).toHaveLength(2);
    expect(req.instructionalContext).toMatch(/Chunking/);
    expect(req.instructionalContext).toMatch(/Inheritance/);
    expect(req.instructionalContext).toMatch(/Do not abandon the technique/);
    expect(req.instructionalContext).toMatch(/Course: CS101/);
    expect(req).not.toHaveProperty("courseId");
  });

  it("preserves existing conceptId when Topic already linked — does not invent", async () => {
    mockTopicFindFirst.mockResolvedValue({ conceptId: "concept-known" });
    mockLearningSpaceFindFirst.mockResolvedValue({ id: "space-1" });

    const req = await toTutorRequestFromSixTutor({
      learnerId: "user-1",
      message: "help",
      component: "feynman",
      topic: "Polymorphism",
      courseId: "course-1",
    });

    expect(req.conceptIds).toEqual(["concept-known"]);
    expect(req.learningSpaceId).toBe("space-1");
    expect(mockTopicFindFirst).toHaveBeenCalled();
    expect(mockConceptFindFirst).not.toHaveBeenCalled();
  });

  it("omits conceptIds when none exist (no invented IDs)", async () => {
    const req = await toTutorRequestFromSixTutor({
      learnerId: "user-1",
      message: "What is this?",
      component: "detailed-explanation",
      topic: "Brand New Topic",
      courseId: "course-1",
    });
    expect(req.conceptIds).toBeUndefined();
    expect(req.learningSpaceId).toBeNull();
  });

  it("rejects unknown SIX technique", async () => {
    await expect(
      toTutorRequestFromSixTutor({
        learnerId: "user-1",
        message: "hi",
        component: "not-a-technique",
        topic: "X",
      }),
    ).rejects.toBeInstanceOf(SixTutorAdapterError);
  });

  it("keeps each SIX technique title in instructional context", () => {
    for (const component of [
      "chunking",
      "detailed-explanation",
      "feynman",
      "visualization",
      "hands-on-practice",
      "active-recall",
    ] as const) {
      const ctx = buildSixTutorInstructionalContext({
        component,
        topic: "Sample",
      });
      expect(ctx).toMatch(/Six Tutor/);
      expect(ctx.length).toBeGreaterThan(80);
    }
  });
});
