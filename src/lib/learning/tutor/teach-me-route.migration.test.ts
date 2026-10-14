import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const mockRunTutor = vi.hoisted(() => vi.fn());
const mockAiComplete = vi.hoisted(() => vi.fn());
const mockIsTeachMeUnifiedEnabled = vi.hoisted(() => vi.fn());
const mockToTutorRequestFromTeachMe = vi.hoisted(() => vi.fn());
const mockGetOrCreateDefaultUser = vi.hoisted(() => vi.fn());
const mockGetUserAppSettings = vi.hoisted(() => vi.fn());
const mockIsAIConfigured = vi.hoisted(() => vi.fn());
const mockLoadChapter = vi.hoisted(() => vi.fn());
const mockLoadMaterial = vi.hoisted(() => vi.fn());
const mockLoadCourse = vi.hoisted(() => vi.fn());
const mockUpdateTopicMastery = vi.hoisted(() => vi.fn());
const mockRecordStudyEvaluateEvidence = vi.hoisted(() => vi.fn());
const mockCreateStudySession = vi.hoisted(() => vi.fn());
const mockEvaluateOffline = vi.hoisted(() => vi.fn());
const mockTopicFindFirst = vi.hoisted(() => vi.fn());
const mockGetOrCreateDefaultTopic = vi.hoisted(() => vi.fn());
const mockAiSourceInstruction = vi.hoisted(() => vi.fn());

vi.mock("@/lib/learning/tutor/service", () => ({
  runTutor: mockRunTutor,
  TutorRequestError: class TutorRequestError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TutorRequestError";
    }
  },
}));

vi.mock("@/lib/learning/tutor/teach-me-feature-flag", () => ({
  isTeachMeUnifiedEnabled: mockIsTeachMeUnifiedEnabled,
}));

vi.mock("@/lib/learning/tutor/teach-me-adapter", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/learning/tutor/teach-me-adapter")
  >("@/lib/learning/tutor/teach-me-adapter");
  return {
    ...actual,
    toTutorRequestFromTeachMe: mockToTutorRequestFromTeachMe,
  };
});

vi.mock("@/lib/ai", () => ({
  aiService: { complete: mockAiComplete },
  isAIConfigured: mockIsAIConfigured,
}));

vi.mock("@/lib/ai/course-source", () => ({
  loadChapterStudySourceText: mockLoadChapter,
  loadMaterialSourceText: mockLoadMaterial,
  loadCourseSourceText: mockLoadCourse,
}));

vi.mock("@/lib/user", () => ({
  getOrCreateDefaultUser: mockGetOrCreateDefaultUser,
}));

vi.mock("@/lib/settings/app-settings", () => ({
  getUserAppSettings: mockGetUserAppSettings,
  defaultCourseMaterialsOnly: () => true,
  aiSourceInstruction: mockAiSourceInstruction,
}));

vi.mock("@/lib/quizzes/mastery", () => ({
  updateTopicMastery: mockUpdateTopicMastery,
}));

vi.mock("@/lib/learning/assessment/evaluate-bridge", () => ({
  recordStudyEvaluateEvidence: mockRecordStudyEvaluateEvidence,
}));

vi.mock("@/lib/csl/study-sessions", () => ({
  createStudySession: mockCreateStudySession,
}));

vi.mock("@/lib/study/offline-evaluate", () => ({
  evaluateOfflineAgainstOutline: mockEvaluateOffline,
}));

vi.mock("@/lib/topics", () => ({
  getOrCreateDefaultTopic: mockGetOrCreateDefaultTopic,
}));

vi.mock("@/lib/db", () => ({
  db: {
    topic: { findFirst: mockTopicFindFirst },
  },
}));

vi.mock("@/generated/prisma", () => ({
  StudyActivityType: {
    BLURTING: "BLURTING",
    TEACH_BACK: "TEACH_BACK",
    SIX: "SIX",
  },
}));

import { POST } from "../../../../app/api/study/evaluate/route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/study/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const sampleEval = {
  score: 75,
  summary: "Good teach-back",
  strengths: ["clear"],
  gaps: ["depth"],
  misconceptions: [],
  nextSteps: ["add example"],
};

