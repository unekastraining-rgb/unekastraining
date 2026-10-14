/**
 * Phase 7/8 — Universal Knowledge Retrieval orchestrator.
 *
 * Provider order (deterministic, relevance-aware):
 * 1. Knowledge Library (canonical — always preferred for known topics)
 * 2. Course material + user notes (grounding)
 * 3. External retrieval provider (optional — never faked by General AI)
 * 4. General AI teaching knowledge
 *
 * Does not invent lessons. Does not decide learner progression.
 * Does not treat General AI as web retrieval.
 */

import { instructionalSourceForTeaching } from "@/lib/learning/knowledge/instructional-library";
import {
  teachingContextFromRetrieved,
  retrievedFromGeneralKnowledge,
} from "@/lib/learning/knowledge/retrieval/bridge";
import {
  getRegisteredGeneralTeachingContext,
  resetGeneralTeachingRegistryForTests,
} from "@/lib/learning/knowledge/retrieval/general-identity";
import {
  isProtectedSpecializedTopic,
  normalizeLearningTarget,
} from "@/lib/learning/knowledge/retrieval/normalize-target";
import {
  buildKnowledgeGroundingContext,
  deriveCombinedSourceKind,
  groundingRefToSource,
  sanitizeExternalSnippets,
} from "@/lib/learning/knowledge/retrieval/provenance";
import { retrieveFromCourseMaterial } from "@/lib/learning/knowledge/retrieval/providers/course-material";
import {
  resolveExternalKnowledgeProvider,
} from "@/lib/learning/knowledge/retrieval/providers/external";
import {
  createAiGeneralKnowledgeProvider,
} from "@/lib/learning/knowledge/retrieval/providers/general-ai";
import { retrieveFromKnowledgeLibrary } from "@/lib/learning/knowledge/retrieval/providers/knowledge-library";
import { retrieveFromUserNote } from "@/lib/learning/knowledge/retrieval/providers/user-note";
import { validateGeneralTeachingKnowledge } from "@/lib/learning/knowledge/retrieval/validate-general-knowledge";
import type {
  KnowledgeRetrievalInput,
  KnowledgeRetrievalResult,
  KnowledgeSource,
  RetrievedTeachingKnowledge,
} from "@/lib/learning/knowledge/retrieval/types";
import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";

export {
  resetGeneralTeachingRegistryForTests,
  getRegisteredGeneralTeachingContext,
};

function mergeGroundingKnowledge(
  parts: RetrievedTeachingKnowledge[],
  extras?: {
    externalSources?: KnowledgeSource[];
    externalSnippets?: RetrievedTeachingKnowledge["externalSnippets"];
    generatedExplanation?: KnowledgeSource;
    sourceKind?: RetrievedTeachingKnowledge["sourceKind"];
  },
): RetrievedTeachingKnowledge | null {
  if (parts.length === 0) return null;
  const primary = parts[0]!;
  const concepts = parts.flatMap((p) => p.concepts);
  const seen = new Set<string>();
  const deduped = concepts.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  const grounding = parts.flatMap((p) => p.grounding ?? []);
  const courseMaterials = parts
    .flatMap((p) => p.sources ?? [])
    .filter((s) => s.kind === "course-material");
  const userNotes = parts
    .flatMap((p) => p.sources ?? [])
    .filter((s) => s.kind === "user-note");
  const kinds = [
    ...parts.map((p) => p.sourceKind),
    ...(extras?.externalSources?.length ? (["retrieved-web"] as const) : []),
    ...(extras?.generatedExplanation ? (["general-ai"] as const) : []),
  ];
  const sourceKind =
    extras?.sourceKind ??
    deriveCombinedSourceKind(kinds as RetrievedTeachingKnowledge["sourceKind"][]);

  const sources: KnowledgeSource[] = [
    ...parts.flatMap((p) => p.sources ?? []),
    ...(extras?.externalSources ?? []),
    ...(extras?.generatedExplanation ? [extras.generatedExplanation] : []),
  ];

  return {
    target: primary.target,
    sourceKind,
    title: primary.title,
    subject: primary.subject,
    domain: primary.domain,
    concepts: deduped,
    pathConceptIds: deduped.map((c) => c.id),
    grounding,
    sources,
    groundingContext: buildKnowledgeGroundingContext({
      courseMaterials,
      userNotes,
      retrievedExternal: extras?.externalSources ?? [],
      generatedExplanation: extras?.generatedExplanation,
    }),
    externalSnippets: extras?.externalSnippets,
    confidence: "medium",
    sourceSummary: sources.map((s) => s.kind).join(" + "),
    limitations: [
      ...new Set(parts.flatMap((p) => p.limitations ?? [])),
      ...(extras?.generatedExplanation
        ? ["General AI explanation is not a retrieved web source."]
        : []),
    ],
  };
}

