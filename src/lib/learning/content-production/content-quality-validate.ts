/**
 * 2P-32 — Deterministic content quality validation.
 *
 * Rejects placeholder quality metadata and malformed Adaptive-capable rows.
 * Does not write evidence/mastery. Does not diagnose learners from misconception tags.
 */

import {
  getActivityContentDescriptor,
  listActivityContentDescriptors,
  type UniversalContentActivityKind,
} from "@/lib/learning/activities/content-contract";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { CONTENT_PROGRESSION_CATALOG } from "@/lib/learning/content-progression/catalog";
import {
  LEARNING_CONTENT_STAGES,
  type ContentDifficulty,
  type LearningContentStage,
} from "@/lib/learning/content-progression/types";
import { isMeaningfulObjective } from "@/lib/learning/content-pipeline/characteristics";
import { normalizeLearningScaffolds } from "@/lib/learning/scaffolding/normalize";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";
import type { CatalogIntegrityIssue } from "./types";

const PLACEHOLDER_SUCCESS = [
  /^complete the activity successfully\.?$/i,
  /^finish the task\.?$/i,
  /^do the activity\.?$/i,
  /^submit your answer\.?$/i,
  /^complete successfully\.?$/i,
];

const PLACEHOLDER_MISCONCEPTION = [
  /^learner may misunderstand/i,
  /^common misconception$/i,
  /^misunderstands this\.?$/i,
  /^students get this wrong$/i,
];

const VALID_STAGES = new Set<string>(LEARNING_CONTENT_STAGES);

const UA_KINDS: UniversalContentActivityKind[] = [
  "coding",
  "sql",
  "lab",
  "simulation",
  "writing",
  "project",
  "presentation",
  "game",
];

export function isMeaningfulSuccessLooksLike(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const t = text.trim();
  if (t.length < 24) return false;
  return !PLACEHOLDER_SUCCESS.some((re) => re.test(t));
}

export function isActionableMisconception(text: string): boolean {
  const t = text.trim();
  if (t.length < 12) return false;
  return !PLACEHOLDER_MISCONCEPTION.some((re) => re.test(t));
}

function loadChallenge(kind: UniversalContentActivityKind, contentId: string) {
  if (kind === "coding") return getCodingChallenge(contentId);
  if (kind === "sql") return getSqlChallenge(contentId);
  return getStructuredChallenge(contentId);
}

/**
 * Validate a single Adaptive-capable catalog + optional progression pairing.
 */
