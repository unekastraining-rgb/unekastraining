import { db } from "@/lib/db";
import { ensureConceptForTopic } from "@/lib/learning/knowledge/concept";
import { orchestrateForConcept } from "@/lib/learning/orchestrator";
import {
  orderCandidatesByConceptMastery,
  type ConceptMasteryOrderingRow,
} from "@/lib/learning/orchestrator/candidate-ordering";
import {
  presentOrchestratorSuggestion,
  type OrchestratorSuggestionView,
  type PresentOrchestratorOptions,
} from "@/lib/learning/orchestrator/present";
import { listActiveAdaptiveSequenceRuns } from "@/lib/learning/sequence/coordinator";

/**
 * Attach the most recently updated ACTIVE AdaptiveSequenceRun id, if any.
 * Read-only — never creates a run.
 */
async function withActiveRunId(
  userId: string,
  view: OrchestratorSuggestionView,
): Promise<OrchestratorSuggestionView> {
  const active = await listActiveAdaptiveSequenceRuns(userId, view.conceptId);
  return {
    ...view,
    activeRunId: active[0]?.id ?? null,
  };
}

/**
 * Pick one contextual Orchestrator suggestion for the study hub.
 *
 * Phase 2G-65: Topic/Course discovery is preserved; ULE priority uses
 * ConceptMastery (batch read) before diagnosis. TopicMastery is not used
 * for ranking. Does not auto-launch SIX, mutate mastery/scheduling, or
 * create AdaptiveSequenceRuns.
 *
 * Phase 2G-28/29: optional intent / LearningDecisionContext are presentation
 * metadata only — never used for diagnosis.
 */
export async function getTopOrchestratorSuggestion(
  userId: string,
  courseId?: string,
  options?: PresentOrchestratorOptions,
): Promise<OrchestratorSuggestionView | null> {
  // --- Discovery (Topic-first; TopicMastery not consulted for priority) ---
  const topics = await db.topic.findMany({
    where: {
      course: { userId },
      ...(courseId ? { courseId } : {}),
    },
    select: {
      id: true,
      name: true,
      courseId: true,
      conceptId: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: "asc" },
    take: 40,
  });

  if (topics.length === 0) return null;

  // Prefer Topics that already have a Concept; else short legacy ensure path.
  const withConcept = topics.filter((t) => t.conceptId);
  const shortlist =
    withConcept.length > 0 ? withConcept.slice(0, 8) : topics.slice(0, 3);

  // Resolve conceptIds (preserve ensureConceptForTopic for topics lacking Concept).
  const resolved: Array<{
    topic: (typeof topics)[number];
    conceptId: string;
    discoveryIndex: number;
  }> = [];

  for (let i = 0; i < shortlist.length; i++) {
    const topic = shortlist[i]!;
    let conceptId = topic.conceptId;
    if (!conceptId) {
      const concept = await ensureConceptForTopic(userId, topic.id);
      conceptId = concept.id;
    }
    resolved.push({ topic, conceptId, discoveryIndex: i });
  }

  if (resolved.length === 0) return null;

  // --- ConceptMastery batch read (no TopicMastery, no N+1) ---
  const conceptIds = [...new Set(resolved.map((r) => r.conceptId))];
  const masteryRows = await db.conceptMastery.findMany({
    where: {
      userId,
      conceptId: { in: conceptIds },
    },
    select: {
      conceptId: true,
      recognize: true,
      explain: true,
      apply: true,
      retain: true,
      reviewCount: true,
      lastReviewedAt: true,
    },
  });

  const masteryByConceptId = new Map<string, ConceptMasteryOrderingRow>();
  for (const row of masteryRows) {
    masteryByConceptId.set(row.conceptId, row);
  }

  const ordered = orderCandidatesByConceptMastery(
    resolved.map((r) => ({
      conceptId: r.conceptId,
      discoveryIndex: r.discoveryIndex,
    })),
    masteryByConceptId,
  );

  const byConceptId = new Map(resolved.map((r) => [r.conceptId, r]));

  // --- Diagnosis loop (unchanged policy: prefer gaps over insufficient) ---
  let insufficientView: OrchestratorSuggestionView | null = null;

  for (const candidate of ordered) {
    const resolvedRow = byConceptId.get(candidate.conceptId);
    if (!resolvedRow) continue;
    const { topic, conceptId } = resolvedRow;

    const result = await orchestrateForConcept(userId, conceptId, {
      courseId: topic.courseId,
      topicId: topic.id,
      topicName: topic.name,
    });
    if (!result) continue;

    const view = presentOrchestratorSuggestion(result, options);
    if (!view) continue; // NO_INTERVENTION

    if (view.state === "insufficient") {
      if (!insufficientView) {
        insufficientView = await withActiveRunId(userId, view);
      }
      continue;
    }

    return withActiveRunId(userId, view);
  }

  return insufficientView;
}