/**
 * Retrieve teachable knowledge for a learning target.
 * Prefer Knowledge Library; never route canonical hits through weaker providers.
 */
export async function retrieveTeachingKnowledge(
  input: KnowledgeRetrievalInput,
): Promise<KnowledgeRetrievalResult> {
  const target = normalizeLearningTarget(input.target);
  if (!target) {
    return {
      ok: false,
      reason: "empty-target",
      message: "No learning target provided.",
    };
  }

  if (
    isProtectedSpecializedTopic(target.normalizedTitle) ||
    isProtectedSpecializedTopic(target.original)
  ) {
    return {
      ok: false,
      reason: "protected-specialized-path",
      message:
        "This topic uses a specialized Study Haul teaching path — not general retrieval.",
    };
  }

  // 1) Knowledge Library — always preferred for known structured topics.
  const fromLibrary = retrieveFromKnowledgeLibrary(target);
  if (fromLibrary) {
    // Optional course/note grounding can annotate without replacing KL concepts.
    const course = retrieveFromCourseMaterial(target, input);
    const notes = retrieveFromUserNote(target, input);
    if (!course && !notes) {
      return { ok: true, knowledge: fromLibrary };
    }
    const courseSources = (course?.sources ?? []).map((s) => ({
      ...s,
      kind: "course-material" as const,
    }));
    const noteSources = notes?.sources ?? [];
    return {
      ok: true,
      knowledge: {
        ...fromLibrary,
        sourceKind:
          course || notes
            ? "combined"
            : "knowledge-library",
        grounding: [
          ...(fromLibrary.grounding ?? []),
          ...(course?.grounding ?? []),
          ...(notes?.grounding ?? []),
        ],
        sources: [
          ...(fromLibrary.sources ?? []),
          ...courseSources,
          ...noteSources,
        ],
        groundingContext: buildKnowledgeGroundingContext({
          canonical: fromLibrary.sources?.[0],
          courseMaterials: courseSources,
          userNotes: noteSources,
        }),
        sourceSummary:
          "Knowledge Library concepts with optional learner material grounding.",
        limitations: [
          ...(fromLibrary.limitations ?? []),
          "Course/user material is grounding only — not promoted to Knowledge Library.",
        ],
      },
    };
  }

  // Session continuation: reuse previously retrieved general context.
  const cached = getRegisteredGeneralTeachingContext(target.slug);
  if (cached && cached.concepts.length > 0) {
    return {
      ok: true,
      knowledge: {
        target,
        sourceKind:
          (cached.knowledgeSourceKind as RetrievedTeachingKnowledge["sourceKind"]) ??
          "general-ai",
        title: cached.primaryConcept?.title ?? target.normalizedTitle,
        subject: cached.subject ?? undefined,
        domain: cached.domain,
        concepts: cached.concepts,
        pathConceptIds: cached.concepts.map((c) => c.id),
        grounding: cached.grounding,
        sources: cached.sources,
        groundingContext: cached.groundingContext,
        externalSnippets: cached.externalSnippets,
        confidence: cached.confidence ?? "medium",
        sourceSummary: cached.sourceSummary,
        limitations: cached.limitations,
      },
    };
  }

  // 2) Course material + user notes grounding.
  const fromCourse = retrieveFromCourseMaterial(target, input);
  const fromNotes = retrieveFromUserNote(target, input);
  const materialParts = [fromCourse, fromNotes].filter(
    (p): p is RetrievedTeachingKnowledge => Boolean(p),
  );

  // 3) Optional external retrieval (real provider only — never General AI).
  const externalProvider = resolveExternalKnowledgeProvider(
    input.externalProvider,
    input.disableExternalRetrieval,
  );
  let externalSnippets: RetrievedTeachingKnowledge["externalSnippets"] = [];
  let externalSources: KnowledgeSource[] = [];
  if (externalProvider) {
    try {
      const raw = await externalProvider.retrieve(target, {
        userId: input.userId,
        limit: 5,
      });
      const { accepted, rejected } = sanitizeExternalSnippets(raw);
      if (rejected.length && accepted.length === 0 && raw.length > 0) {
        return {
          ok: false,
          reason: "invalid-external-source",
          message: `External sources failed integrity checks: ${rejected.join(", ")}`,
        };
      }
      externalSnippets = accepted;
      externalSources = accepted.map((s) => s.source);
    } catch {
      externalSnippets = [];
      externalSources = [];
    }
  }

  // 4) General AI (optional / injectable).
  if (input.disableGeneralAi) {
    const merged = mergeGroundingKnowledge(materialParts, {
      externalSources,
      externalSnippets,
    });
    if (merged) return { ok: true, knowledge: merged };
    if (externalSources.length > 0) {
      // External-only without AI: not enough to teach alone without synthesis.
      return {
        ok: false,
        reason: "no-provider",
        message:
          "External sources were found but general teaching synthesis is disabled.",
      };
    }
    return {
      ok: false,
      reason: "no-provider",
      message:
        "No Knowledge Library match and general knowledge is disabled. Cannot invent a lesson.",
    };
  }

  const provider =
    input.generalProvider === null
      ? null
      : input.generalProvider ??
        (input.userId ? createAiGeneralKnowledgeProvider(input.userId) : null);

  if (!provider) {
    const merged = mergeGroundingKnowledge(materialParts, {
      externalSources,
      externalSnippets,
    });
    if (merged) return { ok: true, knowledge: merged };
    return {
      ok: false,
      reason: "no-provider",
      message:
        "No Knowledge Library match and no general knowledge provider available.",
    };
  }

  const groundingExcerpt =
    instructionalSourceForTeaching(input.groundingText ?? null)?.slice(0, 800) ??
    input.noteText?.trim().slice(0, 800) ??
    externalSnippets?.[0]?.content.slice(0, 800) ??
    null;

  let general;
  try {
    general = await provider.retrieve(target, { groundingExcerpt });
  } catch {
    general = null;
  }

  if (!general) {
    const merged = mergeGroundingKnowledge(materialParts, {
      externalSources,
      externalSnippets,
    });
    if (merged) return { ok: true, knowledge: merged };
    return {
      ok: false,
      reason: "provider-failed",
      message: "General knowledge provider could not produce teaching knowledge.",
    };
  }

  const validation = validateGeneralTeachingKnowledge(general, target);
  if (!validation.accepted) {
    const merged = mergeGroundingKnowledge(materialParts, {
      externalSources,
      externalSnippets,
    });
    if (merged) return { ok: true, knowledge: merged };
    return {
      ok: false,
      reason: "invalid-knowledge",
      message: `General teaching knowledge failed validation: ${validation.reasons.join(", ")}`,
    };
  }

  const generatedExplanation: KnowledgeSource = {
    kind: "general-ai",
    title: "General AI teaching knowledge",
    provider: "general-ai",
    confidence: "medium",
    limitations: [
      "AI-generated explanation — not web retrieval and not Knowledge Library.",
    ],
  };

  const hasMaterial = materialParts.length > 0;
  const hasExternal = externalSources.length > 0;
  const base = retrievedFromGeneralKnowledge(target, general, {
    grounding: materialParts.flatMap((p) => p.grounding ?? []),
    sourceKind:
      hasMaterial || hasExternal ? "combined" : "general-ai",
  });

  const materialSources = materialParts.flatMap(
    (p) => p.sources ?? (p.grounding ?? []).map(groundingRefToSource),
  );

  return {
    ok: true,
    knowledge: {
      ...base,
      sources: [
        ...materialSources,
        ...externalSources,
        generatedExplanation,
      ],
      groundingContext: buildKnowledgeGroundingContext({
        courseMaterials: materialSources.filter((s) => s.kind === "course-material"),
        userNotes: materialSources.filter((s) => s.kind === "user-note"),
        retrievedExternal: externalSources,
        generatedExplanation,
      }),
      externalSnippets,
      sourceSummary: hasExternal
        ? "Combined learner material / external sources with General AI explanation."
        : hasMaterial
          ? "General instructional knowledge with learner material grounding."
          : "AI-generated general instructional knowledge (not web retrieval).",
      limitations: [
        ...(base.limitations ?? []),
        ...(hasExternal
          ? []
          : ["No external/web sources were retrieved for this request."]),
        "General AI is not a citation source.",
      ],
    },
  };
}

