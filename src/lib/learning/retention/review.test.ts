import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  mockFindMany,
  mockRetentionFindFirst,
  mockMissedFindFirst,
  mockFlashFindFirst,
  mockConceptFindFirst,
  mockRecordOutcome,
  mockEnsureLO,
  mockRecordEvidence,
  mockApplyMastery,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockRetentionFindFirst: vi.fn(),
  mockMissedFindFirst: vi.fn(),
  mockFlashFindFirst: vi.fn(),
  mockConceptFindFirst: vi.fn(),
  mockRecordOutcome: vi.fn(),
  mockEnsureLO: vi.fn(),
  mockRecordEvidence: vi.fn(),
  mockApplyMastery: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    retentionItem: {
      findMany: mockFindMany,
      findFirst: mockRetentionFindFirst,
    },
    missedQuestion: { findFirst: mockMissedFindFirst },
    flashcard: { findFirst: mockFlashFindFirst },
    concept: { findFirst: mockConceptFindFirst },
  },
}));

vi.mock("@/lib/learning/retention/service", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/learning/retention/service")
  >("@/lib/learning/retention/service");
  return {
    ...actual,
    findDueRetentionItems: mockFindMany,
    recordRetentionOutcome: mockRecordOutcome,
  };
});

vi.mock("@/lib/learning/learning-object/ensure", () => ({
  ensureLearningObject: mockEnsureLO,
}));

vi.mock("@/lib/learning/evidence/record", () => ({
  recordEvidence: mockRecordEvidence,
}));

vi.mock("@/lib/learning/mastery/apply", () => ({
  applyEvidenceToMastery: mockApplyMastery,
}));

import {
  getNextRetentionReviewItem,
  submitRetentionReview,
} from "@/lib/learning/retention/review";

describe("Lucky item-level retention selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordOutcome.mockResolvedValue({ id: "ri-1", reviewCount: 1 });
    mockEnsureLO.mockResolvedValue({ id: "lo-1" });
    mockRecordEvidence.mockResolvedValue({ id: "la-1" });
    mockApplyMastery.mockResolvedValue({ id: "cm-1" });
  });

  it("selects due items by priority order and skips unusable sources", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "ri-bad",
        userId: "user-1",
        sourceType: "TUTOR_FLAG",
        sourceRef: "x",
        conceptId: null,
      },
      {
        id: "ri-good",
        userId: "user-1",
        sourceType: "MISSED_QUESTION",
        sourceRef: "mq-1",
        conceptId: "c-1",
      },
    ]);
    mockMissedFindFirst.mockResolvedValue({
      id: "mq-1",
      userId: "user-1",
      prompt: "What is a loop?",
      correctAnswer: '"for"',
      questionType: "SHORT_ANSWER",
      options: null,
    });

    const item = await getNextRetentionReviewItem("user-1");
    expect(item?.retentionItemId).toBe("ri-good");
    expect(item?.prompt).toBe("What is a loop?");
    expect(item?.sourceLabel).toBe("Missed question");
    expect(item?.reasonLabel).toBeTruthy();
    expect(item?.reasonLabel).not.toMatch(/RETENTION_GAP|MISSED_QUESTION/);
    expect(JSON.stringify(item)).not.toMatch(/TUTOR_FLAG|MISSED_QUESTION/);
  });

  it("returns null when no due items", async () => {
    mockFindMany.mockResolvedValue([]);
    expect(await getNextRetentionReviewItem("user-1")).toBeNull();
  });

  it("enforces learner isolation on missing source ownership", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "ri-1",
        userId: "user-1",
        sourceType: "MISSED_QUESTION",
        sourceRef: "mq-1",
        conceptId: null,
      },
    ]);
    mockMissedFindFirst.mockResolvedValue(null);
    expect(await getNextRetentionReviewItem("user-1")).toBeNull();
  });
});

