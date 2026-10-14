/**
 * 2P-16 — Optional content enrichment metadata (additive, never mandatory).
 *
 * Misconception targets and accessibility hints improve authored quality.
 * They do not select mechanisms, write evidence, or create subject engines.
 */

/** Soft misconception tags for scaffolds / authoring — not Orchestrator diagnoses. */
export type ContentMisconceptionTarget = string;

/**
 * Optional accessibility hints on a catalog row.
 * Complements user-level persona hooks — does not replace them.
 */
export type ContentAccessibilityMeta = {
  /** Plain-language / screen-reader friendly task summary. */
  altDescription?: string;
  /** Author suggests reduced visual/procedural complexity for this item. */
  reducedComplexity?: boolean;
  /** Soft hint that extended time may help (not a policy engine). */
  extendedTimeSuggested?: boolean;
  /** Optional keyboard/touch note for authors/UI. */
  interactionNote?: string;
};

export type ContentEnrichmentFields = {
  misconceptionTargets?: readonly ContentMisconceptionTarget[];
  accessibility?: ContentAccessibilityMeta;
};
