import { beforeEach, describe, expect, it, vi } from "vitest";

const mockComplete = vi.hoisted(() => vi.fn());
const mockLoadTutorContext = vi.hoisted(() => vi.fn());
const mockMaybeRecordTutorEvidence = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai", () => ({
  aiService: {
    complete: mockComplete,
    getProviderName: () => "fallback-chain",
  },
}));

vi.mock("@/lib/learning/tutor/context", () => ({
  loadTutorContext: mockLoadTutorContext,
}));

vi.mock("@/lib/learning/tutor/evidence", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/learning/tutor/evidence")
  >("@/lib/learning/tutor/evidence");
  return {
    ...actual,
    maybeRecordTutorEvidence: mockMaybeRecordTutorEvidence,
  };
});

import { runTutor, TutorRequestError } from "@/lib/learning/tutor/service";

describe("Tutor AI provider integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadTutorContext.mockResolvedValue({
      conceptIds: ["c1"],
      conceptTitles: ["Inheritance"],
      subjectDomain: "programming",
      learningSpaceTitle: null,
      masterySummaries: [],
      usedLearnerModel: true,
      usedKnowledgeModel: true,
      contextBlock: "Known concepts: Inheritance",
    });
    mockComplete.mockResolvedValue({
      content: "Inheritance lets one class reuse another.",
      model: "test-model",
      provider: "gemini",
    });
    mockMaybeRecordTutorEvidence.mockResolvedValue({
      recorded: false,
      learningAttemptId: null,
    });
  });

  it("uses the existing aiService abstraction (no hard-coded provider)", async () => {
    const response = await runTutor({
      learnerId: "user-1",
      mode: "TEACH_ME",
      message: "Explain inheritance",
      conceptIds: ["c1"],
      evidenceIntent: "none",
    });

    expect(mockComplete).toHaveBeenCalledTimes(1);
    const [messages, options] = mockComplete.mock.calls[0];
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toMatch(/TEACH_ME/);
    expect(messages[0].content).toMatch(/Inheritance/);
    expect(options).toEqual(
      expect.objectContaining({
        temperature: expect.any(Number),
        maxTokens: expect.any(Number),
      }),
    );
    expect(options).not.toHaveProperty("provider");
    expect(JSON.stringify(mockComplete.mock.calls[0])).not.toMatch(
      /openai|groq|gemini|openrouter/i,
    );
    expect(response.text).toMatch(/Inheritance/);
    expect(response.meta.provider).toBe("gemini");
    expect(response.meta.evidenceRecorded).toBe(false);
  });

  it("continues when learner context fails", async () => {
    mockLoadTutorContext.mockRejectedValue(new Error("context boom"));

    const response = await runTutor({
      learnerId: "user-1",
      mode: "GUIDED",
      message: "help me",
    });

    expect(response.text).toBeTruthy();
    expect(response.meta.usedLearnerModel).toBe(false);
    expect(mockComplete).toHaveBeenCalled();
  });

  it("records evidence only for server-authorized meaningful intents", async () => {
    mockMaybeRecordTutorEvidence.mockResolvedValue({
      recorded: true,
      learningAttemptId: "att-9",
    });

    const response = await runTutor({
      learnerId: "user-1",
      mode: "PRACTICE",
      message: "Check my answer",
      conceptIds: ["c1"],
      evidenceIntent: "practice_answer",
      evidenceAuthorizedByServer: true,
      learnerDemonstration: "A subclass inherits fields and methods.",
    });

    expect(mockMaybeRecordTutorEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceIntent: "practice_answer",
        evidenceAuthorizedByServer: true,
        conceptId: "c1",
      }),
    );
    expect(response.meta.evidenceRecorded).toBe(true);
    expect(response.meta.learningAttemptId).toBe("att-9");
  });

  it("does not record evidence when client-style intent lacks server authorization", async () => {
    await runTutor({
      learnerId: "user-1",
      mode: "PRACTICE",
      message: "Check my answer",
      conceptIds: ["c1"],
      evidenceIntent: "apply",
      clientEvidenceIntentRequest: "apply",
      evidenceAuthorizedByServer: false,
      learnerDemonstration: "A subclass inherits fields and methods.",
    });
    expect(mockMaybeRecordTutorEvidence).not.toHaveBeenCalled();
  });

  it("does not call evidence recorder for ordinary conversation", async () => {
    await runTutor({
      learnerId: "user-1",
      mode: "BEGINNER",
      message: "What does inheritance mean?",
      evidenceIntent: "none",
    });
    expect(mockMaybeRecordTutorEvidence).not.toHaveBeenCalled();
  });

  it("passes instructionalContext and temperature overrides to aiService", async () => {
    const response = await runTutor({
      learnerId: "user-1",
      mode: "GUIDED",
      message: "Explain chunk 2",
      instructionalContext: "Teach using Chunking. Do not abandon the technique.",
      temperature: 0.4,
      maxTokens: 1200,
      evidenceIntent: "none",
    });

    const [messages, options] = mockComplete.mock.calls[0];
    expect(messages[0].content).toMatch(/Experience strategy/);
    expect(messages[0].content).toMatch(/Chunking/);
    expect(options.temperature).toBe(0.4);
    expect(options.maxTokens).toBe(1200);
    expect(response.meta.evidenceRecorded).toBe(false);
  });

  it("passes jsonMode when requested (CORE Assist parity)", async () => {
    await runTutor({
      learnerId: "user-1",
      mode: "TEACH_ME",
      message: "Return JSON",
      jsonMode: true,
      temperature: 0.2,
      evidenceIntent: "none",
    });
    const options = mockComplete.mock.calls[0][1];
    expect(options.jsonMode).toBe(true);
    expect(options.temperature).toBe(0.2);
  });

  it("rejects invalid requests", async () => {
    await expect(
      runTutor({
        learnerId: "",
        mode: "GUIDED",
        message: "hi",
      }),
    ).rejects.toBeInstanceOf(TutorRequestError);
  });
});