describe("Lucky item-level retention submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordOutcome.mockResolvedValue({ id: "ri-1", reviewCount: 2 });
    mockEnsureLO.mockResolvedValue({ id: "lo-ret" });
    mockRecordEvidence.mockResolvedValue({ id: "la-ret" });
    mockApplyMastery.mockResolvedValue({ id: "cm-ret" });
    mockFindMany.mockResolvedValue([]);
  });

  it("grades missed question success without revealing the answer", async () => {
    mockRetentionFindFirst.mockResolvedValue({
      id: "ri-1",
      userId: "user-1",
      sourceType: "MISSED_QUESTION",
      sourceRef: "mq-1",
      conceptId: "c-1",
    });
    mockMissedFindFirst.mockResolvedValue({
      id: "mq-1",
      userId: "user-1",
      prompt: "2+2?",
      correctAnswer: '"4"',
      questionType: "SHORT_ANSWER",
      options: null,
    });

    const result = await submitRetentionReview({
      userId: "user-1",
      retentionItemId: "ri-1",
      answer: "4",
    });

    expect(result?.outcome).toBe("SUCCESS");
    expect(result?.score).toBe(1);
    expect(result?.resultLabel.toLowerCase()).toMatch(/correct|kept/);
    expect(JSON.stringify(result)).not.toMatch(/correctAnswer|"4"/);
    expect(mockRecordOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        retentionItemId: "ri-1",
        outcome: "SUCCESS",
      }),
    );
    expect(mockEnsureLO).toHaveBeenCalled();
    expect(mockRecordEvidence).toHaveBeenCalled();
    expect(mockApplyMastery).toHaveBeenCalled();
  });

  it("failed response schedules FAIL outcome and keeps queue behavior", async () => {
    mockRetentionFindFirst.mockResolvedValue({
      id: "ri-1",
      userId: "user-1",
      sourceType: "MISSED_QUESTION",
      sourceRef: "mq-1",
      conceptId: "c-1",
    });
    mockMissedFindFirst.mockResolvedValue({
      id: "mq-1",
      userId: "user-1",
      prompt: "2+2?",
      correctAnswer: '"4"',
      questionType: "SHORT_ANSWER",
      options: null,
    });

    const result = await submitRetentionReview({
      userId: "user-1",
      retentionItemId: "ri-1",
      answer: "5",
    });

    expect(result?.outcome).toBe("FAIL");
    expect(mockRecordOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "FAIL" }),
    );
    expect(result?.resultLabel.toLowerCase()).toMatch(/missed|sooner/);
  });

  it("supports flashcard self-rate Again/Good/Easy", async () => {
    mockRetentionFindFirst.mockResolvedValue({
      id: "ri-fc",
      userId: "user-1",
      sourceType: "FLASHCARD",
      sourceRef: "fc-1",
      conceptId: "c-1",
    });
    mockFlashFindFirst.mockResolvedValue({
      id: "fc-1",
      userId: "user-1",
      front: "Osmosis",
      back: "Water diffusion",
    });

    const result = await submitRetentionReview({
      userId: "user-1",
      retentionItemId: "ri-fc",
      answer: "GOOD",
    });
    expect(result?.outcome).toBe("PARTIAL");
  });

  it("supports weak-mastery self-rate when concept exists", async () => {
    mockRetentionFindFirst.mockResolvedValue({
      id: "ri-wm",
      userId: "user-1",
      sourceType: "WEAK_MASTERY",
      sourceRef: "c-1",
      conceptId: "c-1",
    });
    mockConceptFindFirst.mockResolvedValue({
      id: "c-1",
      userId: "user-1",
      title: "Exceptions",
    });

    const next = await getNextRetentionReviewItem("user-1");
    // selection path
    mockFindMany.mockResolvedValue([
      {
        id: "ri-wm",
        userId: "user-1",
        sourceType: "WEAK_MASTERY",
        sourceRef: "c-1",
        conceptId: "c-1",
      },
    ]);
    const view = await getNextRetentionReviewItem("user-1");
    expect(view?.inputMode).toBe("self_rate");
    expect(view?.prompt).toMatch(/Exceptions/);

    const result = await submitRetentionReview({
      userId: "user-1",
      retentionItemId: "ri-wm",
      answer: "EASY",
    });
    expect(result?.outcome).toBe("SUCCESS");
    void next;
  });

  it("returns null when retention item is not owned by learner", async () => {
    mockRetentionFindFirst.mockResolvedValue(null);
    const result = await submitRetentionReview({
      userId: "user-b",
      retentionItemId: "ri-1",
      answer: "x",
    });
    expect(result).toBeNull();
    expect(mockRecordOutcome).not.toHaveBeenCalled();
  });
});

describe("Phase 2C-2 preservation", () => {
  it("Lucky session mounts retention review without replacing StudySessionRunner", () => {
    const page = readFileSync(
      path.join(process.cwd(), "app/study/lucky/session/page.tsx"),
      "utf8",
    );
    expect(page).toContain("LuckyRetentionReview");
    expect(page).toContain("StudySessionRunner");
    expect(page).toContain("LUCKY_STORAGE_KEY");
  });

  it("review UI is one-at-a-time and does not dump answers", () => {
    const ui = readFileSync(
      path.join(
        process.cwd(),
        "src/components/study/LuckyRetentionReview.tsx",
      ),
      "utf8",
    );
    expect(ui).toContain("one at a time");
    expect(ui).not.toMatch(/correctAnswer|explanation|tutoring/i);
    expect(ui).toContain("data-lucky-retention-result");
  });

  it("does not redesign CORE/SIX or replace SM-2/Lucky planner engine", () => {
    const review = readFileSync(
      path.join(process.cwd(), "src/lib/learning/retention/review.ts"),
      "utf8",
    );
    expect(review).toContain("recordRetentionOutcome");
    expect(review).not.toMatch(/fsrs|applySm2Review|CoreNotesWorkspace/i);
    const luckyEngine = readFileSync(
      path.join(process.cwd(), "src/lib/csl/lucky-engine.ts"),
      "utf8",
    );
    expect(luckyEngine).toContain("buildLuckySession");
  });
});