describe("Teach Me evaluate route — feature-flagged Unified Tutor path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultUser.mockResolvedValue({ id: "user-1" });
    mockGetUserAppSettings.mockResolvedValue({
      aiUseOpenAIPro: false,
      aiSourceMode: "balanced",
    });
    mockAiSourceInstruction.mockReturnValue("Prefer course materials.");
    mockIsAIConfigured.mockReturnValue(true);
    mockIsTeachMeUnifiedEnabled.mockReturnValue(false);
    mockLoadChapter.mockResolvedValue(null);
    mockLoadMaterial.mockResolvedValue(null);
    mockLoadCourse.mockResolvedValue({
      text: "Inheritance is…",
      courseTitle: "CS101",
    });
    mockTopicFindFirst.mockResolvedValue({ id: "topic-1" });
    mockGetOrCreateDefaultTopic.mockResolvedValue({ id: "topic-default" });
    mockUpdateTopicMastery.mockResolvedValue(undefined);
    mockRecordStudyEvaluateEvidence.mockResolvedValue(undefined);
    mockCreateStudySession.mockResolvedValue(undefined);
    mockEvaluateOffline.mockReturnValue(sampleEval);
    mockAiComplete.mockResolvedValue({
      content: JSON.stringify({ ...sampleEval, summary: "Legacy AI eval" }),
      model: "test",
      provider: "gemini",
    });
    mockRunTutor.mockResolvedValue({
      text: JSON.stringify({ ...sampleEval, summary: "Unified Tutor eval" }),
      mode: "TEACH_ME",
      conceptTitles: [],
      meta: {
        usedLearnerModel: false,
        usedKnowledgeModel: false,
        conceptIds: [],
        evidenceRecorded: false,
      },
    });
    mockToTutorRequestFromTeachMe.mockResolvedValue({
      learnerId: "user-1",
      mode: "TEACH_ME",
      message: "payload",
      evidenceIntent: "none",
      instructionalContext: "Feynman…",
      temperature: 0.2,
      maxTokens: 2048,
      jsonMode: true,
    });
  });

  it("OFF: teach-me uses legacy aiService.complete only", async () => {
    mockIsTeachMeUnifiedEnabled.mockReturnValue(false);

    const res = await POST(
      jsonRequest({
        mode: "teach-me",
        courseId: "course-1",
        topic: "Inheritance",
        userResponse: "Inheritance means…",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.summary).toBe("Legacy AI eval");
    expect(mockAiComplete).toHaveBeenCalledTimes(1);
    expect(mockRunTutor).not.toHaveBeenCalled();
    expect(mockRecordStudyEvaluateEvidence).toHaveBeenCalled();
  });

  it("ON: teach-me routes AI through Unified Tutor; evidence stays on evaluate bridge", async () => {
    mockIsTeachMeUnifiedEnabled.mockReturnValue(true);

    const res = await POST(
      jsonRequest({
        mode: "teach-me",
        courseId: "course-1",
        topic: "Inheritance",
        userResponse: "Inheritance means…",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.summary).toBe("Unified Tutor eval");
    expect(data.data.score).toBe(75);
    expect(mockToTutorRequestFromTeachMe).toHaveBeenCalled();
    expect(mockRunTutor).toHaveBeenCalledTimes(1);
    expect(mockAiComplete).not.toHaveBeenCalled();
    expect(mockRecordStudyEvaluateEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "teach-me",
        scoreRatio: 0.75,
      }),
    );
  });

  it("ON does not affect blurting path", async () => {
    mockIsTeachMeUnifiedEnabled.mockReturnValue(true);

    const res = await POST(
      jsonRequest({
        mode: "blurting",
        courseId: "course-1",
        topic: "Inheritance",
        userResponse: "I recall…",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockRunTutor).not.toHaveBeenCalled();
    expect(mockAiComplete).toHaveBeenCalledTimes(1);
  });

  it("ON + adapter failure: falls back to legacy AI without prior Tutor AI", async () => {
    mockIsTeachMeUnifiedEnabled.mockReturnValue(true);
    const { TeachMeAdapterError } = await import(
      "@/lib/learning/tutor/teach-me-adapter"
    );
    mockToTutorRequestFromTeachMe.mockRejectedValue(
      new TeachMeAdapterError("bad adapt"),
    );

    const res = await POST(
      jsonRequest({
        mode: "teach-me",
        courseId: "course-1",
        topic: "Inheritance",
        userResponse: "Inheritance means…",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.summary).toBe("Legacy AI eval");
    expect(mockRunTutor).not.toHaveBeenCalled();
    expect(mockAiComplete).toHaveBeenCalledTimes(1);
  });

  it("ON + Unified AI failure: offline scorer, no legacy AI retry", async () => {
    mockIsTeachMeUnifiedEnabled.mockReturnValue(true);
    mockRunTutor.mockRejectedValue(new Error("provider exhausted"));

    const res = await POST(
      jsonRequest({
        mode: "teach-me",
        courseId: "course-1",
        topic: "Inheritance",
        userResponse: "Inheritance means…",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockEvaluateOffline).toHaveBeenCalled();
    expect(mockAiComplete).not.toHaveBeenCalled();
    expect(mockRunTutor).toHaveBeenCalledTimes(1);
  });
});

describe("Phase 2D-4 preservation — Teach Me UI and other surfaces", () => {
  const root = path.resolve(__dirname, "../../../..");

  function read(rel: string): string {
    return readFileSync(path.join(root, rel), "utf8");
  }

  it("does not change Teach Me / GuidedStudyActivity UI contract", () => {
    const ui = read("src/components/study/GuidedStudyActivity.tsx");
    expect(ui).toMatch(/fetch\("\/api\/study\/evaluate"/);
    expect(ui).toMatch(/data\.data/);
    expect(ui).not.toMatch(/runTutor|STUDY_HAUL_TEACH_ME_UNIFIED/);
    const client = read("app/study/teach-me/teach-me-client.tsx");
    expect(client).toMatch(/mode="teach-me"/);
  });

  it("keeps legacy AI path for flag OFF and leaves blurting/six prompts", () => {
    const route = read("app/api/study/evaluate/route.ts");
    expect(route).toMatch(/isTeachMeUnifiedEnabled/);
    expect(route).toMatch(/runTutor/);
    expect(route).toMatch(/You evaluate blurting study sessions/);
    expect(route).toMatch(/recordStudyEvaluateEvidence/);
  });

  it("does not migrate Hub Chat / Writing / Voice in this phase", () => {
    expect(read("app/api/core/chat/route.ts")).not.toMatch(
      /isTeachMeUnifiedEnabled|toTutorRequestFromTeachMe/,
    );
    expect(read("app/api/study/six-tutor/route.ts")).not.toMatch(
      /isTeachMeUnifiedEnabled|toTutorRequestFromTeachMe/,
    );
  });
});
