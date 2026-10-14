/**
 * 2P-52 — Long-horizon retention: schedule ladder, horizon labels, over-review guards.
 * Uses fake timestamps — no real multi-day waits.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  classifyRetentionHorizon,
  retentionHorizonLabel,
  retentionContinuityReason,
  longHorizonHorizonTruthSummary,
} from "@/lib/learning/retention/horizon";
import {
  nextReviewAtForOutcome,
  resolveSyncedDueAt,
  longHorizonScheduleTruthSummary,
  statusForDueAt,
} from "@/lib/learning/retention/schedule";
import { selectRetentionCandidates } from "@/lib/learning/retention/candidates";
import { pickRetentionVariant } from "@/lib/learning/retention/variants";
import type { RetentionItem } from "@/generated/prisma";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const {
  mockUpsert,
  mockFindMany,
  mockFindFirst,
  mockFindUnique,
  mockUpdate,
} = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    retentionItem: {
      upsert: mockUpsert,
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
      update: mockUpdate,
      count: vi.fn(),
    },
  },
}));

import {
  recordRetentionOutcome,
  upsertRetentionItem,
} from "@/lib/learning/retention/service";

function baseItem(
  overrides: Partial<RetentionItem> & { id: string },
): RetentionItem {
  return {
    userId: "user-1",
    sourceType: "WEAK_MASTERY",
    sourceRef: overrides.id,
    conceptId: "c1",
    status: "DUE",
    dueAt: new Date("2026-01-01T00:00:00Z"),
    priority: 0.7,
    lastOutcome: null,
    lastReviewedAt: null,
    reviewCount: 0,
    metadataJson: "{}",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  } as RetentionItem;
}

describe("2P-52 long-horizon schedule ladder", () => {
  const from = new Date("2026-01-01T00:00:00Z");

  it("brand-new / first SUCCESS → 3 days (72h)", () => {
    const next = nextReviewAtForOutcome("SUCCESS", from, {
      priorSuccessStreak: 0,
    });
    expect(next.getTime() - from.getTime()).toBe(3 * DAY);
  });

  it("repeated SUCCESS widens: 7d → 14d → 30d", () => {
    expect(
      nextReviewAtForOutcome("SUCCESS", from, { priorSuccessStreak: 1 }).getTime() -
        from.getTime(),
    ).toBe(7 * DAY);
    expect(
      nextReviewAtForOutcome("SUCCESS", from, { priorSuccessStreak: 2 }).getTime() -
        from.getTime(),
    ).toBe(14 * DAY);
    expect(
      nextReviewAtForOutcome("SUCCESS", from, { priorSuccessStreak: 3 }).getTime() -
        from.getTime(),
    ).toBe(30 * DAY);
    expect(
      nextReviewAtForOutcome("SUCCESS", from, { priorSuccessStreak: 9 }).getTime() -
        from.getTime(),
    ).toBe(30 * DAY);
  });

  it("FAIL / PARTIAL stay short (not permanent mastery; not decay engine)", () => {
    expect(
      nextReviewAtForOutcome("FAIL", from).getTime() - from.getTime(),
    ).toBe(12 * HOUR);
    expect(
      nextReviewAtForOutcome("PARTIAL", from).getTime() - from.getTime(),
    ).toBe(24 * HOUR);
  });

  it("truth: no FSRS / no second retention / no cron", () => {
    const t = longHorizonScheduleTruthSummary();
    expect(t.inventsFSRS).toBe(false);
    expect(t.inventsSecondRetentionEngine).toBe(false);
    expect(t.noCronRequired).toBe(true);
    expect(t.noPermanentMasteryFromSpacing).toBe(true);
  });
});

describe("2P-52 retention horizon (read-side)", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("classifies NOT_DUE / UPCOMING / DUE / OVERDUE", () => {
    expect(
      classifyRetentionHorizon(new Date(now.getTime() + 5 * DAY), now),
    ).toBe("NOT_DUE");
    expect(
      classifyRetentionHorizon(new Date(now.getTime() + 12 * HOUR), now),
    ).toBe("UPCOMING");
    expect(
      classifyRetentionHorizon(new Date(now.getTime() - 2 * HOUR), now),
    ).toBe("DUE");
    expect(
      classifyRetentionHorizon(new Date(now.getTime() - 2 * DAY), now),
    ).toBe("OVERDUE");
    expect(classifyRetentionHorizon(null, now)).toBe("DUE");
  });

  it("uses neutral labels — never claims forgetting", () => {
    for (const state of [
      "NOT_DUE",
      "UPCOMING",
      "DUE",
      "OVERDUE",
    ] as const) {
      const label = retentionHorizonLabel(state);
      const reason = retentionContinuityReason(state);
      expect(label.toLowerCase()).not.toMatch(/forgot|forgotten|decay/);
      expect(reason.toLowerCase()).not.toMatch(/forgot|forgotten|decay/);
    }
    expect(longHorizonHorizonTruthSummary().inventsForgettingDiagnosis).toBe(
      false,
    );
    expect(longHorizonHorizonTruthSummary().absenceOfActivityIsNotFailure).toBe(
      true,
    );
  });
});

describe("2P-52 over-review / sync protection", () => {
  const now = new Date("2026-01-10T00:00:00Z");
  const future = new Date(now.getTime() + 14 * DAY);

  it("does not pull SUCCESS schedule earlier on sync", () => {
    const resolved = resolveSyncedDueAt({
      proposedDueAt: now,
      existingDueAt: future,
      existingLastOutcome: "SUCCESS",
      now,
    });
    expect(resolved.getTime()).toBe(future.getTime());
  });

  it("allows flashcard SM-2 authority to update schedule", () => {
    const sm2 = new Date(now.getTime() + DAY);
    const resolved = resolveSyncedDueAt({
      proposedDueAt: sm2,
      existingDueAt: future,
      existingLastOutcome: "SUCCESS",
      scheduleAuthority: "flashcard_sm2",
      now,
    });
    expect(resolved.getTime()).toBe(sm2.getTime());
  });

  it("allows FAIL items to be pulled due earlier", () => {
    const resolved = resolveSyncedDueAt({
      proposedDueAt: now,
      existingDueAt: new Date(now.getTime() + 6 * HOUR),
      existingLastOutcome: "FAIL",
      now,
    });
    expect(resolved.getTime()).toBe(now.getTime());
  });

  it("upsertRetentionItem uses sync guard (findUnique + resolve)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "ri-1",
      dueAt: future,
      lastOutcome: "SUCCESS",
      reviewCount: 2,
    });
    mockUpsert.mockResolvedValue({ id: "ri-1" });

    await upsertRetentionItem({
      userId: "user-1",
      sourceType: "WEAK_MASTERY",
      sourceRef: "c1",
      dueAt: now,
      now,
    });

    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          dueAt: future,
        }),
      }),
    );
  });
});

describe("2P-52 recordRetentionOutcome spacing + streak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SUCCESS after SUCCESS widens and stores successStreak", async () => {
    const now = new Date("2026-02-01T00:00:00Z");
    mockFindFirst.mockResolvedValue({
      id: "ri-1",
      userId: "user-1",
      reviewCount: 1,
      lastOutcome: "SUCCESS",
      metadataJson: JSON.stringify({ successStreak: 1 }),
    });
    mockUpdate.mockResolvedValue({ id: "ri-1" });

    await recordRetentionOutcome({
      userId: "user-1",
      retentionItemId: "ri-1",
      outcome: "SUCCESS",
      now,
    });

    const data = mockUpdate.mock.calls[0]![0].data;
    expect(data.dueAt.getTime() - now.getTime()).toBe(7 * DAY);
    expect(JSON.parse(data.metadataJson).successStreak).toBe(2);
    expect(data.status).toBe("ACTIVE");
  });

  it("FAIL resets successStreak and schedules soon", async () => {
    const now = new Date("2026-02-01T00:00:00Z");
    mockFindFirst.mockResolvedValue({
      id: "ri-1",
      userId: "user-1",
      reviewCount: 3,
      lastOutcome: "SUCCESS",
      metadataJson: JSON.stringify({ successStreak: 3 }),
    });
    mockUpdate.mockResolvedValue({ id: "ri-1" });

    await recordRetentionOutcome({
      userId: "user-1",
      retentionItemId: "ri-1",
      outcome: "FAIL",
      now,
    });

    const data = mockUpdate.mock.calls[0]![0].data;
    expect(data.dueAt.getTime() - now.getTime()).toBe(12 * HOUR);
    expect(JSON.parse(data.metadataJson).successStreak).toBe(0);
  });

  it("foreign retention item cannot be updated", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await recordRetentionOutcome({
      userId: "attacker",
      retentionItemId: "ri-1",
      outcome: "SUCCESS",
    });
    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("2P-52 selection prefers overdue / avoids exact variant when alternatives exist", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("overdue outranks same-reason due item", () => {
    const overdue = baseItem({
      id: "overdue",
      dueAt: new Date(now.getTime() - 3 * DAY),
      priority: 0.7,
      metadataJson: JSON.stringify({ retentionReason: "WEAK_MASTERY" }),
    });
    const due = baseItem({
      id: "due-now",
      dueAt: new Date(now.getTime() - HOUR),
      priority: 0.7,
      metadataJson: JSON.stringify({ retentionReason: "WEAK_MASTERY" }),
    });
    const picked = selectRetentionCandidates([due, overdue], { now, cap: 2 });
    expect(picked[0]?.retentionItemId).toBe("overdue");
  });

  it("pickRetentionVariant avoids lastVariantId when alternate exists", () => {
    const a = pickRetentionVariant({
      conceptKey: "linear-equation-solving",
      difficulty: 2,
      lastVariantId: null,
    });
    expect(a).toBeTruthy();
    const b = pickRetentionVariant({
      conceptKey: "linear-equation-solving",
      difficulty: 2,
      lastVariantId: a!.id,
    });
    expect(b).toBeTruthy();
    if (b && a && b.id !== a.id) {
      expect(b.id).not.toBe(a.id);
    }
  });
});

describe("2P-52 simulated return after long gap", () => {
  it("SUCCESS then +21 days → OVERDUE (gap ≠ failure claim)", () => {
    const reviewed = new Date("2026-01-01T00:00:00Z");
    const dueAt = nextReviewAtForOutcome("SUCCESS", reviewed, {
      priorSuccessStreak: 0,
    });
    const returnAt = new Date(reviewed.getTime() + 21 * DAY);
    expect(classifyRetentionHorizon(dueAt, returnAt)).toBe("OVERDUE");
    expect(statusForDueAt(dueAt, returnAt)).toBe("DUE");
    expect(retentionHorizonLabel("OVERDUE")).toBe("Worth revisiting");
  });

  it("strong recent SUCCESS is NOT_DUE and not forced into over-review", () => {
    const now = new Date("2026-01-02T00:00:00Z");
    const dueAt = nextReviewAtForOutcome("SUCCESS", now, {
      priorSuccessStreak: 2,
    });
    expect(classifyRetentionHorizon(dueAt, now)).toBe("NOT_DUE");
    expect(statusForDueAt(dueAt, now)).toBe("ACTIVE");
  });
});

describe("2P-52 architecture preservation", () => {
  it("does not invent decay/forgetting gap enums or FSRS", () => {
    const schedule = readFileSync(
      path.join(process.cwd(), "src/lib/learning/retention/schedule.ts"),
      "utf8",
    );
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    // Mentions FSRS only to reject it — must not implement.
    expect(schedule).toMatch(/not FSRS|inventsFSRS: false/);
    expect(schedule).not.toMatch(/import.*fsrs|from ["'].*fsrs/i);
    expect(diagnose).toContain("RETENTION_GAP");
    expect(diagnose).not.toMatch(/FORGETTING_GAP|DECAY_GAP|SPACING_GAP|MEMORY_GAP/);
  });

  it("Lucky GET path does not call recordEvidence", () => {
    const route = readFileSync(
      path.join(process.cwd(), "app/api/study/lucky/retention-item/route.ts"),
      "utf8",
    );
    expect(route).toContain("getNextRetentionReviewItem");
    expect(route).not.toContain("recordEvidence");
    expect(route).not.toContain("LearningAttempt");
  });
});
