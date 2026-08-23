import { buildSixHrefForTopic } from "./six-recommendations";
import { hubAssignmentFocusHref } from "@/lib/hub/tabs";

function teachMeHref(courseId: string, topicName: string) {
  return `/study/teach-me?courseId=${encodeURIComponent(courseId)}&topic=${encodeURIComponent(topicName)}`;
}

export type AttentionSeverity = "high" | "medium" | "low";

export type AttentionCategory = "deadline" | "mastery" | "retention" | "review";

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  title: string;
  description: string;
  href: string;
  category: AttentionCategory;
}

export interface AttentionWeakTopic {
  id: string;
  name: string;
  courseId: string;
  courseTitle: string;
  proficiency: number;
  understanding: number;
  recall: number;
  application: number;
  reviewCount: number;
}

export interface AttentionInput {
  overdueAssignments: Array<{ id: string; title: string; courseTitle: string }>;
  dueSoonAssignments: Array<{ id: string; title: string; courseTitle: string; dueDate: Date }>;
  weakTopics: AttentionWeakTopic[];
  missedQuestions: number;
  dueFlashcards: number;
}

export function buildAttentionItems(input: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const assignment of input.overdueAssignments.slice(0, 3)) {
    items.push({
      id: `overdue-${assignment.id}`,
      severity: "high",
      title: assignment.title,
      description: `${assignment.courseTitle} — overdue`,
      href: hubAssignmentFocusHref(assignment.id),
      category: "deadline",
    });
  }

  for (const assignment of input.dueSoonAssignments.slice(0, 3)) {
    items.push({
      id: `due-${assignment.id}`,
      severity: "medium",
      title: assignment.title,
      description: `${assignment.courseTitle} — due ${assignment.dueDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`,
      href: hubAssignmentFocusHref(assignment.id),
      category: "deadline",
    });
  }

  for (const topic of input.weakTopics.slice(0, 4)) {
    items.push({
      id: `weak-${topic.id}`,
      severity: topic.proficiency < 0.35 ? "high" : "medium",
      title: topic.name,
      description: `${topic.courseTitle} — ${Math.round(topic.proficiency * 100)}% mastery`,
      href:
        topic.understanding < 0.5
          ? teachMeHref(topic.courseId, topic.name)
          : buildSixHrefForTopic({
              topicId: topic.id,
              topicName: topic.name,
              courseId: topic.courseId,
              proficiency: topic.proficiency,
              understanding: topic.understanding,
              recall: topic.recall,
              application: topic.application,
              reviewCount: topic.reviewCount,
            }),
      category: "mastery",
    });
  }

  if (input.missedQuestions > 0) {
    items.push({
      id: "missed-questions",
      severity: input.missedQuestions >= 5 ? "high" : "medium",
      title: `${input.missedQuestions} missed question${input.missedQuestions === 1 ? "" : "s"}`,
      description: "Recycle missed quiz items before they pile up.",
      href: "/quizzes?filter=missed",
      category: "review",
    });
  }

  if (input.dueFlashcards > 0) {
    items.push({
      id: "due-flashcards",
      severity: input.dueFlashcards >= 20 ? "medium" : "low",
      title: `${input.dueFlashcards} flashcard${input.dueFlashcards === 1 ? "" : "s"} due`,
      description: "Spaced review keeps retention strong.",
      href: "/flashcards",
      category: "retention",
    });
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
