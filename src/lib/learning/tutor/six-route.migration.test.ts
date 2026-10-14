import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const mockRunTutor = vi.hoisted(() => vi.fn());
const mockCompleteForUser = vi.hoisted(() => vi.fn());
const mockIsSixTutorUnifiedEnabled = vi.hoisted(() => vi.fn());
const mockToTutorRequestFromSixTutor = vi.hoisted(() => vi.fn());
const mockGetOrCreateDefaultUser = vi.hoisted(() => vi.fn());
const mockGetUserAppSettings = vi.hoisted(() => vi.fn());
const mockIsAIConfigured = vi.hoisted(() => vi.fn());
const mockCourseFindFirst = vi.hoisted(() => vi.fn());

vi.mock("@/lib/learning/tutor/service", () => ({
  runTutor: mockRunTutor,
  TutorRequestError: class TutorRequestError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TutorRequestError";
    }
  },
}));

vi.mock("@/lib/learning/tutor/six-feature-flag", () => ({
  isSixTutorUnifiedEnabled: mockIsSixTutorUnifiedEnabled,
}));

vi.mock("@/lib/learning/tutor/six-adapter", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/learning/tutor/six-adapter")
  >("@/lib/learning/tutor/six-adapter");
  return {
    ...actual,
    toTutorRequestFromSixTutor: mockToTutorRequestFromSixTutor,
  };
});

vi.mock("@/lib/ai/complete-for-user", () => ({
  completeForUser: mockCompleteForUser,
}));

vi.mock("@/lib/ai/is-configured", () => ({
  isAIConfigured: mockIsAIConfigured,
}));

vi.mock("@/lib/ai/course-source", () => ({
  loadChapterStudySourceText: vi.fn().mockResolvedValue(null),
  loadMaterialSourceText: vi.fn().mockResolvedValue(null),
  loadCourseSourceText: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/user", () => ({
  getOrCreateDefaultUser: mockGetOrCreateDefaultUser,
}));

vi.mock("@/lib/settings/app-settings", () => ({
  getUserAppSettings: mockGetUserAppSettings,
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: { findFirst: mockCourseFindFirst },
  },
}));

import { POST } from "../../../../app/api/study/six-tutor/route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/study/six-tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("SIX Tutor route — feature-flagged Unified Tutor path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultUser.mockResolvedValue({ id: "user-1" });
    mockGetUserAppSettings.mockResolvedValue({ aiUseOpenAIPro: false });
    mockIsAIConfigured.mockReturnValue(true);
    mockCourseFindFirst.mockResolvedValue(null);
    mockIsSixTutorUnifiedEnabled.mockReturnValue(false);
    mockCompleteForUser.mockResolvedValue({
      content: "Legacy SIX reply",
      model: "test",
      provider: "gemini",
    });
    mockRunTutor.mockResolvedValue({
      text: "Unified Tutor reply",
      mode: "GUIDED",
      conceptTitles: [],
      meta: {
        usedLearnerModel: false,
        usedKnowledgeModel: false,
        conceptIds: [],
        evidenceRecorded: false,
      },
    });
    mockToTutorRequestFromSixTutor.mockResolvedValue({
      learnerId: "user-1",
      mode: "GUIDED",
      message: "Explain this",
      evidenceIntent: "none",
      instructionalContext: "SIX Chunking…",
      temperature: 0.4,
      maxTokens: 1200,
    });
  });

  it("OFF: uses completeForUser legacy path only", async () => {
    mockIsSixTutorUnifiedEnabled.mockReturnValue(false);

    const res = await POST(
      jsonRequest({
        message: "Explain this",
        component: "chunking",
        topic: "Inheritance",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.reply).toBe("Legacy SIX reply");
    expect(mockCompleteForUser).toHaveBeenCalledTimes(1);
    expect(mockRunTutor).not.toHaveBeenCalled();
    expect(mockToTutorRequestFromSixTutor).not.toHaveBeenCalled();
  });

  it("ON: routes through Unified Tutor facade", async () => {
    mockIsSixTutorUnifiedEnabled.mockReturnValue(true);

    const res = await POST(
      jsonRequest({
        message: "Explain this",
        component: "chunking",
        topic: "Inheritance",
        history: [{ role: "user", content: "earlier" }],
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.reply).toBe("Unified Tutor reply");
    expect(mockToTutorRequestFromSixTutor).toHaveBeenCalled();
    expect(mockRunTutor).toHaveBeenCalledTimes(1);
    expect(mockCompleteForUser).not.toHaveBeenCalled();
  });

  it("ON + adapter failure: falls back to legacy without duplicate success path", async () => {
    mockIsSixTutorUnifiedEnabled.mockReturnValue(true);
    const { SixTutorAdapterError } = await import(
      "@/lib/learning/tutor/six-adapter"
    );
    mockToTutorRequestFromSixTutor.mockRejectedValue(
      new SixTutorAdapterError("bad adapt"),
    );

    const res = await POST(
      jsonRequest({
        message: "Explain this",
        component: "chunking",
        topic: "Inheritance",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.reply).toBe("Legacy SIX reply");
    expect(mockRunTutor).not.toHaveBeenCalled();
    expect(mockCompleteForUser).toHaveBeenCalledTimes(1);
  });

  it("ON + AI failure: does not duplicate AI via legacy retry", async () => {
    mockIsSixTutorUnifiedEnabled.mockReturnValue(true);
    mockRunTutor.mockRejectedValue(new Error("provider exhausted"));

    const res = await POST(
      jsonRequest({
        message: "Explain this",
        component: "chunking",
        topic: "Inheritance",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(mockCompleteForUser).not.toHaveBeenCalled();
    expect(mockRunTutor).toHaveBeenCalledTimes(1);
  });
});

describe("Phase 2D-2 preservation — UI and other surfaces", () => {
  const root = path.resolve(__dirname, "../../../..");

  function read(rel: string): string {
    return readFileSync(path.join(root, rel), "utf8");
  }

  it("does not change SixTutorChat UI contract (same endpoint + reply shape)", () => {
    const ui = read("src/components/study/SixTutorChat.tsx");
    expect(ui).toMatch(/fetch\("\/api\/study\/six-tutor"/);
    expect(ui).toMatch(/data\.reply/);
    expect(ui).not.toMatch(/runTutor|STUDY_HAUL_SIX_TUTOR_UNIFIED/);
  });

  it("keeps legacy completeForUser path in the route for flag OFF", () => {
    const route = read("app/api/study/six-tutor/route.ts");
    expect(route).toMatch(/runLegacySixTutorCompletion|completeForUser/);
    expect(route).toMatch(/isSixTutorUnifiedEnabled/);
    expect(route).toMatch(/runTutor/);
  });

  it("does not migrate Core AI / Evaluate / Lucky", () => {
    for (const file of [
      "app/api/core/chat/route.ts",
      "app/api/study/evaluate/route.ts",
      "app/api/study/lucky/route.ts",
    ]) {
      expect(read(file)).not.toMatch(/toTutorRequestFromSixTutor|isSixTutorUnifiedEnabled/);
    }
  });

  it("does not modify Orchestrator or RetentionItem modules", () => {
    expect(read("src/lib/learning/orchestrator/diagnose.ts")).not.toMatch(
      /six-tutor|runTutor|SixTutor/,
    );
    expect(read("src/lib/learning/retention/review.ts")).not.toMatch(
      /SixTutor|six-tutor/,
    );
  });
});
