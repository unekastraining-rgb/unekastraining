/**
 * 2P-15 — Catalog integrity audit (inspection aid).
 *
 * Detects meaningful authoring gaps across progression + activity catalogs.
 * Does not mutate content or block runtime launches.
 */

import {
  getActivityContentDescriptor,
  listActivityContentDescriptors,
  type UniversalContentActivityKind,
} from "@/lib/learning/activities/content-contract";
import { CONTENT_PROGRESSION_CATALOG } from "@/lib/learning/content-progression/catalog";
import { normalizeLearningScaffolds } from "@/lib/learning/scaffolding/normalize";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { isMeaningfulObjective } from "@/lib/learning/content-pipeline/characteristics";
import {
  isActionableMisconception,
  isMeaningfulSuccessLooksLike,
} from "./content-quality-validate";
import type { CatalogIntegrityIssue } from "./types";

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

function scaffoldIssuesForChallenge(
  ref: string,
  scaffolds: unknown,
): CatalogIntegrityIssue[] {
  if (scaffolds == null) return [];
  if (!Array.isArray(scaffolds)) {
    return [
      {
        code: "malformed_scaffolds",
        message: "Scaffolds must be an array when present.",
        ref,
      },
    ];
  }
  const normalized = normalizeLearningScaffolds(scaffolds);
  if (scaffolds.length > 0 && normalized.length === 0) {
    return [
      {
        code: "malformed_scaffolds",
        message: "All scaffold entries were invalid after normalization.",
        ref,
      },
    ];
  }
  return [];
}

/**
 * Audit representative catalogs for duplicate identity and missing contract fields.
 */
export function auditCatalogIntegrity(): CatalogIntegrityIssue[] {
  const issues: CatalogIntegrityIssue[] = [];

  const contentKeys = new Map<string, number>();
  for (const entry of CONTENT_PROGRESSION_CATALOG) {
    contentKeys.set(entry.contentKey, (contentKeys.get(entry.contentKey) ?? 0) + 1);
  }
  for (const [key, count] of contentKeys) {
    if (count > 1) {
      issues.push({
        code: "duplicate_content_key",
        message: `contentKey appears ${count} times in progression catalog.`,
        ref: key,
      });
    }
  }

  for (const entry of CONTENT_PROGRESSION_CATALOG) {
    if (!entry.objective.trim()) {
      issues.push({
        code: "missing_objective",
        message: "Progression entry missing objective.",
        ref: entry.contentKey,
      });
    }
    if (entry.activityKind !== "six" && !entry.contentId) {
      issues.push({
        code: "missing_content_id",
        message: "Non-SIX progression entry must reference catalog contentId.",
        ref: entry.contentKey,
      });
    }
    if (entry.activityKind !== "six" && entry.contentId) {
      const d = getActivityContentDescriptor(entry.activityKind, entry.contentId);
      if (!d) {
        issues.push({
          code: "missing_catalog_content",
          message: "Progression contentId not found in activity catalog.",
          ref: `${entry.contentKey}→${entry.contentId}`,
        });
      }
    }
  }

  for (const kind of UA_KINDS) {
    const ids = new Map<string, number>();
    for (const d of listActivityContentDescriptors(kind)) {
      ids.set(d.contentId, (ids.get(d.contentId) ?? 0) + 1);
      if (!d.objective.trim()) {
        issues.push({
          code: "missing_objective",
          message: "Catalog descriptor missing objective.",
          ref: `${kind}:${d.contentId}`,
        });
      }
      if (!d.task.trim()) {
        issues.push({
          code: "missing_task",
          message: "Catalog descriptor missing task/prompt.",
          ref: `${kind}:${d.contentId}`,
        });
      }
      if (!d.evaluationMode) {
        issues.push({
          code: "missing_evaluation",
          message: "Catalog descriptor missing evaluation mode.",
          ref: `${kind}:${d.contentId}`,
        });
      }
    }
    for (const [id, count] of ids) {
      if (count > 1) {
        issues.push({
          code: "duplicate_content_id",
          message: `contentId appears ${count} times in ${kind} catalog.`,
          ref: id,
        });
      }
    }
  }

  for (const c of listActivityContentDescriptors("coding")) {
    const raw = getCodingChallenge(c.contentId);
    issues.push(...scaffoldIssuesForChallenge(`coding:${c.contentId}`, raw?.scaffolds));
    if (raw?.successLooksLike && !isMeaningfulSuccessLooksLike(raw.successLooksLike)) {
      issues.push({
        code: "placeholder_success_criteria",
        message: "Coding successLooksLike is placeholder or too vague.",
        ref: `coding:${c.contentId}`,
      });
    }
    for (const m of raw?.misconceptionTargets ?? []) {
      if (!isActionableMisconception(m)) {
        issues.push({
          code: "broken_misconception_reference",
          message: `Non-actionable misconception: "${m}"`,
          ref: `coding:${c.contentId}`,
        });
      }
    }
    if (c.objective && !isMeaningfulObjective(c.objective)) {
      issues.push({
        code: "weak_objective",
        message: "Coding objective is placeholder or too short.",
        ref: `coding:${c.contentId}`,
      });
    }
  }
  for (const c of listActivityContentDescriptors("sql")) {
    const raw = getSqlChallenge(c.contentId);
    issues.push(...scaffoldIssuesForChallenge(`sql:${c.contentId}`, raw?.scaffolds));
    if (raw?.successLooksLike && !isMeaningfulSuccessLooksLike(raw.successLooksLike)) {
      issues.push({
        code: "placeholder_success_criteria",
        message: "SQL successLooksLike is placeholder or too vague.",
        ref: `sql:${c.contentId}`,
      });
    }
    for (const m of raw?.misconceptionTargets ?? []) {
      if (!isActionableMisconception(m)) {
        issues.push({
          code: "broken_misconception_reference",
          message: `Non-actionable misconception: "${m}"`,
          ref: `sql:${c.contentId}`,
        });
      }
    }
  }
  for (const kind of [
    "writing",
    "lab",
    "simulation",
    "game",
    "project",
    "presentation",
  ] as const) {
    for (const c of listActivityContentDescriptors(kind)) {
      const raw = getStructuredChallenge(c.contentId);
      issues.push(
        ...scaffoldIssuesForChallenge(`${kind}:${c.contentId}`, raw?.scaffolds),
      );
      if (raw && raw.criteria.length === 0) {
        issues.push({
          code: "missing_success_criteria",
          message: "Structured challenge missing rubric criteria.",
          ref: `${kind}:${c.contentId}`,
        });
      }
      if (raw?.successLooksLike && !isMeaningfulSuccessLooksLike(raw.successLooksLike)) {
        issues.push({
          code: "placeholder_success_criteria",
          message: "Structured successLooksLike is placeholder or too vague.",
          ref: `${kind}:${c.contentId}`,
        });
      }
      for (const m of raw?.misconceptionTargets ?? []) {
        if (!isActionableMisconception(m)) {
          issues.push({
            code: "broken_misconception_reference",
            message: `Non-actionable misconception: "${m}"`,
            ref: `${kind}:${c.contentId}`,
          });
        }
      }
    }
  }

  return issues;
}

/** True when audit finds no blocking integrity issues. */
export function catalogIntegrityOk(): boolean {
  return auditCatalogIntegrity().length === 0;
}
