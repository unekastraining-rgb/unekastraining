import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockLearningSpaceFindFirst } = vi.hoisted(() => ({
  mockLearningSpaceFindFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learningSpace: { findFirst: mockLearningSpaceFindFirst },
  },
}));

import { isCoreAssistUnifiedEnabled } from "@/lib/learning/tutor/core-feature-flag";
import {
  buildCoreAssistInstructionalContext,
  buildCoreAssistUserPayload,
  CoreAssistAdapterError,
  parseCoreAssistChatResponse,
  toTutorRequestFromCoreAssist,
} from "@/lib/learning/tutor/core-adapter";

describe("Phase 2D-3 feature flag — STUDY_HAUL_CORE_ASSIST_UNIFIED", () => {
  const original = process.env.STUDY_HAUL_CORE_ASSIST_UNIFIED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_CORE_ASSIST_UNIFIED;
    } else {
      process.env.STUDY_HAUL_CORE_ASSIST_UNIFIED = original;
    }
  });

  it("defaults OFF (legacy CORE Assist preserved)", () => {
    delete process.env.STUDY_HAUL_CORE_ASSIST_UNIFIED;
    expect(isCoreAssistUnifiedEnabled()).toBe(false);
  });

  it("enables for 1/true/on/yes", () => {
    process.env.STUDY_HAUL_CORE_ASSIST_UNIFIED = "1";
    expect(isCoreAssistUnifiedEnabled()).toBe(true);
    process.env.STUDY_HAUL_CORE_ASSIST_UNIFIED = "true";
    expect(isCoreAssistUnifiedEnabled()).toBe(true);
    process.env.STUDY_HAUL_CORE_ASSIST_UNIFIED = "on";
    expect(isCoreAssistUnifiedEnabled()).toBe(true);
  });

  it("stays OFF for other values", () => {
    process.env.STUDY_HAUL_CORE_ASSIST_UNIFIED = "0";
    expect(isCoreAssistUnifiedEnabled()).toBe(false);
  });
});

describe("CORE → Tutor adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLearningSpaceFindFirst.mockResolvedValue(null);
  });

  it("uses TEACH_ME mode with CORE instructional context and evidenceIntent none", async () => {
    const req = await toTutorRequestFromCoreAssist({
      learnerId: "user-1",
      message: "What is polymorphism?",
      courseId: "course-1",
      history: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" },
      ],
      courseTitle: "CS101",
      rawSourceBlock: "Polymorphism means many forms…",
      studyBlock: "",
      aiSourceInstruction: "Prefer primary sources.",
    });

    expect(req.learnerId).toBe("user-1");
    expect(req.mode).toBe("TEACH_ME");
    expect(req.evidenceIntent).toBe("none");
    expect(req.signal).toBe("core:source_chat");
    expect(req.temperature).toBe(0.2);
    expect(req.maxTokens).toBe(2048);
    expect(req.jsonMode).toBe(true);
    expect(req.instructionalContext).toMatch(/source-grounded study assistant/i);
    expect(req.instructionalContext).toMatch(/NotebookLM|Cite short excerpts/i);
    expect(req.message).toMatch(/STUDENT QUESTION:\nWhat is polymorphism\?/);
    expect(req.message).toMatch(/PRIOR CHAT:/);
    expect(req.message).toMatch(/SOURCE MATERIAL:/);
    expect(req.history).toBeUndefined();
    expect(req.conceptIds).toBeUndefined();
  });

  it("preserves study-extract instructional rules when extract is present", async () => {
    const req = await toTutorRequestFromCoreAssist({
      learnerId: "user-1",
      message: "Quiz me",
      rawSourceBlock: "raw…",
      studyBlock: "EXTRACT: concept A",
      aiSourceInstruction: "mode",
    });
    expect(req.instructionalContext).toMatch(/Prefer the STUDY EXTRACT/);
    expect(req.message).toMatch(/STUDY EXTRACT/);
  });

  it("maps existing learningSpace when present — does not invent concepts", async () => {
    mockLearningSpaceFindFirst.mockResolvedValue({ id: "space-core" });
    const req = await toTutorRequestFromCoreAssist({
      learnerId: "user-1",
      message: "Explain this",
      courseId: "course-1",
      rawSourceBlock: "notes",
      studyBlock: "",
      aiSourceInstruction: "x",
    });
    expect(req.learningSpaceId).toBe("space-core");
    expect(req.conceptIds).toBeUndefined();
  });

  it("rejects empty message / missing source", async () => {
    await expect(
      toTutorRequestFromCoreAssist({
        learnerId: "user-1",
        message: "  ",
        rawSourceBlock: "x",
        studyBlock: "",
        aiSourceInstruction: "x",
      }),
    ).rejects.toBeInstanceOf(CoreAssistAdapterError);

    await expect(
      toTutorRequestFromCoreAssist({
        learnerId: "user-1",
        message: "hi",
        rawSourceBlock: "",
        studyBlock: "",
        aiSourceInstruction: "x",
      }),
    ).rejects.toBeInstanceOf(CoreAssistAdapterError);
  });

  it("parses CORE JSON reply shape", () => {
    const parsed = parseCoreAssistChatResponse(
      '```json\n{"answer":"Hello","citations":[{"label":"p1","excerpt":"quote"}]}\n```',
    );
    expect(parsed.answer).toBe("Hello");
    expect(parsed.citations).toEqual([{ label: "p1", excerpt: "quote" }]);
  });

  it("builds user payload with last-6 history like legacy", () => {
    const history = Array.from({ length: 8 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `turn-${i}`,
    }));
    const payload = buildCoreAssistUserPayload({
      message: "Q",
      courseTitle: "Notebook",
      aiSourceInstruction: "inst",
      studyBlock: "",
      rawSourceBlock: "src",
      history,
    });
    expect(payload).toMatch(/turn-2/);
    expect(payload).toMatch(/turn-7/);
    expect(payload).not.toMatch(/turn-0/);
    expect(payload).not.toMatch(/turn-1/);
  });

  it("documents TEACH_ME as the selected existing mode", () => {
    const withExtract = buildCoreAssistInstructionalContext({
      hasStudyExtract: true,
    });
    expect(withExtract).toMatch(/study assistant/);
    // Mode choice: TEACH_ME — CORE Assist explains/answers from source, not SIX coaching.
  });
});