/**
 * Resolve TeachingKnowledgeContext with Universal Knowledge Retrieval.
 * Preserves exact KL behavior when the library knows the target.
 * Phase 9 — optional personal grounding annotates KL without replacing concepts.
 */
export async function resolveTeachingKnowledgeForLearn(
  input: KnowledgeRetrievalInput,
): Promise<TeachingKnowledgeContext | null> {
  // Fast path: existing KL resolver (sync, no AI).
  const kl =
    resolveTeachingKnowledgeContext(input.target.trim()) ??
    (() => {
      const n = normalizeLearningTarget(input.target);
      return n ? resolveTeachingKnowledgeContext(n.normalizedTitle) : null;
    })();
  if (kl) {
    const canonical = {
      kind: "knowledge-library" as const,
      id: kl.primaryConcept?.id ?? kl.pack?.id,
      title: kl.primaryConcept?.title ?? kl.pack?.displayTitle,
      confidence: "high" as const,
      provider: "knowledge-library",
    };
    // Phase 9/8 — annotate with course/note grounding; never replace KL concepts.
    const course = retrieveFromCourseMaterial(
      normalizeLearningTarget(input.target) ?? {
        original: input.target,
        normalizedTitle: input.target,
        slug: "topic",
      },
      input,
    );
    const notes = retrieveFromUserNote(
      normalizeLearningTarget(input.target) ?? {
        original: input.target,
        normalizedTitle: input.target,
        slug: "topic",
      },
      input,
    );
    const courseSources = course?.sources ?? [];
    const noteSources = notes?.sources ?? [];
    const hasPersonal = courseSources.length > 0 || noteSources.length > 0;
    return {
      ...kl,
      // Keep source as knowledge-library so KL concept identity/lessons stay canonical.
      // knowledgeSourceKind reflects combined provenance when personal grounding exists.
      knowledgeSourceKind: hasPersonal ? "combined" : "knowledge-library",
      confidence: "high",
      sources: [canonical, ...courseSources, ...noteSources],
      grounding: [
        ...(course?.grounding ?? []),
        ...(notes?.grounding ?? []),
      ],
      groundingContext: buildKnowledgeGroundingContext({
        canonical,
        courseMaterials: courseSources,
        userNotes: noteSources,
      }),
      limitations: hasPersonal
        ? [
            "Course/user material is grounding only — not promoted to Knowledge Library.",
          ]
        : undefined,
      sourceSummary: hasPersonal
        ? "Knowledge Library concepts with optional learner material grounding."
        : undefined,
    };
  }

  if (
    isProtectedSpecializedTopic(input.target) ||
    (normalizeLearningTarget(input.target) &&
      isProtectedSpecializedTopic(
        normalizeLearningTarget(input.target)!.normalizedTitle,
      ))
  ) {
    return null;
  }

  const result = await retrieveTeachingKnowledge(input);
  if (!result.ok) return null;
  return teachingContextFromRetrieved(result.knowledge);
}

/** Sync helper for tests: bridge already-retrieved knowledge. */
export function toTeachingKnowledgeContext(
  knowledge: RetrievedTeachingKnowledge,
): TeachingKnowledgeContext {
  return teachingContextFromRetrieved(knowledge);
}
