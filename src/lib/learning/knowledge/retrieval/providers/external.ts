/**
 * Phase 8 — External knowledge provider boundary.
 *
 * No in-repo web search/crawler exists. This interface allows future
 * integration without pretending General AI performed web retrieval.
 */

import type {
  ExternalKnowledgeProvider,
  NormalizedLearningTarget,
  RetrievedExternalSnippet,
} from "@/lib/learning/knowledge/retrieval/types";
import { sanitizeExternalSnippets } from "@/lib/learning/knowledge/retrieval/provenance";

/** Default provider — returns nothing (honest: no web retrieval). */
export function createNoopExternalKnowledgeProvider(): ExternalKnowledgeProvider {
  return {
    async retrieve() {
      return [];
    },
  };
}

/** Deterministic mock for integrity tests (no network). */
export function createMockExternalKnowledgeProvider(
  factory: (
    target: NormalizedLearningTarget,
  ) => RetrievedExternalSnippet[] | null,
): ExternalKnowledgeProvider {
  return {
    async retrieve(target) {
      const raw = factory(target) ?? [];
      return sanitizeExternalSnippets(raw).accepted;
    },
  };
}

/**
 * Resolve which external provider to use.
 * Never treats General AI as an external/web provider.
 */
export function resolveExternalKnowledgeProvider(
  injected?: ExternalKnowledgeProvider | null,
  disable?: boolean,
): ExternalKnowledgeProvider | null {
  if (disable) return null;
  if (injected === null) return null;
  if (injected) return injected;
  // No production web provider configured in this repository.
  return null;
}
