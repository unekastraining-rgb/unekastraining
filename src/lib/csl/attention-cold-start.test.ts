import { describe, expect, it } from "vitest";

import { buildAttentionItems } from "@/lib/csl/attention";

describe("attention items loop hrefs", () => {
  it("keeps generic hrefs when no course context", () => {
    const items = buildAttentionItems({
      overdueAssignments: [],
      dueSoonAssignments: [],
      weakTopics: [],
      missedQuestions: 3,
      dueFlashcards: 5,
    });
    expect(items.find((item) => item.id === "missed-questions")?.href).toBe(
      "/quizzes?filter=missed",
    );
    expect(items.find((item) => item.id === "due-flashcards")?.href).toBe("/flashcards");
  });

  it("scopes missed quiz and flashcard attention to primary course", () => {
    const items = buildAttentionItems({
      overdueAssignments: [],
      dueSoonAssignments: [],
      weakTopics: [],
      missedQuestions: 2,
      dueFlashcards: 4,
      primaryCourseId: "course-bio",
    });
    expect(items.find((item) => item.id === "missed-questions")?.href).toBe(
      "/quizzes?filter=missed&courseId=course-bio",
    );
    expect(items.find((item) => item.id === "due-flashcards")?.href).toBe(
      "/flashcards?courseId=course-bio",
    );
    expect(items.find((item) => item.id === "missed-questions")?.loopCourseId).toBe(
      "course-bio",
    );
  });

  it("attaches loop context to assignment and weak-topic attention items", () => {
    const items = buildAttentionItems({
      overdueAssignments: [
        {
          id: "a1",
          title: "Module 1 Quiz",
          courseId: "course-ood",
          courseTitle: "OOD",
        },
      ],
      dueSoonAssignments: [],
      weakTopics: [
        {
          id: "t1",
          name: "Binary Trees",
          courseId: "course-cs",
          courseTitle: "CS 201",
          proficiency: 0.2,
          understanding: 0.3,
          recall: 0.2,
          application: 0.1,
          reviewCount: 0,
        },
      ],
      missedQuestions: 0,
      dueFlashcards: 0,
    });
    expect(items.find((item) => item.id === "overdue-a1")?.loopCourseId).toBe("course-ood");
    expect(items.find((item) => item.id === "weak-t1")?.loopTopic).toBe("Binary Trees");
  });
});
