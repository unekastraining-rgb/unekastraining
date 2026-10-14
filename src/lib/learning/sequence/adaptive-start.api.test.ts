/**
 * Phase 2G-9 — POST /api/study/adaptive/start route contract.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockGetOrCreateDefaultUser,
  mockStartOrResume,
} = vi.hoisted(() => ({
  mockGetOrCreateDefaultUser: vi.fn(),
  mockStartOrResume: vi.fn(),
}));

vi.mock("@/lib/user", () => ({
  getOrCreateDefaultUser: mockGetOrCreateDefaultUser,
}));

vi.mock("@/lib/learning/sequence/start-or-resume", () => ({
  startOrResumeAdaptiveSequenceForConcept: mockStartOrResume,
}));

import { POST } from "../../../../app/api/study/adaptive/start/route";

describe("POST /api/study/adaptive/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateDefaultUser.mockResolvedValue({ id: "user-session" });
  });

  it("starts with session user and ignores client userId/learnerId", async () => {
    mockStartOrResume.mockResolvedValue({
      kind: "ok",
      runId: "run-1",
      resumed: false,
    });

    const response = await POST(
      new Request("http://localhost/api/study/adaptive/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: "concept-1",
          userId: "attacker",
          learnerId: "attacker",
        }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      runId: "run-1",
      resumed: false,
      materialId: null,
      assignmentId: null,
    });
    expect(mockStartOrResume).toHaveBeenCalledWith(
      "user-session",
      "concept-1",
    );
    expect(mockStartOrResume).not.toHaveBeenCalledWith(
      "attacker",
      expect.anything(),
    );
  });

  it("returns 404 for not_found without leaking ownership details", async () => {
    mockStartOrResume.mockResolvedValue({ kind: "not_found" });
    const response = await POST(
      new Request("http://localhost/api/study/adaptive/start", {
        method: "POST",
        body: JSON.stringify({ conceptId: "x" }),
      }),
    );
    const json = await response.json();
    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(JSON.stringify(json)).not.toMatch(/owned|another user/i);
  });

  it("returns 400 when conceptId missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/study/adaptive/start", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(400);
    expect(mockStartOrResume).not.toHaveBeenCalled();
  });

  it("route source uses getOrCreateDefaultUser only", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/api/study/adaptive/start/route.ts"),
      "utf8",
    );
    expect(source).toContain("getOrCreateDefaultUser");
    expect(source).toContain("startOrResumeAdaptiveSequenceForConcept");
    expect(source).toContain("resolveOwnedAssignmentContext");
    expect(source).toContain("void body?.userId");
    expect(source).toContain("void body?.learnerId");
  });
});

describe("Phase 2G-9 product preservation", () => {
  it("Study Now / Six panel / Lucky / CORE remain free of adaptive start wiring", () => {
    const files = [
      "src/lib/csl/study-now.ts",
      "src/components/study/SixRecommendationsPanel.tsx",
      "src/lib/csl/lucky-engine.ts",
      "app/core/page.tsx",
      "app/study/six/[component]/page.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toContain("/api/study/adaptive/start");
      expect(source).not.toContain("startOrResumeAdaptiveSequenceForConcept");
    }
  });

  it("Continue Learning experience on Study Haul; Orchestrator card on Growth Center", () => {
    const center = readFileSync(
      path.join(process.cwd(), "src/components/study/StudyHaulLearningCenter.tsx"),
      "utf8",
    );
    const growth = readFileSync(
      path.join(process.cwd(), "src/components/study/LearnerGrowthCenterPanel.tsx"),
      "utf8",
    );
    const hub = readFileSync(
      path.join(process.cwd(), "app/study/study-hub-view.tsx"),
      "utf8",
    );
    expect(center).toContain("ContinueLearningExperienceCard");
    expect(growth).toContain("OrchestratorSuggestionCard");
    // Front door IA: no raw OrchestratorSuggestionCard / Six panel inventory on hub shell.
    expect(hub).not.toContain("OrchestratorSuggestionCard");
    expect(hub).not.toContain("SixRecommendationsPanel");
  });
});
