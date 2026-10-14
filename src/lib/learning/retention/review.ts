import type {
  RetentionItem,
  RetentionOutcome,
  RetentionSourceType,
} from "@/generated/prisma";

import { db } from "@/lib/db";
import { buildEvidenceEnvelope } from "@/lib/learning/evidence/envelope";
import { recordEvidence } from "@/lib/learning/evidence/record";
import { ensureLearningObject } from "@/lib/learning/learning-object/ensure";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";
import {
  selectRetentionCandidates,
  toRetentionCandidate,
} from "@/lib/learning/retention/candidates";
import {
  classifyRetentionHorizon,
  retentionHorizonLabel,
  type RetentionHorizonState,
} from "@/lib/learning/retention/horizon";
import { retentionReasonLabel } from "@/lib/learning/retention/reason-copy";
import { findDueRetentionItems } from "@/lib/learning/retention/service";
import { recordRetentionOutcome } from "@/lib/learning/retention/service";
import type { RetentionReason } from "@/lib/learning/retention/types";
import {
  gradeRetentionVariantText,
  pickRetentionVariant,
  resolveConceptKeyForRetention,
  type RetentionVariantPrompt,
} from "@/lib/learning/retention/variants";
import { gradeObjectiveQuestion, parseAnswer } from "@/lib/quizzes/types";

/** Learner-facing review card — no DB enums or source internals. */
export type RetentionReviewInputMode = "text" | "choice" | "self_rate";

export interface RetentionReviewItemView {
  retentionItemId: string;
  prompt: string;
  inputMode: RetentionReviewInputMode;
  options?: string[];
  conceptTitle?: string | null;
  sourceLabel: string;
  /** Friendly why-this-review — never engine jargon. */
  reasonLabel?: string;
  /** 2P-52 read-side horizon — not a forgetting diagnosis. */
  horizonState?: RetentionHorizonState;
  horizonLabel?: string;
}

export interface RetentionReviewSubmitResult {
  outcome: RetentionOutcome;
  score: number;
  /** Score/result focus — no correct answer or tutoring dump. */
  resultLabel: string;
  next: RetentionReviewItemView | null;
}

type ResolvedContent = {
  prompt: string;
  inputMode: RetentionReviewInputMode;
  options?: string[];
  sourceLabel: string;
  conceptTitle?: string | null;
  reason: RetentionReason;
  variantId?: string;
  contextVariant?: string;
  /** Internal grading only — never sent to client. */
  grade: (answer: string | string[] | boolean | undefined) => {
    outcome: RetentionOutcome;
    score: number;
  };
};

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

function sourceLabel(type: RetentionSourceType): string {
  switch (type) {
    case "MISSED_QUESTION":
      return "Missed question";
    case "FLASHCARD":
      return "Flashcard";
    case "WEAK_MASTERY":
      return "Concept review";
    default:
      return "Retention review";
  }
}

function selfRateOutcome(
  rating: string | undefined,
): { outcome: RetentionOutcome; score: number } {
  const r = String(rating ?? "").toUpperCase();
  if (r === "EASY" || r === "SUCCESS") return { outcome: "SUCCESS", score: 1 };
  if (r === "GOOD" || r === "PARTIAL") return { outcome: "PARTIAL", score: 0.75 };
  return { outcome: "FAIL", score: 0.35 };
}

function variantContent(
  variant: RetentionVariantPrompt,
  label: string,
  reason: RetentionReason,
  conceptTitle?: string | null,
): ResolvedContent {
  return {
    prompt: variant.prompt,
    inputMode: variant.inputMode,
    options: variant.options,
    sourceLabel: label,
    conceptTitle: conceptTitle ?? null,
    reason,
    variantId: variant.id,
    contextVariant: variant.contextVariant,
    grade: (answer) => {
      if (variant.inputMode === "self_rate") {
        return selfRateOutcome(
          Array.isArray(answer) ? answer[0] : String(answer ?? ""),
        );
      }
      const text = Array.isArray(answer) ? answer.join(" ") : String(answer ?? "");
      return gradeRetentionVariantText(variant, text);
    },
  };
}

