import { NextResponse } from "next/server";

import { StudyActivityType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { recordQuizAttemptEvidence } from "@/lib/learning/assessment/quiz-bridge";
import { gradeQuizAnswers } from "@/lib/quizzes/grade";
import { updateMasteryFromQuiz } from "@/lib/quizzes/mastery";
import { parseAnswer, serializeAnswer } from "@/lib/quizzes/types";
import { getUserAppSettings } from "@/lib/settings/app-settings";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const body = await request.json();
    const { answers, durationSeconds } = body as {
      answers: Array<{ questionId: string; answer: string | string[] | boolean }>;
      durationSeconds?: number;
    };

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: "answers are required." },
        { status: 400 },
      );
    }

    const quiz = await db.quiz.findFirst({
      where: { id, userId: user.id },
      include: { questions: { orderBy: { sortOrder: "asc" } } },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
        { status: 404 },
      );
    }

    const appSettings = await getUserAppSettings(user.id);
    const graded = await gradeQuizAnswers(quiz.questions, answers, {
      includeOpenAIPro: appSettings.aiUseOpenAIPro,
    });
    const correctCount = graded.filter((item) => item.isCorrect).length;
    const maxScore = quiz.questions.length;
    const score = correctCount;

    const attempt = await db.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        score,
        maxScore,
        completedAt: new Date(),
        responses: {
          create: graded.map((item) => {
            const userAnswer = answers.find(
              (answer) => answer.questionId === item.questionId,
            )?.answer;
            return {
              questionId: item.questionId,
              answer: serializeAnswer(userAnswer ?? ""),
              isCorrect: item.isCorrect,
              feedback: item.feedback ?? null,
            };
          }),
        },
      },
      include: { responses: true },
    });

    for (const item of graded) {
      const question = quiz.questions.find((q) => q.id === item.questionId);
      if (!question) continue;

      if (!item.isCorrect) {
        const missed = await db.missedQuestion.create({
          data: {
            userId: user.id,
            courseId: quiz.courseId,
            topicId: question.topicId ?? quiz.topicId,
            prompt: question.prompt,
            correctAnswer: question.correctAnswer,
            userAnswer: serializeAnswer(
              answers.find((answer) => answer.questionId === item.questionId)
                ?.answer ?? "",
            ),
            questionType: question.type,
            options: question.options,
            explanation: question.explanation,
            sourceQuizId: quiz.id,
            nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        try {
          const { syncMissedQuestionRetentionItem } = await import(
            "@/lib/learning/retention"
          );
          await syncMissedQuestionRetentionItem({
            userId: user.id,
            missedQuestionId: missed.id,
            topicId: missed.topicId,
            nextReviewAt: missed.nextReviewAt,
          });
        } catch (retentionError) {
          console.error(
            "ULE missed-question retention bridge failed (quiz still saved):",
            retentionError,
          );
        }
      }
    }

    if (quiz.topicId) {
      await updateMasteryFromQuiz(user.id, quiz.topicId, score / maxScore);
    }

    // Universal Learning Engine (Phase 2A): quiz → LO → Evidence → ConceptMastery.
    // Must not change quiz UX/scoring; failures are isolated.
    let adaptivePayload:
      | {
          runId: string;
          outcome: string;
          reason?: string;
          code?: string;
          completionAttemptId?: string;
        }
      | undefined;

    try {
      const evidence = await recordQuizAttemptEvidence({
        userId: user.id,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          courseId: quiz.courseId,
          topicId: quiz.topicId,
          questions: quiz.questions,
        },
        attemptId: attempt.id,
        graded: graded.map((item) => ({
          questionId: item.questionId,
          isCorrect: item.isCorrect,
        })),
      });

      // Phase 2G-14 — optional Adaptive Sequence bind after whole-quiz submit.
      // Uses an existing per-question LearningAttempt; does not create a quiz-level Attempt.
      const {
        bindQuizSubmitToAdaptiveSequence,
        adaptiveQuizResponsePayload,
      } = await import("@/lib/learning/sequence/quiz-submit-bind");
      const bind = await bindQuizSubmitToAdaptiveSequence({
        userId: user.id,
        quizId: quiz.id,
        adaptiveRunId: body.adaptiveRunId,
        adaptiveStep: body.adaptiveStep,
        questionCount: quiz.questions.length,
        gradedCount: graded.length,
        evidenceAttempts: evidence.attempts,
      });
      adaptivePayload = adaptiveQuizResponsePayload(bind);
      if (bind.kind === "error") {
        console.error(
          "ULE adaptive sequence quiz bind failed (quiz still saved):",
          bind.code,
          bind.message,
        );
      }
    } catch (engineError) {
      console.error("ULE quiz evidence bridge failed (quiz still saved):", engineError);
    }

    await db.studySession.create({
      data: {
        userId: user.id,
        courseId: quiz.courseId,
        topicId: quiz.topicId,
        activityType: StudyActivityType.QUIZ,
        durationSeconds: Math.max(60, Number(durationSeconds) || quiz.questions.length * 90),
        cardsReviewed: 0,
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score,
        maxScore,
        percent: Math.round((score / maxScore) * 100),
        results: graded.map((item) => {
          const question = quiz.questions.find((q) => q.id === item.questionId);
          return {
            questionId: item.questionId,
            prompt: question?.prompt,
            type: question?.type,
            isCorrect: item.isCorrect,
            feedback: item.feedback,
            correctAnswer: parseAnswer(item.correctAnswer),
            explanation: item.explanation,
            userAnswer: answers.find((answer) => answer.questionId === item.questionId)
              ?.answer,
          };
        }),
      },
      ...(adaptivePayload ? { adaptive: adaptivePayload } : {}),
    });
  } catch (error) {
    console.error("Failed to submit quiz:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit quiz.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
