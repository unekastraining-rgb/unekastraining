import type { QuizQuestion, QuizQuestionType } from "@/generated/prisma";

import { buildEvidenceEnvelope, outcomeFromCorrect } from "@/lib/learning/evidence/envelope";
import { recordEvidence } from "@/lib/learning/evidence/record";
import {
  ensureConceptForQuizTitle,
  ensureConceptForTopic,
} from "@/lib/learning/knowledge/concept";
import { getOrCreateLearnerProfile } from "@/lib/learning/learner-profile";
import { ensureQuizQuestionLearningObject } from "@/lib/learning/learning-object/ensure";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";

export interface GradedQuizItem {
  questionId: string;
  isCorrect: boolean;
}

/**
 * Behind-the-scenes bridge: quiz attempt → LO → Evidence → ConceptMastery.
 * Must not alter quiz scoring/UX. Callers should catch errors.
 */
export type QuizEvidenceAttemptRow = {
  attemptId: string;
  conceptId: string;
  questionId: string;
};

export async function recordQuizAttemptEvidence(input: {
  userId: string;
  quiz: {
    id: string;
    title: string;
    courseId: string | null;
    topicId: string | null;
    questions: Array<
      Pick<QuizQuestion, "id" | "prompt" | "topicId" | "type"> & {
        type: QuizQuestionType;
      }
    >;
  };
  attemptId: string;
  graded: GradedQuizItem[];
}): Promise<{
  evidenceCount: number;
  conceptIds: string[];
  /** LearningAttempts in graded/question order (no quiz-level Attempt). */
  attempts: QuizEvidenceAttemptRow[];
}> {
  await getOrCreateLearnerProfile(input.userId);

  const conceptIds = new Set<string>();
  const attempts: QuizEvidenceAttemptRow[] = [];
  let evidenceCount = 0;

  for (const item of input.graded) {
    const question = input.quiz.questions.find((q) => q.id === item.questionId);
    if (!question) continue;

    const topicId = question.topicId ?? input.quiz.topicId;
    const concept = topicId
      ? await ensureConceptForTopic(input.userId, topicId)
      : await ensureConceptForQuizTitle(
          input.userId,
          input.quiz.id,
          input.quiz.title || "Quiz",
          input.quiz.courseId,
        );

    conceptIds.add(concept.id);

    const learningObject = await ensureQuizQuestionLearningObject({
      userId: input.userId,
      quizId: input.quiz.id,
      questionId: question.id,
      prompt: question.prompt,
      conceptId: concept.id,
      learningSpaceId: concept.learningSpaceId,
    });

    const outcome = outcomeFromCorrect(item.isCorrect);
    const envelope = buildEvidenceEnvelope({
      learnerId: input.userId,
      learningObjectId: learningObject.id,
      conceptId: concept.id,
      skillFacet: "RECOGNIZE",
      outcome,
      score: item.isCorrect ? 1 : 0,
      confidence: null,
      misconceptionSignals: item.isCorrect
        ? []
        : [`quiz_miss:${question.type.toLowerCase()}`],
      sourceRef: {
        kind: "quiz_attempt",
        quizId: input.quiz.id,
        attemptId: input.attemptId,
        questionId: question.id,
      },
      evidencePayload: {
        questionType: question.type,
        isCorrect: item.isCorrect,
      },
      endedAt: new Date(),
    });

    const learningAttempt = await recordEvidence(envelope);
    await applyEvidenceToMastery(envelope);
    evidenceCount += 1;
    attempts.push({
      attemptId: learningAttempt.id,
      conceptId: concept.id,
      questionId: question.id,
    });
  }

  return { evidenceCount, conceptIds: [...conceptIds], attempts };
}

/**
 * Phase 2G-14 — Deterministic authoritative Attempt for Adaptive quiz completion.
 * Last LearningAttempt in graded order whose conceptId matches the run concept.
 * Does not create evidence.
 */
export function selectAuthoritativeQuizCompletionAttemptId(input: {
  attempts: QuizEvidenceAttemptRow[];
  runConceptId: string;
}): string | null {
  const runConceptId = input.runConceptId.trim();
  if (!runConceptId || input.attempts.length === 0) return null;
  for (let i = input.attempts.length - 1; i >= 0; i -= 1) {
    const row = input.attempts[i]!;
    if (row.conceptId === runConceptId) return row.attemptId;
  }
  return null;
}
