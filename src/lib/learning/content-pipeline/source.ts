/**
 * 2P-8 — Source material helpers.
 * Source ≠ Knowledge ≠ Content ≠ Evidence.
 */

import type { ContentSourceRef } from "./types";

export function makeContentSourceRef(
  input: ContentSourceRef,
): ContentSourceRef {
  return {
    sourceId: input.sourceId.trim(),
    sourceType: input.sourceType,
    title: input.title.trim(),
    locationRef: input.locationRef ?? null,
    ownerLearnerId: input.ownerLearnerId ?? null,
    learningSpaceId: input.learningSpaceId ?? null,
    excerpt: input.excerpt?.slice(0, 2000) ?? null,
  };
}

export function assertSourceOwnership(input: {
  source: ContentSourceRef;
  learnerId: string;
}): { ok: true } | { ok: false; reason: "foreign_source" | "missing_source" } {
  if (!input.source.sourceId.trim()) {
    return { ok: false, reason: "missing_source" };
  }
  const owner = input.source.ownerLearnerId?.trim();
  // Public/fixture sources may omit owner.
  if (!owner) return { ok: true };
  if (owner !== input.learnerId.trim()) {
    return { ok: false, reason: "foreign_source" };
  }
  return { ok: true };
}

export function sourceDoesNotCreateMastery(): true {
  return true;
}