export function validateContentQualityItem(input: {
  activityKind: UniversalContentActivityKind;
  contentId: string;
  /** When true, require progression + stronger quality for Adaptive-ready depth. */
  requireAdaptiveDepth?: boolean;
}): CatalogIntegrityIssue[] {
  const issues: CatalogIntegrityIssue[] = [];
  const ref = `${input.activityKind}:${input.contentId}`;

  if (!UA_KINDS.includes(input.activityKind)) {
    issues.push({
      code: "unsupported_activity_type",
      message: `Unsupported Universal Activity kind: ${input.activityKind}`,
      ref,
    });
    return issues;
  }

  const descriptor = getActivityContentDescriptor(
    input.activityKind,
    input.contentId,
  );
  if (!descriptor) {
    issues.push({
      code: "missing_concept",
      message: "Catalog content not found (cannot map concept/activity).",
      ref,
    });
    return issues;
  }

  if (!isMeaningfulObjective(descriptor.objective)) {
    issues.push({
      code: "weak_objective",
      message: "Objective is missing, too short, or placeholder.",
      ref,
    });
  }
  if (!descriptor.task.trim() || descriptor.task.trim().length < 20) {
    issues.push({
      code: "weak_task",
      message: "Prompt/task is missing or too short.",
      ref,
    });
  }
  if (!descriptor.evaluationMode) {
    issues.push({
      code: "malformed_evaluation",
      message: "Missing evaluation mode on descriptor.",
      ref,
    });
  }

  const challenge = loadChallenge(input.activityKind, input.contentId);
  if (!challenge) {
    issues.push({
      code: "missing_catalog_content",
      message: "Challenge row missing for contentId.",
      ref,
    });
    return issues;
  }

  // Success criteria by mechanism
  if (input.activityKind === "coding") {
    const c = getCodingChallenge(input.contentId)!;
    const hasTests = (c.tests?.length ?? 0) > 0;
    const hasPatterns = (c.requiredPatterns?.length ?? 0) > 0;
    if (!hasTests && !hasPatterns) {
      issues.push({
        code: "missing_success_criteria",
        message: "Coding challenge needs tests or requiredPatterns.",
        ref,
      });
    }
  } else if (input.activityKind === "sql") {
    const c = getSqlChallenge(input.contentId)!;
    if (!c.expectedRows?.length) {
      issues.push({
        code: "missing_success_criteria",
        message: "SQL challenge missing expectedRows.",
        ref,
      });
    }
  } else {
    const c = getStructuredChallenge(input.contentId)!;
    if (!c.criteria?.length) {
      issues.push({
        code: "missing_success_criteria",
        message: "Structured challenge missing rubric criteria.",
        ref,
      });
    }
  }

  const successLooksLike =
    "successLooksLike" in challenge
      ? (challenge as { successLooksLike?: string }).successLooksLike
      : undefined;
  if (successLooksLike != null && successLooksLike.trim()) {
    if (!isMeaningfulSuccessLooksLike(successLooksLike)) {
      issues.push({
        code: "placeholder_success_criteria",
        message: "successLooksLike is placeholder or too vague.",
        ref,
      });
    }
  }

  const misconceptions =
    "misconceptionTargets" in challenge
      ? ((challenge as { misconceptionTargets?: readonly string[] })
          .misconceptionTargets ?? [])
      : [];
  for (const m of misconceptions) {
    if (!isActionableMisconception(m)) {
      issues.push({
        code: "broken_misconception_reference",
        message: `Non-actionable misconception target: "${m}"`,
        ref,
      });
    }
  }

  const scaffolds =
    "scaffolds" in challenge
      ? (challenge as { scaffolds?: unknown }).scaffolds
      : undefined;
  if (scaffolds != null) {
    if (!Array.isArray(scaffolds)) {
      issues.push({
        code: "malformed_scaffolds",
        message: "Scaffolds must be an array when present.",
        ref,
      });
    } else {
      const normalized = normalizeLearningScaffolds(
        scaffolds as Parameters<typeof normalizeLearningScaffolds>[0],
      );
      if (scaffolds.length > 0 && normalized.length === 0) {
        issues.push({
          code: "malformed_scaffolds",
          message: "All scaffold entries invalid after normalization.",
          ref,
        });
      }
    }
  }

  const accessibility =
    "accessibility" in challenge
      ? (challenge as { accessibility?: { altDescription?: string } }).accessibility
      : undefined;
  if (accessibility != null && typeof accessibility !== "object") {
    issues.push({
      code: "invalid_accessibility_metadata",
      message: "accessibility must be an object when present.",
      ref,
    });
  }
  if (
    accessibility?.altDescription != null &&
    accessibility.altDescription.trim().length > 0 &&
    accessibility.altDescription.trim().length < 12
  ) {
    issues.push({
      code: "invalid_accessibility_metadata",
      message: "accessibility.altDescription too short to be useful.",
      ref,
    });
  }

  const progressionEntries = CONTENT_PROGRESSION_CATALOG.filter(
    (e) => e.contentId === input.contentId,
  );
  for (const e of progressionEntries) {
    if (!VALID_STAGES.has(e.stage)) {
      issues.push({
        code: "invalid_stage",
        message: `Invalid stage: ${e.stage}`,
        ref: e.contentKey,
      });
    }
    const d = e.difficulty as ContentDifficulty;
    if (d < 1 || d > 5 || !Number.isInteger(d)) {
      issues.push({
        code: "invalid_difficulty",
        message: `Invalid difficulty: ${e.difficulty}`,
        ref: e.contentKey,
      });
    }
    if (!e.contextVariant?.trim()) {
      issues.push({
        code: "invalid_variation",
        message: "Progression entry missing contextVariant.",
        ref: e.contentKey,
      });
    }
    if (!e.contentVersion?.trim()) {
      issues.push({
        code: "invalid_content_version",
        message: "Progression entry missing contentVersion.",
        ref: e.contentKey,
      });
    }
  }

  if (input.requireAdaptiveDepth) {
    if (!isAdaptiveReadyActivityAdapterKey(input.activityKind)) {
      issues.push({
        code: "adaptive_not_ready",
        message: "Activity kind is not Adaptive-bind ready.",
        ref,
      });
    }
    if (progressionEntries.length === 0) {
      issues.push({
        code: "no_progression_entry",
        message: "Adaptive depth requires at least one progression entry.",
        ref,
      });
    }
    const hints =
      "conceptHints" in challenge
        ? ((challenge as { conceptHints?: readonly string[] }).conceptHints ?? [])
        : [];
    const hasConcept =
      hints.length > 0 ||
      progressionEntries.some((e) => Boolean(e.conceptKey?.trim()));
    if (!hasConcept) {
      issues.push({
        code: "missing_concept",
        message: "Adaptive depth requires conceptKey or conceptHints.",
        ref,
      });
    }
  }

  return issues;
}

/**
 * Catalog-wide quality audit (additive to catalog-integrity).
 * Soft by default: only flags placeholders / malformations on authored fields.
 */
export function auditContentQuality(): CatalogIntegrityIssue[] {
  const issues: CatalogIntegrityIssue[] = [];

  for (const kind of UA_KINDS) {
    for (const d of listActivityContentDescriptors(kind)) {
      issues.push(
        ...validateContentQualityItem({
          activityKind: kind,
          contentId: d.contentId,
          requireAdaptiveDepth: false,
        }),
      );
    }
  }

  // Progression-only checks (orphan stages / duplicate identity already in integrity)
  for (const e of CONTENT_PROGRESSION_CATALOG) {
    if (!VALID_STAGES.has(e.stage as LearningContentStage)) {
      issues.push({
        code: "invalid_stage",
        message: `Invalid stage on progression: ${String(e.stage)}`,
        ref: e.contentKey,
      });
    }
  }

  return issues;
}

/** Deduped quality issues (same code+ref once). */
export function auditContentQualityUnique(): CatalogIntegrityIssue[] {
  const seen = new Set<string>();
  const out: CatalogIntegrityIssue[] = [];
  for (const issue of auditContentQuality()) {
    const key = `${issue.code}:${issue.ref ?? ""}:${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  return out;
}

export function contentQualityValidationTruthSummary(): {
  doesNotWriteEvidence: true;
  doesNotWriteMastery: true;
  misconceptionsAreNotDiagnoses: true;
  rejectsPlaceholderSuccess: true;
} {
  return {
    doesNotWriteEvidence: true,
    doesNotWriteMastery: true,
    misconceptionsAreNotDiagnoses: true,
    rejectsPlaceholderSuccess: true,
  };
}
