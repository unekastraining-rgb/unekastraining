/**
 * Phase 8 — Source / provenance helpers.
 * Keep canonical, course, notes, external, and AI explanation distinct.
 */

import type {
  KnowledgeGroundingContext,
  KnowledgeSource,
  KnowledgeSourceKind,
  RetrievedExternalSnippet,
  RetrievedTeachingKnowledge,
  TeachingGroundingReference,
} from "@/lib/learning/knowledge/retrieval/types";

export function groundingRefToSource(
  ref: TeachingGroundingReference,
): KnowledgeSource {
  const kind: KnowledgeSourceKind =
    ref.kind === "user-note"
      ? "user-note"
      : ref.kind === "lms"
        ? "course-material"
        : "course-material";
  return {
    kind,
    id: ref.noteId ?? ref.materialId,
    title: ref.label,
    excerpt: ref.excerpt,
    confidence: "medium",
    limitations:
      kind === "user-note"
        ? ["User notes — not Knowledge Library canonical knowledge."]
        : ["Course/user material — not Knowledge Library canonical knowledge."],
  };
}

export function buildKnowledgeGroundingContext(input: {
  canonical?: KnowledgeSource;
  courseMaterials?: KnowledgeSource[];
  userNotes?: KnowledgeSource[];
  retrievedExternal?: KnowledgeSource[];
  generatedExplanation?: KnowledgeSource;
}): KnowledgeGroundingContext {
  const courseMaterials = input.courseMaterials ?? [];
  const userNotes = input.userNotes ?? [];
  const retrievedExternal = input.retrievedExternal ?? [];
  const allSources: KnowledgeSource[] = [];
  if (input.canonical) allSources.push(input.canonical);
  allSources.push(...courseMaterials, ...userNotes, ...retrievedExternal);
  if (input.generatedExplanation) allSources.push(input.generatedExplanation);
  return {
    canonical: input.canonical,
    courseMaterials,
    userNotes,
    retrievedExternal,
    generatedExplanation: input.generatedExplanation,
    allSources,
  };
}

/** Derive primary sourceKind while preserving individual sources. */
export function deriveCombinedSourceKind(
  parts: KnowledgeSourceKind[],
): KnowledgeSourceKind {
  const unique = [...new Set(parts.filter((k) => k !== "combined"))];
  if (unique.length === 0) return "general-ai";
  if (unique.length === 1) return unique[0]!;
  return "combined";
}

/**
 * Validate external snippets — reject fabricated / empty / wrong-kind entries.
 * Does not invent references.
 */
export function sanitizeExternalSnippets(
  snippets: RetrievedExternalSnippet[] | null | undefined,
): { accepted: RetrievedExternalSnippet[]; rejected: string[] } {
  const accepted: RetrievedExternalSnippet[] = [];
  const rejected: string[] = [];
  if (!snippets?.length) return { accepted, rejected };

  for (const [i, snip] of snippets.entries()) {
    if (!snip?.content?.trim() || snip.content.trim().length < 40) {
      rejected.push(`snippet-${i}-thin`);
      continue;
    }
    if (snip.source?.kind !== "retrieved-web") {
      rejected.push(`snippet-${i}-wrong-kind`);
      continue;
    }
    // Reference optional — but if present must look like a real URL or non-empty token.
    if (snip.source.reference != null) {
      const ref = snip.source.reference.trim();
      if (!ref) {
        rejected.push(`snippet-${i}-empty-reference`);
        continue;
      }
      // Reject obviously fake placeholders.
      if (/example\.com|placeholder|TODO|fake[-_]?url/i.test(ref)) {
        rejected.push(`snippet-${i}-fake-reference`);
        continue;
      }
    }
    accepted.push({
      ...snip,
      source: {
        ...snip.source,
        kind: "retrieved-web",
        // Never promote missing reference to a fabricated URL.
        reference: snip.source.reference?.trim() || undefined,
      },
      content: snip.content.trim(),
    });
  }
  return { accepted, rejected };
}

export function allowedSourceReferences(
  knowledge: Pick<
    RetrievedTeachingKnowledge,
    "sources" | "groundingContext" | "externalSnippets"
  >,
): string[] {
  const refs = new Set<string>();
  for (const s of knowledge.sources ?? []) {
    if (s.reference?.trim()) refs.add(s.reference.trim());
  }
  for (const s of knowledge.groundingContext?.allSources ?? []) {
    if (s.reference?.trim()) refs.add(s.reference.trim());
  }
  for (const snip of knowledge.externalSnippets ?? []) {
    if (snip.source.reference?.trim()) refs.add(snip.source.reference.trim());
  }
  return [...refs];
}

export function knowledgeSourceApiView(
  knowledge: Pick<
    RetrievedTeachingKnowledge,
    | "sourceKind"
    | "confidence"
    | "sources"
    | "groundingContext"
    | "sourceSummary"
    | "limitations"
  >,
): {
  kind: KnowledgeSourceKind;
  confidence: string;
  sources?: Array<{
    kind: KnowledgeSourceKind;
    title?: string;
    reference?: string;
    provider?: string;
    confidence?: string;
  }>;
  sourceSummary?: string;
} {
  return {
    kind: knowledge.sourceKind,
    confidence: knowledge.confidence,
    sourceSummary: knowledge.sourceSummary,
    sources: (knowledge.sources ?? knowledge.groundingContext?.allSources ?? [])
      .filter((s) => s.kind !== "combined")
      .slice(0, 8)
      .map((s) => ({
        kind: s.kind,
        title: s.title,
        // Only expose real references — never invent.
        reference: s.reference,
        provider: s.provider,
        confidence: s.confidence,
      })),
  };
}
