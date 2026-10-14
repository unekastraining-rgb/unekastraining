/**
 * 2P-27 — Learner-facing provenance (not internal IDs).
 */

import type { LearnerFacingProvenance } from "./types";

export function presentLearnerFacingProvenance(input: {
  materialTitle: string;
  section?: string | null;
  page?: string | null;
  heading?: string | null;
}): LearnerFacingProvenance {
  const title = input.materialTitle.trim() || "Your material";
  const bits: string[] = [];
  if (input.section?.trim()) bits.push(input.section.trim());
  else if (input.heading?.trim()) bits.push(input.heading.trim());
  if (input.page?.trim()) bits.push(`page ${input.page.trim()}`);

  const detail = bits.length ? `, ${bits.join(", ")}` : "";
  return {
    label: `Source: ${title}${detail}`,
    materialTitle: title,
    section: input.section ?? input.heading ?? null,
    page: input.page ?? null,
  };
}
