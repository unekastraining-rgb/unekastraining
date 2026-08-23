import { aiService } from "@/lib/ai";
import { parseAiJson } from "@/lib/ai/parse-json-response";
import { db } from "@/lib/db";
import { getOrCreateDefaultTopic } from "@/lib/topics";
import type { InteractiveLesson } from "@/lib/grade-school/generate-lesson";

interface GeneratedCard {
  front: string;
  back: string;
}

function parseCards(content: string): GeneratedCard[] {
  const parsed = parseAiJson<{ cards: GeneratedCard[] }>(content, "Invalid flashcard response.");
  if (!Array.isArray(parsed.cards)) throw new Error("Invalid flashcard response.");
  return parsed.cards.filter((c) => c.front?.trim() && c.back?.trim()).slice(0, 6);
}

export async function generateLessonFlashcards(input: {
  userId: string;
  courseId: string;
  lessonTitle: string;
  subject: string;
  gradeLevel: string;
  lesson: InteractiveLesson;
}) {
  const lessonText = input.lesson.steps
    .map(
      (step) =>
        `${step.title}: ${step.instruction}${step.example ? ` Example: ${step.example}` : ""}`,
    )
    .join("\n");

  const result = await aiService.complete(
    [
      {
        role: "system",
        content: "You create kid-friendly study flashcards. Respond with JSON only.",
      },
      {
        role: "user",
        content: `Create 5-6 flashcards for a ${input.gradeLevel} ${input.subject} lesson.
Use simple language. Test understanding, not trivia.

Return ONLY:
{ "cards": [{ "front": "question", "back": "short answer" }] }

Lesson: ${input.lessonTitle}
${lessonText}`,
      },
    ],
    { temperature: 0.3, maxTokens: 2000, jsonMode: true },
  );

  const cards = parseCards(result.content);
  const topic = await getOrCreateDefaultTopic(input.courseId);

  const created = await db.$transaction(
    cards.map((card) =>
      db.flashcard.create({
        data: {
          front: card.front,
          back: card.back,
          userId: input.userId,
          topicId: topic.id,
          nextReviewAt: new Date(),
        },
      }),
    ),
  );

  return created;
}
