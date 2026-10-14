/**
 * 2P-38 — Retention candidate selection, variation, reason copy.
 */

import { describe, expect, it } from "vitest";
import type { RetentionItem } from "@/generated/prisma";

import {
  inferRetentionReason,
  retentionDifficultyForItem,
  selectRetentionCandidates,
  toRetentionCandidate,
} from "@/lib/learning/retention/candidates";
import { retentionReasonLabel } from "@/lib/learning/retention/reason-copy";
import {
  gradeRetentionVariantText,
  listRetentionVariantsForConcept,
  pickRetentionVariant,
  resolveConceptKeyForRetention,
  RETENTION_VARIANTS,
} from "@/lib/learning/retention/variants";
import { RETENTION_CANDIDATE_CAP } from "@/lib/learning/retention/types";

function item(partial: Partial<RetentionItem> & { id: string }): RetentionItem {
  return {
    userId: "user-1",
    sourceType: "WEAK_MASTERY",
    sourceRef: partial.conceptId ?? partial.id,
    conceptId: null,
    status: "DUE",
    dueAt: new Date("2026-01-01T00:00:00Z"),
    priority: 0.7,
    reviewCount: 1,
    lastOutcome: null,
    lastReviewedAt: null,
    metadataJson: "{}",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...partial,
  } as RetentionItem;
}

describe("2P-38 retention candidates", () => {
  it("infers reasons from source and metadata without inventing mastery", () => {
    expect(
      inferRetentionReason(
        item({
          id: "a",
          sourceType: "MISSED_QUESTION",
          sourceRef: "mq-1",
          lastOutcome: "FAIL",
        }),
      ),
    ).toBe("RECENT_FAILURE");

    expect(
      inferRetentionReason(
        item({
          id: "b",
          sourceType: "WEAK_MASTERY",
          sourceRef: "c1",
          metadataJson: JSON.stringify({
            misconceptionSignals: ["authn≠authz"],
          }),
        }),
      ),
    ).toBe("MISCONCEPTION");

    expect(
      inferRetentionReason(
        item({
          id: "c",
          sourceType: "WEAK_MASTERY",
          sourceRef: "c2",
          metadataJson: JSON.stringify({ fromAdaptiveCompletion: true }),
        }),
      ),
    ).toBe("ADAPTIVE_COMPLETION");
  });

  it("maps difficulty from outcomes without equating to mastery", () => {
    expect(
      retentionDifficultyForItem(
        item({ id: "f", lastOutcome: "FAIL", reviewCount: 3 }),
      ),
    ).toBe(1);
    expect(
      retentionDifficultyForItem(
        item({
          id: "s",
          lastOutcome: "SUCCESS",
          reviewCount: 3,
          metadataJson: JSON.stringify({ retain: 0.7 }),
        }),
      ),
    ).toBe(4);
  });

  it("selects with deterministic ordering, caps, and duplicate source collapse", () => {
    const items = [
      item({
        id: "z",
        sourceType: "FLASHCARD",
        sourceRef: "fc-1",
        priority: 0.6,
      }),
      item({
        id: "a",
        sourceType: "MISSED_QUESTION",
        sourceRef: "mq-1",
        priority: 0.85,
        lastOutcome: "FAIL",
      }),
      item({
        id: "b",
        sourceType: "WEAK_MASTERY",
        sourceRef: "c1",
        conceptId: "c1",
        priority: 0.7,
      }),
      item({
        id: "dup",
        sourceType: "MISSED_QUESTION",
        sourceRef: "mq-1",
        priority: 0.9,
      }),
    ];

    const first = selectRetentionCandidates(items).map((c) => c.retentionItemId);
    const second = selectRetentionCandidates(items).map((c) => c.retentionItemId);
    expect(first).toEqual(second);
    // Higher priority wins; duplicate sourceRef collapsed to one.
    expect(first[0]).toBe("dup");
    expect(first.filter((id) => id === "dup" || id === "a").length).toBe(1);
    expect(selectRetentionCandidates(items, { cap: 2 })).toHaveLength(2);
    expect(RETENTION_CANDIDATE_CAP).toBe(12);
  });

  it("returns no candidates for empty input", () => {
    expect(selectRetentionCandidates([])).toEqual([]);
  });

  it("toRetentionCandidate stays RETAIN stage", () => {
    expect(toRetentionCandidate(item({ id: "x" })).stage).toBe("RETAIN");
  });
});

describe("2P-38 retention variants", () => {
  it("lists multi-domain variants and preserves concept alignment", () => {
    expect(RETENTION_VARIANTS.length).toBeGreaterThanOrEqual(10);
    const auth = listRetentionVariantsForConcept(
      "authentication-vs-authorization",
    );
    expect(auth.length).toBeGreaterThanOrEqual(2);
    expect(auth.every((v) => v.conceptKey === "authentication-vs-authorization")).toBe(
      true,
    );
  });

  it("avoids immediate identical variant and is deterministic", () => {
    const a = pickRetentionVariant({
      conceptKey: "linear-equation-solving",
      difficulty: 2,
      lastVariantId: "retain-math-linear-a",
    });
    const b = pickRetentionVariant({
      conceptKey: "linear-equation-solving",
      difficulty: 2,
      lastVariantId: "retain-math-linear-a",
    });
    expect(a?.id).toBe(b?.id);
    expect(a?.id).not.toBe("retain-math-linear-a");
  });

  it("grades text variants without revealing answers", () => {
    const v = listRetentionVariantsForConcept("dns-vs-dhcp-diagnosis")[0]!;
    expect(gradeRetentionVariantText(v, "").outcome).toBe("FAIL");
    expect(gradeRetentionVariantText(v, "totally wrong").outcome).toBe("FAIL");
    const ok = gradeRetentionVariantText(
      v,
      "DNS failed to resolve the name while the IP path works.",
    );
    expect(ok.outcome).not.toBe("FAIL");
  });

  it("resolves concept keys from titles", () => {
    expect(
      resolveConceptKeyForRetention({ conceptTitle: "Authentication vs Authorization" }),
    ).toBe("authentication-vs-authorization");
    expect(resolveConceptKeyForRetention({ conceptTitle: "Unrelated topic" })).toBeNull();
  });
});

describe("2P-38 reason copy", () => {
  it("never exposes engine jargon to learners", () => {
    const labels = (
      [
        "WEAK_MASTERY",
        "RETENTION_GAP",
        "RECALL_GAP",
        "RECENT_FAILURE",
        "MISCONCEPTION",
        "ADAPTIVE_COMPLETION",
      ] as const
    ).map((r) => retentionReasonLabel(r));
    for (const label of labels) {
      expect(label).not.toMatch(/RETENTION_GAP|RECALL_GAP|WEAK_MASTERY|Orchestrator/i);
      expect(label.length).toBeGreaterThan(5);
    }
  });
});