async function resolveRetentionContent(
  item: RetentionItem,
): Promise<ResolvedContent | null> {
  const candidate = toRetentionCandidate(item);
  const meta = parseMetadata(item.metadataJson);
  const lastVariantId =
    typeof meta.lastVariantId === "string" ? meta.lastVariantId : null;
  const misconceptionSignals = candidate.misconceptionSignals;

  if (item.sourceType === "MISSED_QUESTION") {
    const missed = await db.missedQuestion.findFirst({
      where: { id: item.sourceRef, userId: item.userId },
    });
    if (!missed) return null;

    // After a miss, prefer a concept-aligned variant when available (avoid identical forever).
    if (
      (item.lastOutcome === "FAIL" || (item.reviewCount ?? 0) > 0) &&
      item.conceptId
    ) {
      const concept = await db.concept.findFirst({
        where: { id: item.conceptId, userId: item.userId },
      });
      const conceptKey = resolveConceptKeyForRetention({
        conceptKey:
          typeof meta.conceptKey === "string" ? meta.conceptKey : null,
        conceptTitle: concept?.title ?? missed.prompt.slice(0, 80),
      });
      if (conceptKey) {
        const variant = pickRetentionVariant({
          conceptKey,
          difficulty: candidate.difficulty,
          lastVariantId,
          misconceptionHints: misconceptionSignals,
        });
        if (variant && variant.id !== lastVariantId) {
          return variantContent(
            variant,
            sourceLabel("MISSED_QUESTION"),
            candidate.reason,
            concept?.title,
          );
        }
      }
    }

    let options: string[] | undefined;
    if (missed.options) {
      try {
        const parsed = JSON.parse(missed.options) as unknown;
        if (Array.isArray(parsed)) options = parsed.map(String);
      } catch {
        options = undefined;
      }
    }

    const inputMode: RetentionReviewInputMode = options?.length
      ? "choice"
      : "text";

    return {
      prompt: missed.prompt,
      inputMode,
      options,
      sourceLabel: sourceLabel("MISSED_QUESTION"),
      reason: candidate.reason,
      grade: (answer) => {
        if (answer === undefined || answer === "") {
          return { outcome: "FAIL", score: 0 };
        }
        const isCorrect = gradeObjectiveQuestion(
          missed.questionType,
          missed.correctAnswer,
          answer,
        );
        return {
          outcome: isCorrect ? "SUCCESS" : "FAIL",
          score: isCorrect ? 1 : 0,
        };
      },
    };
  }

  if (item.sourceType === "FLASHCARD") {
    const card = await db.flashcard.findFirst({
      where: { id: item.sourceRef, userId: item.userId },
    });
    if (!card) return null;

    return {
      prompt: card.front,
      inputMode: "self_rate",
      sourceLabel: sourceLabel("FLASHCARD"),
      reason: candidate.reason,
      grade: (answer) => {
        const asText = Array.isArray(answer) ? answer.join(" ") : String(answer ?? "");
        const upper = asText.toUpperCase();
        if (upper === "AGAIN" || upper === "GOOD" || upper === "EASY") {
          return selfRateOutcome(upper);
        }
        const expected = String(parseAnswer(card.back)).trim().toLowerCase();
        const got = asText.trim().toLowerCase();
        if (got && expected && got === expected) {
          return { outcome: "SUCCESS", score: 1 };
        }
        if (got && expected && expected.includes(got) && got.length >= 3) {
          return { outcome: "PARTIAL", score: 0.7 };
        }
        return { outcome: "FAIL", score: 0.35 };
      },
    };
  }

  if (item.sourceType === "WEAK_MASTERY") {
    const concept = await db.concept.findFirst({
      where: { id: item.conceptId ?? item.sourceRef, userId: item.userId },
    });
    if (!concept) return null;

    const conceptKey = resolveConceptKeyForRetention({
      conceptKey: typeof meta.conceptKey === "string" ? meta.conceptKey : null,
      conceptTitle: concept.title,
    });

    if (conceptKey) {
      const variant = pickRetentionVariant({
        conceptKey,
        difficulty: candidate.difficulty,
        lastVariantId,
        misconceptionHints: misconceptionSignals,
      });
      if (variant) {
        return variantContent(
          variant,
          sourceLabel("WEAK_MASTERY"),
          candidate.reason,
          concept.title,
        );
      }
    }

    return {
      prompt: `How well can you recall “${concept.title}” right now?`,
      inputMode: "self_rate",
      conceptTitle: concept.title,
      sourceLabel: sourceLabel("WEAK_MASTERY"),
      reason: candidate.reason,
      grade: (answer) =>
        selfRateOutcome(
          Array.isArray(answer) ? answer[0] : String(answer ?? ""),
        ),
    };
  }

  // Tutor/decay etc. — no usable content yet.
  return null;
}

function toView(
  item: RetentionItem,
  content: ResolvedContent,
  now: Date = new Date(),
): RetentionReviewItemView {
  const horizonState = classifyRetentionHorizon(item.dueAt, now);
  return {
    retentionItemId: item.id,
    prompt: content.prompt,
    inputMode: content.inputMode,
    options: content.options,
    conceptTitle: content.conceptTitle ?? null,
    sourceLabel: content.sourceLabel,
    reasonLabel: retentionReasonLabel(content.reason),
    horizonState,
    horizonLabel: retentionHorizonLabel(horizonState),
  };
}

/**
 * Next due RetentionItem with resolvable content (one at a time).
 * Uses deterministic candidate selection + caps; skips missing source content.
 */
