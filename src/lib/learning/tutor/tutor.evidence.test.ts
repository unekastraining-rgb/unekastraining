import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockLearnerProfileUpsert,
  mockLearningObjectFindFirst,
  mockLearningObjectCreate,
  mockLearningAttemptCreate,
  mockConceptMasteryFindUnique,
  mockConceptMasteryUpsert,
  mockTopicFindFirst,
  mockMissedQuestionCount,
  mockRetentionItemUpsert,
} = vi.hoisted(() => ({
  mockLearnerProfileUpsert: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
  mockLearningObjectCreate: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockConceptMasteryFindUnique: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockMissedQuestionCount: vi.fn(),
  mockRetentionItemUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learnerProfile: { upsert: mockLearnerProfileUpsert },
    learningObject: {
      findFirst: mockLearningObjectFindFirst,
      create: mockLearningObjectCreate,
    },
    learningAttempt: {
      create: mockLearningAttemptCreate,
      findMany: vi.fn().mockResolvedValue([]),
    },
    conceptMastery: {
      findUnique: mockConceptMasteryFindUnique,
      upsert: mockConceptMasteryUpsert,
    },
    topic: { findFirst: mockTopicFindFirst },
    missedQuestion: { count: mockMissedQuestionCount },
    retentionItem: {
      upsert: mockRetentionItemUpsert.mockResolvedValue({ id: "ri" }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
  },
}));

import {
  facetForTutorEvidence,
  maybeRecordTutorEvidence,
  resolveTutorEvidenceAuthorization,
  shouldRecordTutorEvidence,
} from "@/lib/learning/tutor/evidence";
import { readFileSync } from "node:fs";
import path from "node:path";
import { toTutorRequestFromDemonstration } from "@/lib/learning/tutor/facade";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Tutor evidence policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLearnerProfileUpsert.mockResolvedValue({ userId: "user-1" });
    mockLearningObjectFindFirst.mockResolvedValue(null);
    mockLearningObjectCreate.mockResolvedValue({ id: "lo-tutor-1" });
    mockLearningAttemptCreate.mockResolvedValue({ id: "attempt-1" });
    mockConceptMasteryFindUnique.mockResolvedValue(null);
    mockConceptMasteryUpsert.mockResolvedValue({
      retain: 0.4,
      reviewCount: 1,
      nextReviewAt: new Date(),
    });
    mockTopicFindFirst.mockResolvedValue(null);
    mockMissedQuestionCount.mockResolvedValue(0);
  });

  it("does not treat ordinary conversation as mastery evidence", () => {
    expect(shouldRecordTutorEvidence(undefined)).toBe(false);
    expect(shouldRecordTutorEvidence("none")).toBe(false);
  });

  it("allows meaningful tutoring evidence intents", () => {
    expect(shouldRecordTutorEvidence("explain")).toBe(true);
    expect(shouldRecordTutorEvidence("practice_answer")).toBe(true);
    expect(shouldRecordTutorEvidence("solve")).toBe(true);
  });

  it("maps intents to appropriate mastery facets", () => {
    expect(facetForTutorEvidence("explain")).toBe("EXPLAIN");
    expect(facetForTutorEvidence("apply")).toBe("APPLY");
    expect(facetForTutorEvidence("solve")).toBe("SOLVE");
    expect(facetForTutorEvidence("practice_answer")).toBe("APPLY");
  });

  it("T1 — client evidenceIntent alone cannot authorize evidence", () => {
    const auth = resolveTutorEvidenceAuthorization({
      request: {
        evidenceIntent: "apply",
        clientEvidenceIntentRequest: "apply",
        evidenceAuthorizedByServer: false,
        learnerDemonstration: "A long enough learner answer for APPLY.",
      },
      ownedConceptId: "concept-1",
    });
    expect(auth.eligible).toBe(false);
    expect(auth.reason).toBe("evidence_not_server_authorized");
  });

  it("T2 — server facet comes from authorized evidenceIntent, not client request", () => {
    const auth = resolveTutorEvidenceAuthorization({
      request: {
        evidenceIntent: "explain",
        clientEvidenceIntentRequest: "solve",
        evidenceAuthorizedByServer: true,
        learnerDemonstration: "My explanation of the concept in detail.",
      },
      ownedConceptId: "concept-1",
    });
    expect(auth.eligible).toBe(true);
    expect(auth.skillFacet).toBe("EXPLAIN");
    expect(auth.evidenceIntent).toBe("explain");
  });

  it("creates LearningAttempt with concept linkage for server-authorized evidence", async () => {
    const result = await maybeRecordTutorEvidence({
      learnerId: "user-1",
      mode: "PRACTICE",
      evidenceIntent: "practice_answer",
      evidenceAuthorizedByServer: true,
      conceptId: "concept-1",
      learningSpaceId: "space-1",
      learnerDemonstration: "Inheritance means a subclass reuses a superclass.",
      score: 0.85,
    });

    expect(result.recorded).toBe(true);
    expect(result.learningAttemptId).toBe("attempt-1");
    expect(mockLearningObjectCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "TUTOR_TURN",
          skillFacet: "APPLY",
          userId: "user-1",
        }),
      }),
    );
    expect(mockLearningAttemptCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          conceptId: "concept-1",
          skillFacet: "APPLY",
          learningObjectId: "lo-tutor-1",
        }),
      }),
    );
    expect(mockConceptMasteryUpsert).toHaveBeenCalled();
  });

  it("T3 — skips evidence when intent is ordinary conversation", async () => {
    const result = await maybeRecordTutorEvidence({
      learnerId: "user-1",
      mode: "BEGINNER",
      evidenceIntent: "none",
      evidenceAuthorizedByServer: true,
      conceptId: "concept-1",
      learnerDemonstration: "What does inheritance mean?",
    });
    expect(result.recorded).toBe(false);
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
  });

  it("skips evidence without a concept rather than inventing one", async () => {
    const result = await maybeRecordTutorEvidence({
      learnerId: "user-1",
      mode: "PRACTICE",
      evidenceIntent: "explain",
      evidenceAuthorizedByServer: true,
      conceptId: null,
      learnerDemonstration: "My explanation…",
    });
    expect(result.recorded).toBe(false);
    expect(mockLearningObjectCreate).not.toHaveBeenCalled();
  });

  it("T1b — maybeRecord rejects unauthorized even with apply intent + demo", async () => {
    const result = await maybeRecordTutorEvidence({
      learnerId: "user-1",
      mode: "PRACTICE",
      evidenceIntent: "apply",
      evidenceAuthorizedByServer: false,
      conceptId: "concept-1",
      learnerDemonstration: "I applied the concept carefully here.",
    });
    expect(result.recorded).toBe(false);
    expect(mockLearningAttemptCreate).not.toHaveBeenCalled();
    expect(mockConceptMasteryUpsert).not.toHaveBeenCalled();
  });

  it("T4 — demonstration facade marks server authorization", () => {
    const req = toTutorRequestFromDemonstration({
      learnerId: "u1",
      message: "Evaluate",
      learnerDemonstration: "Inheritance lets a class reuse another class.",
      conceptIds: ["c1"],
    });
    expect(req.evidenceAuthorizedByServer).toBe(true);
    expect(req.evidenceIntent).toBe("practice_answer");
  });

  it("T5 — foundation route ignores client score/outcome and strips evidenceIntent", () => {
    const route = read("app/api/study/tutor/route.ts");
    expect(route).toContain('evidenceIntent: "none"');
    expect(route).toContain("evidenceAuthorizedByServer: false");
    expect(route).toContain("clientEvidenceIntentRequest");
    expect(route).toContain("void body.score");
    expect(route).toContain("void body.outcome");
    expect(route).not.toMatch(/evidenceIntent:\s*body\.evidenceIntent/);
  });

  it("T6/T7 — ownership via session learnerId; foreign concepts skipped in context", () => {
    const route = read("app/api/study/tutor/route.ts");
    expect(route).toContain("learnerId: user.id");
    expect(route).toContain("void body.learnerId");
    const ctx = read("src/lib/learning/tutor/context.ts");
    expect(ctx).toContain("userId: request.learnerId");
    expect(ctx).toMatch(/Uncertain \/ foreign conceptId/);
  });

  it("T10 — evidence still uses LearningAttempt → ConceptMastery", () => {
    const evidence = read("src/lib/learning/tutor/evidence.ts");
    expect(evidence).toContain("recordEvidence(envelope)");
    expect(evidence).toContain("applyEvidenceToMastery(envelope)");
    expect(evidence).not.toMatch(/updateTopicMastery|topicMastery\.upsert/);
  });
});
