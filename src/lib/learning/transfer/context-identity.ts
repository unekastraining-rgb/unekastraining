/**
 * 2P-46 — Context identity for transfer (read-side).
 * Concept identity ≠ activity/context surface identity.
 * Does not invent TRANSFER_GAP or a TransferEngine.
 */

export type AttemptContextIdentity = {
  contextVariant: string | null;
  contentKey: string | null;
  contentId: string | null;
  sourceKind: string | null;
};

/**
 * Parse opaque LearningAttempt.sourceRefJson for scenario/content identity.
 * Cosmetic wording is not inferred — only authored metadata fields.
 */
export function parseAttemptContextIdentity(
  sourceRefJson: string | null | undefined,
): AttemptContextIdentity {
  const empty: AttemptContextIdentity = {
    contextVariant: null,
    contentKey: null,
    contentId: null,
    sourceKind: null,
  };
  if (typeof sourceRefJson !== "string" || !sourceRefJson.trim()) return empty;
  try {
    const raw = JSON.parse(sourceRefJson) as Record<string, unknown>;
    const contextVariant =
      typeof raw.contextVariant === "string" && raw.contextVariant.trim()
        ? raw.contextVariant.trim()
        : null;
    const contentKey =
      typeof raw.contentKey === "string" && raw.contentKey.trim()
        ? raw.contentKey.trim()
        : null;
    const contentId =
      typeof raw.contentId === "string" && raw.contentId.trim()
        ? raw.contentId.trim()
        : typeof raw.id === "string" && raw.id.trim()
          ? raw.id.trim()
          : null;
    const sourceKind =
      typeof raw.kind === "string" && raw.kind.trim()
        ? raw.kind.trim()
        : null;
    return { contextVariant, contentKey, contentId, sourceKind };
  } catch {
    return empty;
  }
}

/**
 * Recent distinct contextVariant values (most recent first).
 * Deterministic; ignores empty / missing variants.
 */
export function extractRecentContextVariants(
  attempts: readonly {
    sourceRefJson?: string | null;
  }[],
  limit = 3,
): string[] {
  const out: string[] = [];
  for (const row of attempts) {
    const ctx = parseAttemptContextIdentity(row.sourceRefJson).contextVariant;
    if (!ctx) continue;
    if (out.includes(ctx)) continue;
    out.push(ctx);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Recent content keys/ids to soft-exclude when alternate content exists.
 * Emits both contentKey and contentId when present so progression + catalog filters align.
 */
export function extractRecentContentKeys(
  attempts: readonly {
    sourceRefJson?: string | null;
  }[],
  limit = 3,
): string[] {
  const out: string[] = [];
  for (const row of attempts) {
    const id = parseAttemptContextIdentity(row.sourceRefJson);
    const keys = [id.contentKey, id.contentId].filter(
      (k): k is string => typeof k === "string" && k.length > 0,
    );
    for (const key of keys) {
      if (out.includes(key)) continue;
      out.push(key);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * Soft transfer selection hints for existing progression/experience selectors.
 * Only meaningful when alternatives exist (selectors already soft-fallback).
 */
export function resolveTransferSelectionHints(
  attempts: readonly {
    sourceRefJson?: string | null;
    outcome?: string | null;
  }[],
): {
  avoidContextVariant: string | null;
  excludeContentKeys: string[];
  hasMultiContextEvidence: boolean;
} {
  const variants = extractRecentContextVariants(attempts, 5);
  const keys = extractRecentContentKeys(attempts, 5);
  return {
    avoidContextVariant: variants[0] ?? null,
    excludeContentKeys: keys,
    hasMultiContextEvidence: variants.length >= 2,
  };
}

export function transferContextIdentityTruthSummary(): {
  inventsTransferEngine: false;
  inventsTransferGap: false;
  inventsSeventhFacet: false;
  conceptEqualsActivitySurface: false;
  usesExistingSourceRefMetadata: true;
  deterministic: true;
} {
  return {
    inventsTransferEngine: false,
    inventsTransferGap: false,
    inventsSeventhFacet: false,
    conceptEqualsActivitySurface: false,
    usesExistingSourceRefMetadata: true,
    deterministic: true,
  };
}