export async function getNextRetentionReviewItem(
  userId: string,
  options?: {
    excludeIds?: string[];
    now?: Date;
    avoidConceptIds?: string[];
  },
): Promise<RetentionReviewItemView | null> {
  const due = await findDueRetentionItems(userId, {
    limit: 40,
    now: options?.now,
  });
  const candidates = selectRetentionCandidates(due, {
    excludeIds: options?.excludeIds,
    avoidConceptIds: options?.avoidConceptIds,
    now: options?.now,
  });

  const byId = new Map(due.map((item) => [item.id, item]));

  const now = options?.now ?? new Date();
  for (const candidate of candidates) {
    const item = byId.get(candidate.retentionItemId);
    if (!item || item.userId !== userId) continue;
    const content = await resolveRetentionContent(item);
    if (!content) continue;
    return toView(item, content, now);
  }

  return null;
}

/**
 * Submit one retention review → outcome + Evidence + Mastery + next item.
 * Does not return correct answers or tutoring explanations.
 * On miss: requeue via schedule; prefer a different concept item next when possible.
 */
export async function submitRetentionReview(input: {
  userId: string;
  retentionItemId: string;
  answer?: string | string[] | boolean;
}): Promise<RetentionReviewSubmitResult | null> {
  const item = await db.retentionItem.findFirst({
    where: { id: input.retentionItemId, userId: input.userId },
  });
  if (!item) return null;

  const content = await resolveRetentionContent(item);
  if (!content) {
    return {
      outcome: "SKIPPED",
      score: 0,
      resultLabel: "This item could not be reviewed right now.",
      next: await getNextRetentionReviewItem(input.userId, {
        excludeIds: [item.id],
      }),
    };
  }

  const graded = content.grade(input.answer);
  const outcome = graded.outcome;
  const score = graded.score;

  await recordRetentionOutcome({
    userId: input.userId,
    retentionItemId: item.id,
    outcome,
    metadataMerge: {
      ...(content.variantId ? { lastVariantId: content.variantId } : {}),
      ...(content.contextVariant
        ? { contextVariant: content.contextVariant }
        : {}),
      ...(outcome === "FAIL" || outcome === "PARTIAL"
        ? { lastFailAt: new Date().toISOString() }
        : {}),
    },
  });

  // Best-effort ULE evidence (does not fail the retention outcome).
  try {
    const learningObject = await ensureLearningObject({
      userId: input.userId,
      type: "RETENTION_ITEM",
      title: content.prompt.slice(0, 120),
      conceptIds: item.conceptId ? [item.conceptId] : [],
      skillFacet: "RETAIN",
      sixTechnique: "active_recall",
      successCriteria: { outcome: "SUCCESS" },
      expectedEvidence: { skillFacet: "RETAIN" },
      payloadRef: {
        kind: "retention_item",
        retentionItemId: item.id,
        sourceType: item.sourceType,
        sourceRef: item.sourceRef,
      },
    });

    const envelope = buildEvidenceEnvelope({
      learnerId: input.userId,
      learningObjectId: learningObject.id,
      conceptId: item.conceptId,
      skillFacet: "RETAIN",
      outcome:
        outcome === "SUCCESS"
          ? "SUCCESS"
          : outcome === "PARTIAL"
            ? "PARTIAL"
            : outcome === "SKIPPED"
              ? "ABANDONED"
              : "FAIL",
      score,
      sourceRef: {
        kind: "lucky_retention_review",
        retentionItemId: item.id,
        sourceType: item.sourceType,
      },
      evidencePayload: {
        sourceLabel: content.sourceLabel,
        inputMode: content.inputMode,
        ...(content.variantId ? { variantId: content.variantId } : {}),
      },
      endedAt: new Date(),
    });

    await recordEvidence(envelope);
    await applyEvidenceToMastery(envelope);
  } catch (error) {
    console.error(
      "ULE retention review evidence bridge failed (outcome still saved):",
      error,
    );
  }

  // Phase 5 — optional KL recall_result when a registered concept can be resolved.
  // Does not change Lucky scheduling or ULE writes.
  try {
    const { maybeRecordLuckyKnowledgeRecall } = await import(
      "@/lib/learning/orchestrator/knowledge-loop/lucky-bridge"
    );
    await maybeRecordLuckyKnowledgeRecall({
      userId: input.userId,
      retentionItemId: item.id,
      reviewCount: item.reviewCount,
      metadataJson: item.metadataJson,
      conceptTitle: content.conceptTitle,
      sourceLabel: content.sourceLabel,
      outcome,
    });
  } catch (klErr) {
    console.error("Phase 5 Lucky KL bridge failed (Lucky still saved):", klErr);
  }

  const resultLabel =
    outcome === "SUCCESS"
      ? "Correct — kept for later review."
      : outcome === "PARTIAL"
        ? "Partial — scheduled for sooner review."
        : outcome === "SKIPPED"
          ? "Skipped — still in your retention queue."
          : "Missed — scheduled for sooner review.";

  const next = await getNextRetentionReviewItem(input.userId, {
    excludeIds: [item.id],
    // After a miss, prefer a different concept next when the queue has one.
    avoidConceptIds:
      outcome === "FAIL" && item.conceptId ? [item.conceptId] : undefined,
  });

  return {
    outcome,
    score,
    resultLabel,
    next,
  };
}
