/**
 * Phase 4B — Resolve PersonalizedTeachingContext from Knowledge + Learner State.
 */

import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { getLearnerConceptState } from "@/lib/learning/learner-state/service";
import type { LearnerConceptState } from "@/lib/learning/learner-state/types";
import { personalizationFromState } from "@/lib/learning/personalized-teaching/rules";
import type {
  PersonalizedConceptBinding,
  PersonalizedTeachingContext,
} from "@/lib/learning/personalized-teaching/types";

/**
 * Build personalized teaching context for the concepts already in knowledge scope.
 * Does not invent concepts. Returns null when knowledge is null.
 */
export function buildPersonalizedTeachingContext(input: {
  knowledge: TeachingKnowledgeContext;
  /** Preloaded states keyed by conceptId (tests / sync paths). */
  statesByConceptId?: ReadonlyMap<string, LearnerConceptState | null>;
}): PersonalizedTeachingContext {
  const bindings: PersonalizedConceptBinding[] = [];

  for (const concept of input.knowledge.concepts) {
    const state =
      input.statesByConceptId?.get(concept.id) ??
      null;
    const personalization = personalizationFromState(concept.id, state);
    bindings.push({
      conceptId: concept.id,
      state,
      personalization,
    });
  }

  // If knowledge has no concepts, still provide an unseen primary shell.
  const primary =
    bindings[0]?.personalization ??
    personalizationFromState(
      input.knowledge.primaryConcept?.id ?? "unknown",
      null,
    );

  return {
    knowledge: input.knowledge,
    conceptBindings: bindings,
    primary,
  };
}

/**
 * Async resolve: load Learner Concept State for each knowledge concept.
 * Unknown / missing state → unseen personalization (no fabricated IDs).
 */
export async function resolvePersonalizedTeachingContext(input: {
  userId: string;
  knowledge: TeachingKnowledgeContext | null | undefined;
}): Promise<PersonalizedTeachingContext | null> {
  if (!input.knowledge) return null;
  if (!input.userId?.trim()) {
    return buildPersonalizedTeachingContext({
      knowledge: input.knowledge,
      statesByConceptId: new Map(),
    });
  }

  const statesByConceptId = new Map<string, LearnerConceptState | null>();
  for (const concept of input.knowledge.concepts) {
    const state = await getLearnerConceptState(input.userId, concept.id);
    statesByConceptId.set(concept.id, state);
  }

  return buildPersonalizedTeachingContext({
    knowledge: input.knowledge,
    statesByConceptId,
  });
}
