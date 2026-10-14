/**
 * 2P-28 — Learner-facing provenance labels (no DB ids).
 */

import { presentLearnerFacingProvenance } from "@/lib/learning/material-ingestion/provenance";
import type { LearningMaterialProvenance } from "./types";

export function buildMaterialProvenance(input: {
  materialTitle: string;
  section?: string | null;
  page?: string | number | null;
  heading?: string | null;
  anchor?: string | null;
}): LearningMaterialProvenance {
  const page =
    input.page == null || input.page === ""
      ? null
      : String(input.page).trim() || null;
  const section = input.section?.trim() || input.heading?.trim() || null;
  const anchor = input.anchor?.trim() || input.heading?.trim() || null;
  const presented = presentLearnerFacingProvenance({
    materialTitle: input.materialTitle,
    section,
    page,
    heading: input.heading,
  });
  return {
    label: presented.label,
    section,
    page,
    anchor,
  };
}

/** Never expose internal ids in learner-facing strings. */
export function assertLearnerFacingProvenance(label: string): boolean {
  if (!label.trim()) return false;
  if (/materialId|courseMaterialId|sourceRefId|cuid/i.test(label)) {
    return false;
  }
  // CUID-like tokens (no spaces) are not learner citations.
  if (/^[a-z]{1,5}[a-z0-9]{20,}$/i.test(label.trim()) && !/\s/.test(label)) {
    return false;
  }
  return true;
}
