/**
 * 2P-32 — Universal content quality contract.
 *
 * Distinguishes required / optional / not-applicable fields for Adaptive-capable
 * activities. Does NOT invent domain engines or force identical fields on every kind.
 */

import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";

export type ContentQualityFieldApplicability =
  | "required"
  | "optional"
  | "not_applicable";

export type ContentQualityFieldId =
  | "concept"
  | "activity"
  | "purpose"
  | "stage"
  | "difficulty"
  | "prompt"
  | "expectedLearningOutcome"
  | "successCriteria"
  | "misconceptions"
  | "scaffolding"
  | "variation"
  | "accessibility"
  | "sourceAlignment"
  | "evaluation";

export type ContentQualityFieldSpec = {
  field: ContentQualityFieldId;
  /** Default applicability for Adaptive-capable Universal Activities. */
  adaptiveDefault: ContentQualityFieldApplicability;
  notes: string;
};

/**
 * Universal quality field contract — Activity-kind overrides applied via
 * `contentQualityApplicabilityForKind`.
 */
export function contentQualityFieldContract(): readonly ContentQualityFieldSpec[] {
  return [
    {
      field: "concept",
      adaptiveDefault: "required",
      notes:
        "Map to a universal Concept via progression conceptKey and/or conceptHints. Intentionally generic warmups may be optional if documented.",
    },
    {
      field: "activity",
      adaptiveDefault: "required",
      notes: "Universal Activity kind + contentId identity.",
    },
    {
      field: "purpose",
      adaptiveDefault: "required",
      notes: "Meaningful objective — not placeholder text.",
    },
    {
      field: "stage",
      adaptiveDefault: "required",
      notes:
        "Progression stage when Adaptive-selected via progression catalog. N/A for standalone product launch without progression.",
    },
    {
      field: "difficulty",
      adaptiveDefault: "required",
      notes: "Cognitive/task difficulty 1–5 on progression — not stage ordinal alone.",
    },
    {
      field: "prompt",
      adaptiveDefault: "required",
      notes: "Learner-facing task (descriptor.task / challenge prompt).",
    },
    {
      field: "expectedLearningOutcome",
      adaptiveDefault: "required",
      notes: "Aligned with objective; may share objective text when specific enough.",
    },
    {
      field: "successCriteria",
      adaptiveDefault: "required",
      notes:
        "Activity-specific: tests/patterns (coding), expectedRows (sql), rubric criteria (structured).",
    },
    {
      field: "misconceptions",
      adaptiveDefault: "optional",
      notes:
        "Actionable targets only. Soft tags — never learner diagnosis by themselves.",
    },
    {
      field: "scaffolding",
      adaptiveDefault: "optional",
      notes: "Removable HINT/STEP/… support. Prefer less scaffolding at higher difficulty.",
    },
    {
      field: "variation",
      adaptiveDefault: "optional",
      notes: "contextVariant / alternate contentIds for anti-memorization.",
    },
    {
      field: "accessibility",
      adaptiveDefault: "optional",
      notes: "ContentAccessibilityMeta — presentation hints, not diagnosis.",
    },
    {
      field: "sourceAlignment",
      adaptiveDefault: "optional",
      notes: "Optional 2P-27/28 material alignment — not a CourseContent engine.",
    },
    {
      field: "evaluation",
      adaptiveDefault: "required",
      notes: "Deterministic evaluation mode present on descriptor.",
    },
  ];
}

const STRUCTURED_KINDS = new Set<UniversalContentActivityKind>([
  "lab",
  "simulation",
  "writing",
  "presentation",
  "game",
  "project",
]);

/**
 * Kind-specific applicability overrides (still one contract — not per-domain engines).
 */
export function contentQualityApplicabilityForKind(
  kind: UniversalContentActivityKind,
  field: ContentQualityFieldId,
): ContentQualityFieldApplicability {
  const base =
    contentQualityFieldContract().find((f) => f.field === field)?.adaptiveDefault ??
    "optional";

  if (field === "successCriteria") {
    if (kind === "coding" || kind === "sql" || STRUCTURED_KINDS.has(kind)) {
      return "required";
    }
  }

  if (field === "misconceptions" || field === "scaffolding") {
    // Recommended quality depth for Adaptive seeds; still optional for legacy warmups.
    return "optional";
  }

  if (field === "sourceAlignment") {
    return "optional";
  }

  return base;
}

export function contentQualityContractTruthSummary(): {
  distinguishesRequiredOptionalNa: true;
  misconceptionsAreTargetsNotDiagnoses: true;
  contentIsNotActivity: true;
  doesNotCreateDomainEngines: true;
} {
  return {
    distinguishesRequiredOptionalNa: true,
    misconceptionsAreTargetsNotDiagnoses: true,
    contentIsNotActivity: true,
    doesNotCreateDomainEngines: true,
  };
}
