import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import type {
  KnowledgeCandidateSourceType,
  KnowledgeConceptCandidate,
} from "@/lib/learning/knowledge/core-bridge-types";

export const CORE_KNOWLEDGE_CANDIDATE_CAP = 10;

/** Conservative title normalize for dedupe — not aggressive fuzzy merge. */
export function normalizeConceptTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[^\p{L}\p{N}\s+'/.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function candidateKey(
  sourceType: KnowledgeCandidateSourceType,
  normalizedTitle: string,
): string {
  return `${sourceType}:${normalizedTitle}`;
}

function pushUnique(
  list: KnowledgeConceptCandidate[],
  seen: Set<string>,
  partial: Omit<KnowledgeConceptCandidate, "key" | "normalizedTitle" | "status"> & {
    status?: KnowledgeConceptCandidate["status"];
  },
) {
  const normalizedTitle = normalizeConceptTitle(partial.title);
  if (!normalizedTitle || normalizedTitle.length < 2) return;
  if (seen.has(normalizedTitle)) return;
  seen.add(normalizedTitle);
  list.push({
    key: candidateKey(partial.sourceType, normalizedTitle),
    title: partial.title.trim(),
    normalizedTitle,
    sourceType: partial.sourceType,
    sourcePath: partial.sourcePath,
    definition: partial.definition ?? null,
    existingConceptId: partial.existingConceptId ?? null,
    status: partial.status ?? "proposed",
  });
}

/**
 * Deterministic candidates from an already-persisted ChapterStudyExtract.
 * No LLM calls. Cap at CORE_KNOWLEDGE_CANDIDATE_CAP (strongest first).
 */
export function extractKnowledgeCandidatesFromStudyExtract(
  extract: ChapterStudyExtract | null | undefined,
  options?: {
    topicConcept?: { id: string; title: string } | null;
    alreadyLinkedIds?: string[];
    cap?: number;
  },
): KnowledgeConceptCandidate[] {
  const cap = options?.cap ?? CORE_KNOWLEDGE_CANDIDATE_CAP;
  const linked = new Set(options?.alreadyLinkedIds ?? []);
  const out: KnowledgeConceptCandidate[] = [];
  const seen = new Set<string>();

  if (options?.topicConcept?.title?.trim()) {
    pushUnique(out, seen, {
      title: options.topicConcept.title,
      sourceType: "topic_concept",
      sourcePath: "topic.concept",
      existingConceptId: options.topicConcept.id,
      status: "existing",
    });
  }

  if (!extract) {
    return out.slice(0, cap).map(markLinked(linked));
  }

  extract.definitions?.forEach((item, index) => {
    const term = item?.term?.trim();
    if (!term) return;
    pushUnique(out, seen, {
      title: term,
      sourceType: "definition",
      sourcePath: `definitions[${index}].term`,
      definition: item.definition?.trim() || null,
    });
  });

  extract.learningObjectives?.forEach((lo, index) => {
    const statement = lo?.statement?.trim();
    if (!statement) return;
    // Prefer a short label: first clause / first ~8 words when statement is long.
    const title =
      statement.length <= 80
        ? statement
        : statement.split(/[.:;]/)[0]?.trim().slice(0, 80) || statement.slice(0, 80);
    pushUnique(out, seen, {
      title,
      sourceType: "learning_objective",
      sourcePath: `learningObjectives[${index}]`,
      definition: statement,
    });
  });

  extract.frameworks?.forEach((fw, index) => {
    const name = fw?.name?.trim();
    if (!name) return;
    pushUnique(out, seen, {
      title: name,
      sourceType: "framework",
      sourcePath: `frameworks[${index}].name`,
      definition: fw.items?.length ? fw.items.slice(0, 6).join("; ") : null,
    });
  });

  extract.processesOrSteps?.forEach((proc, index) => {
    const name = proc?.name?.trim();
    if (!name) return;
    pushUnique(out, seen, {
      title: name,
      sourceType: "process",
      sourcePath: `processesOrSteps[${index}].name`,
      definition: proc.steps?.length ? proc.steps.slice(0, 6).join(" → ") : null,
    });
  });

  return out.slice(0, cap).map(markLinked(linked));
}

function markLinked(linked: Set<string>) {
  return (candidate: KnowledgeConceptCandidate): KnowledgeConceptCandidate => {
    if (
      candidate.existingConceptId &&
      linked.has(candidate.existingConceptId)
    ) {
      return { ...candidate, status: "linked" };
    }
    return candidate;
  };
}
