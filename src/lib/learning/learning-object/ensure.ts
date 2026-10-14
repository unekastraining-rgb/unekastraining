import type { LearningObjectType, MasteryFacet } from "@/generated/prisma";

import { db } from "@/lib/db";

export async function ensureLearningObject(input: {
  userId: string;
  type: LearningObjectType;
  conceptIds: string[];
  prerequisiteConceptIds?: string[];
  skillFacet: MasteryFacet;
  difficulty?: number | null;
  sixTechnique?: string | null;
  title?: string | null;
  learningSpaceId?: string | null;
  successCriteria?: Record<string, unknown>;
  expectedEvidence?: Record<string, unknown>;
  payloadRef: Record<string, unknown>;
}) {
  const payloadRefJson = JSON.stringify(input.payloadRef);

  const existing = await db.learningObject.findFirst({
    where: {
      userId: input.userId,
      type: input.type,
      payloadRefJson,
    },
  });
  if (existing) return existing;

  return db.learningObject.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title ?? null,
      learningSpaceId: input.learningSpaceId ?? null,
      conceptIdsJson: JSON.stringify(input.conceptIds),
      prerequisiteConceptIdsJson: JSON.stringify(
        input.prerequisiteConceptIds ?? [],
      ),
      skillFacet: input.skillFacet,
      difficulty: input.difficulty ?? null,
      sixTechnique: input.sixTechnique ?? null,
      successCriteriaJson: JSON.stringify(
        input.successCriteria ?? { correct: true },
      ),
      expectedEvidenceJson: JSON.stringify(
        input.expectedEvidence ?? { outcome: "SUCCESS|FAIL", score: "0|1" },
      ),
      payloadRefJson,
    },
  });
}

export async function ensureQuizQuestionLearningObject(input: {
  userId: string;
  quizId: string;
  questionId: string;
  prompt: string;
  conceptId: string;
  learningSpaceId?: string | null;
  difficulty?: number | null;
}) {
  return ensureLearningObject({
    userId: input.userId,
    type: "QUIZ_ITEM",
    title: input.prompt.slice(0, 120),
    conceptIds: [input.conceptId],
    skillFacet: "RECOGNIZE",
    difficulty: input.difficulty ?? null,
    learningSpaceId: input.learningSpaceId,
    successCriteria: { isCorrect: true },
    expectedEvidence: {
      skillFacet: "RECOGNIZE",
      outcomes: ["SUCCESS", "FAIL"],
    },
    payloadRef: {
      kind: "quiz_question",
      quizId: input.quizId,
      questionId: input.questionId,
    },
  });
}

/** Spaced flashcard review — demonstrates retention (not recognition alone). */
export async function ensureFlashcardLearningObject(input: {
  userId: string;
  flashcardId: string;
  front: string;
  conceptId: string;
  learningSpaceId?: string | null;
}) {
  return ensureLearningObject({
    userId: input.userId,
    type: "FLASHCARD",
    title: input.front.slice(0, 120),
    conceptIds: [input.conceptId],
    skillFacet: "RETAIN",
    sixTechnique: "active_recall",
    learningSpaceId: input.learningSpaceId,
    successCriteria: { rating: ["GOOD", "EASY"] },
    expectedEvidence: {
      skillFacet: "RETAIN",
      outcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    payloadRef: {
      kind: "flashcard",
      flashcardId: input.flashcardId,
    },
  });
}

export async function ensureStudyEvaluateLearningObject(input: {
  userId: string;
  mode: "blurting" | "teach-me" | "six";
  conceptId: string;
  learningSpaceId?: string | null;
  sixComponent?: string | null;
  stepIndex?: number | null;
  title?: string | null;
  type: LearningObjectType;
  skillFacet: MasteryFacet;
  sixTechnique?: string | null;
}) {
  return ensureLearningObject({
    userId: input.userId,
    type: input.type,
    title: input.title?.slice(0, 120) ?? `${input.mode} evaluation`,
    conceptIds: [input.conceptId],
    skillFacet: input.skillFacet,
    sixTechnique: input.sixTechnique ?? null,
    learningSpaceId: input.learningSpaceId,
    successCriteria: { scoreRatio: ">=0.8" },
    expectedEvidence: {
      skillFacet: input.skillFacet,
      outcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    payloadRef: {
      kind: "study_evaluate",
      mode: input.mode,
      conceptId: input.conceptId,
      sixComponent: input.sixComponent ?? null,
      stepIndex: input.stepIndex ?? null,
    },
  });
}
