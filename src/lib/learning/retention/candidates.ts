/**
 * 2P-38 — Deterministic retention candidate selection.
 * Consumes existing RetentionItems; does not invent mastery or replace Orchestrator.
 * 2P-52 — Soft overdue boost among already-due items (read-side only).
 */

import type { RetentionItem } from "@/generated/prisma";

import {
  classifyRetentionHorizon,
  type RetentionHorizonState,
} from "@/lib/learning/retention/horizon";
import {
  RETENTION_CANDIDATE_CAP,
  type RetentionCandidate,
  type RetentionDifficulty,
  type RetentionReason,
} from "@/lib/learning/retention/types";

function horizonRank(state: RetentionHorizonState): number {
  switch (state) {
    case "OVERDUE":
      return 40;
    case "DUE":
      return 30;
    case "UPCOMING":
      return 10;
    case "NOT_DUE":
      return 0;
  }
}

function parseMetadata(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.map(String).filter(Boolean);
  return out.length ? out : undefined;
}

/** Map RetentionItem + metadata → reason without calling Orchestrator. */
export function inferRetentionReason(item: RetentionItem): RetentionReason {
  const meta = parseMetadata(item.metadataJson);
  const tagged = meta.retentionReason;
  if (typeof tagged === "string") {
    const allowed: RetentionReason[] = [
      "WEAK_MASTERY",
      "RETENTION_GAP",
      "RECALL_GAP",
      "RECENT_FAILURE",
      "MISCONCEPTION",
      "DUE_REVIEW",
      "ADAPTIVE_COMPLETION",
      "MANUAL_REVIEW",
      "MISSED_QUESTION",
      "FLASHCARD_DUE",
    ];
    if (allowed.includes(tagged as RetentionReason)) {
      return tagged as RetentionReason;
    }
  }

  if (item.sourceType === "MISSED_QUESTION") {
    if (item.lastOutcome === "FAIL" || (item.reviewCount ?? 0) > 0) {
      return "RECENT_FAILURE";
    }
    return "MISSED_QUESTION";
  }
  if (item.sourceType === "FLASHCARD") return "FLASHCARD_DUE";
  if (item.sourceType === "WEAK_MASTERY") {
    if (asStringArray(meta.misconceptionSignals)?.length) return "MISCONCEPTION";
    if (meta.fromAdaptiveCompletion === true) return "ADAPTIVE_COMPLETION";
    return "WEAK_MASTERY";
  }
  return "DUE_REVIEW";
}

/**
 * Difficulty hint for variant selection — not mastery.
 * Weak / recent fail → lower; repeated success → higher.
 */
export function retentionDifficultyForItem(
  item: RetentionItem,
): RetentionDifficulty {
  const meta = parseMetadata(item.metadataJson);
  const retain =
    typeof meta.retain === "number" && Number.isFinite(meta.retain)
      ? meta.retain
      : null;

  if (item.lastOutcome === "FAIL" || item.lastOutcome === "SKIPPED") return 1;
  if (item.lastOutcome === "PARTIAL") return 2;
  if (retain !== null) {
    if (retain < 0.3) return 1;
    if (retain < 0.45) return 2;
    if (retain < 0.65) return 3;
    if (retain < 0.8) return 4;
    return 5;
  }
  if ((item.reviewCount ?? 0) === 0) return 2;
  if (item.lastOutcome === "SUCCESS" && (item.reviewCount ?? 0) >= 2) return 4;
  return 3;
}

function reasonRank(reason: RetentionReason): number {
  switch (reason) {
    case "RECENT_FAILURE":
      return 100;
    case "MISCONCEPTION":
      return 95;
    case "MISSED_QUESTION":
      return 90;
    case "RETENTION_GAP":
      return 85;
    case "RECALL_GAP":
      return 80;
    case "ADAPTIVE_COMPLETION":
      return 75;
    case "WEAK_MASTERY":
      return 70;
    case "FLASHCARD_DUE":
      return 60;
    case "DUE_REVIEW":
      return 50;
    case "MANUAL_REVIEW":
      return 40;
    default:
      return 0;
  }
}

export function toRetentionCandidate(item: RetentionItem): RetentionCandidate {
  const meta = parseMetadata(item.metadataJson);
  const reason = inferRetentionReason(item);
  return {
    retentionItemId: item.id,
    conceptId: item.conceptId ?? null,
    reason,
    difficulty: retentionDifficultyForItem(item),
    stage: "RETAIN",
    source: item.sourceType,
    sourceRef: item.sourceRef,
    contextVariant:
      typeof meta.contextVariant === "string" ? meta.contextVariant : undefined,
    misconceptionSignals: asStringArray(meta.misconceptionSignals),
    priority: item.priority,
    lastOutcome: item.lastOutcome,
    reviewCount: item.reviewCount,
  };
}

/**
 * Deterministic selection: reason rank → priority → dueAt → id.
 * Caps output. Same inputs ⇒ same order.
 */
export function selectRetentionCandidates(
  items: RetentionItem[],
  options?: {
    cap?: number;
    excludeIds?: Iterable<string>;
    /** Prefer a different item for the same concept after a miss (variation). */
    avoidConceptIds?: Iterable<string>;
    now?: Date;
  },
): RetentionCandidate[] {
  const cap = options?.cap ?? RETENTION_CANDIDATE_CAP;
  const exclude = new Set(options?.excludeIds ?? []);
  const avoidConcepts = new Set(options?.avoidConceptIds ?? []);
  const now = options?.now ?? new Date();

  const scored = items
    .filter((item) => !exclude.has(item.id))
    .map((item) => {
      const candidate = toRetentionCandidate(item);
      const conceptPenalty =
        item.conceptId && avoidConcepts.has(item.conceptId) ? -15 : 0;
      const horizon = classifyRetentionHorizon(item.dueAt, now);
      const score =
        reasonRank(candidate.reason) * 1000 +
        candidate.priority * 100 +
        horizonRank(horizon) +
        conceptPenalty -
        (item.dueAt?.getTime() ?? 0) / 1e13;
      return { item, candidate, score };
    });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.id.localeCompare(b.item.id);
  });

  const out: RetentionCandidate[] = [];
  const seenSource = new Set<string>();

  for (const row of scored) {
    if (out.length >= cap) break;
    const key = `${row.item.sourceType}:${row.item.sourceRef}`;
    if (seenSource.has(key)) continue;
    seenSource.add(key);
    out.push(row.candidate);
  }

  return out;
}
