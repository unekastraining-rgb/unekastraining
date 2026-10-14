import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const mockRunTutor = vi.hoisted(() => vi.fn());
const mockAiComplete = vi.hoisted(() => vi.fn());
const mockIsCoreAssistUnifiedEnabled = vi.hoisted(() => vi.fn());
const mockToTutorRequestFromCoreAssist = vi.hoisted(() => vi.fn());
const mockRequireUser = vi.hoisted(() => vi.fn());
const mockGetUserAppSettings = vi.hoisted(() => vi.fn());
const mockLoadMaterial = vi.hoisted(() => vi.fn());
const mockLoadCourse = vi.hoisted(() => vi.fn());
const mockLoadPersisted = vi.hoisted(() => vi.fn());
const mockReadExtract = vi.hoisted(() => vi.fn());
const mockFormatExtract = vi.hoisted(() => vi.fn());
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

vi.mock("@/lib/learning/tutor/core-feature-flag", () => ({
  isCoreAssistUnifiedEnabled: mockIsCoreAssistUnifiedEnabled,
}));

vi.mock("@/lib/learning/tutor/core-adapter", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/learning/tutor/core-adapter")
  >("@/lib/learning/tutor/core-adapter");
  return {
    ...actual,
    toTutorRequestFromCoreAssist: mockToTutorRequestFromCoreAssist,
  };
});

vi.mock("@/lib/ai", () => ({
  aiService: { complete: mockAiComplete },
}));

vi.mock("@/lib/ai/course-source", () => ({
  loadMaterialSourceText: mockLoadMaterial,
  loadCourseSourceText: mockLoadCourse,
}));

vi.mock("@/lib/core/study-extract-store", () => ({
  readStudyExtractFromUnknown: mockReadExtract,
  loadPersistedStudyExtract: mockLoadPersisted,
  formatStudyExtractContext: mockFormatExtract,
}));

vi.mock("@/lib/user", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/settings/app-settings", () => ({
  getUserAppSettings: mockGetUserAppSettings,
  aiSourceInstruction: mockAiSourceInstruction,
}));

import { POST } from "../../../../app/api/core/chat/route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/core/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("CORE Assist route — feature-flagged Unified Tutor path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1" });
    mockGetUserAppSettings.mockResolvedValue({
      aiUseOpenAIPro: false,
      aiSourceMode: "balanced",
    });
    mockAiSourceInstruction.mockReturnValue("Prefer uploaded materials.");
    mockIsCoreAssistUnifiedEnabled.mockReturnValue(false);
    mockLoadMaterial.mockResolvedValue(null);
    mockLoadCourse.mockResolvedValue({
      text: "Source about inheritance and polymorphism.",
      courseTitle: "CS101",
    });
    mockReadExtract.mockReturnValue(null);
    mockLoadPersisted.mockResolvedValue(null);
    mockFormatExtract.mockReturnValue("");
    mockAiComplete.mockResolvedValue({
      content: JSON.stringify({
        answer: "Legacy answer",
        citations: [{ label: "src", excerpt: "inheritance" }],
      }),
      model: "test",
      provider: "gemini",
    });
    mockRunTutor.mockResolvedValue({
      text: JSON.stringify({
        answer: "Unified answer",
        citations: [{ label: "u", excerpt: "polymorphism" }],
      }),
      mode: "TEACH_ME",
      conceptTitles: [],
      meta: {
        usedLearnerModel: false,
        usedKnowledgeModel: false,
        conceptIds: [],
        evidenceRecorded: false,
      },
    });
    mockToTutorRequestFromCoreAssist.mockResolvedValue({
      learnerId: "user-1",
      mode: "TEACH_ME",
      message: "payload",
      evidenceIntent: "none",
      instructionalContext: "CORE…",
      temperature: 0.2,
      maxTokens: 2048,
      jsonMode: true,
    });
  });

  it("OFF: uses legacy aiService.complete only", async () => {
    mockIsCoreAssistUnifiedEnabled.mockReturnValue(false);

    const res = await POST(
      jsonRequest({
        message: "What is inheritance?",
        courseId: "course-1",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.answer).toBe("Legacy answer");
    expect(data.data.citations).toHaveLength(1);
    expect(mockAiComplete).toHaveBeenCalledTimes(1);
    expect(mockRunTutor).not.toHaveBeenCalled();
    expect(mockToTutorRequestFromCoreAssist).not.toHaveBeenCalled();
  });

  it("ON: routes through Unified Tutor facade", async () => {
    mockIsCoreAssistUnifiedEnabled.mockReturnValue(true);

    const res = await POST(
      jsonRequest({
        message: "What is inheritance?",
        courseId: "course-1",
        history: [{ role: "user", content: "earlier" }],
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.answer).toBe("Unified answer");
    expect(data.data.citations[0].excerpt).toBe("polymorphism");
    expect(mockToTutorRequestFromCoreAssist).toHaveBeenCalled();
    expect(mockRunTutor).toHaveBeenCalledTimes(1);
    expect(mockAiComplete).not.toHaveBeenCalled();
  });

  it("ON + adapter failure: falls back to legacy without prior AI call", async () => {
    mockIsCoreAssistUnifiedEnabled.mockReturnValue(true);
    const { CoreAssistAdapterError } = await import(
      "@/lib/learning/tutor/core-adapter"
    );
    mockToTutorRequestFromCoreAssist.mockRejectedValue(
      new CoreAssistAdapterError("bad adapt"),
    );

    const res = await POST(
      jsonRequest({
        message: "What is inheritance?",
        courseId: "course-1",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.answer).toBe("Legacy answer");
    expect(mockRunTutor).not.toHaveBeenCalled();
    expect(mockAiComplete).toHaveBeenCalledTimes(1);
  });

  it("ON + AI failure: does not duplicate AI via legacy retry", async () => {
    mockIsCoreAssistUnifiedEnabled.mockReturnValue(true);
    mockRunTutor.mockRejectedValue(new Error("provider exhausted"));

    const res = await POST(
      jsonRequest({
        message: "What is inheritance?",
        courseId: "course-1",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(mockAiComplete).not.toHaveBeenCalled();
    expect(mockRunTutor).toHaveBeenCalledTimes(1);
  });
});

describe("Phase 2D-3 preservation — CORE UI and other surfaces", () => {
  const root = path.resolve(__dirname, "../../../..");

  function read(rel: string): string {
    return readFileSync(path.join(root, rel), "utf8");
  }

  it("does not change CoreSourceChat UI contract", () => {
    const ui = read("src/components/core/CoreSourceChat.tsx");
    expect(ui).toMatch(/fetch\("\/api\/core\/chat"/);
    expect(ui).toMatch(/data\.data\.answer/);
    expect(ui).toMatch(/data\.data\.citations/);
    expect(ui).not.toMatch(/runTutor|STUDY_HAUL_CORE_ASSIST_UNIFIED/);
  });

  it("keeps legacy aiService path for flag OFF", () => {
    const route = read("app/api/core/chat/route.ts");
    expect(route).toMatch(/runLegacyCoreAssistCompletion|aiService\.complete/);
    expect(route).toMatch(/isCoreAssistUnifiedEnabled/);
    expect(route).toMatch(/runTutor/);
  });

  it("does not migrate SIX / Evaluate / Lucky in this phase", () => {
    expect(read("app/api/study/six-tutor/route.ts")).not.toMatch(
      /isCoreAssistUnifiedEnabled|toTutorRequestFromCoreAssist/,
    );
    expect(read("app/api/study/lucky/route.ts")).not.toMatch(
      /toTutorRequestFromCoreAssist/,
    );
  });
});
