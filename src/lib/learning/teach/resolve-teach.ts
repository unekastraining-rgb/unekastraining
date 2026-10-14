/**
 * Bundle D — Resolve teaching knowledge for an actual Teach experience.
 * Wraps Universal Retrieval + concept decomposition. Not a second pipeline.
 */

import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { createAiGeneralKnowledgeProvider } from "@/lib/learning/knowledge/retrieval/providers/general-ai";
import { resolveTeachingKnowledgeForLearn } from "@/lib/learning/knowledge/retrieval/retrieve";
import {
  understandLearningTarget,
  type UnderstoodLearningTarget,
} from "@/lib/learning/knowledge/retrieval/learning-target";
import type {
  GeneralKnowledgeProvider,
  KnowledgeRetrievalInput,
} from "@/lib/learning/knowledge/retrieval/types";
import {
  decomposeTeachConcepts,
  decomposeTeachConceptsDeterministic,
  type DecomposeTeachResult,
} from "@/lib/learning/teach/decompose";
import { detectTeachScope, type TeachScope } from "@/lib/learning/teach/scope";

export type ResolveTeachKnowledgeResult = {
  context: TeachingKnowledgeContext | null;
  understood: UnderstoodLearningTarget | null;
  scope: TeachScope | null;
  decompose: DecomposeTeachResult | null;
};

/**
 * Resolve + expand teaching knowledge for Learn / Teach Me.
 */
export async function resolveTeachKnowledgeForLearn(
  input: KnowledgeRetrievalInput & {
    rawRequest?: string;
    generalProvider?: GeneralKnowledgeProvider | null;
    /** When true, skip AI decomposition (tests / offline). */
    deterministicOnly?: boolean;
  },
): Promise<ResolveTeachKnowledgeResult> {
  const raw = (input.rawRequest ?? input.target).trim();
  const understood = understandLearningTarget(raw);
  const base = await resolveTeachingKnowledgeForLearn(input);
  if (!base) {
    return {
      context: null,
      understood,
      scope: understood ? detectTeachScope(understood) : null,
      decompose: null,
    };
  }

  if (!understood) {
    return {
      context: base,
      understood: null,
      scope: null,
      decompose: null,
    };
  }

  if (input.deterministicOnly) {
    const decompose = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    return {
      context: decompose.context,
      understood,
      scope: decompose.scope,
      decompose,
    };
  }

  const provider =
    input.generalProvider === null
      ? null
      : input.generalProvider ??
        (input.userId
          ? createAiGeneralKnowledgeProvider(input.userId)
          : null);

  const decompose = await decomposeTeachConcepts({
    context: base,
    understood,
    generalProvider: provider,
    retrievalInput: input,
  });

  return {
    context: decompose.context,
    understood,
    scope: decompose.scope,
    decompose,
  };
}
