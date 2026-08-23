import { NextResponse } from "next/server";

import { StudyActivityType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { gradeQuizAnswers } from "@/lib/quizzes/grade";
import { updateMasteryFromQuiz } from "@/lib/quizzes/mastery";
import { parseAnswer, serializeAnswer } from "@/lib/quizzes/types";
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

    const graded = await gradeQuizAnswers(quiz.questions, answers);
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
        await db.missedQuestion.create({
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
      }
    }

    if (quiz.topicId) {
      await updateMasteryFromQuiz(user.id, quiz.topicId, score / maxScore);
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
    });
  } catch (error) {
    console.error("Failed to submit quiz:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit quiz.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
