/**
 * Smoke: offline topic-bank quiz quality when AI quota is exhausted (strategy #2 fallback).
 * Run: npm run smoke:offline-quiz
 */
import {
  buildTopicsSourceBlock,
  quizQuestionsFromTopics,
} from "../src/lib/quizzes/from-topics";
import { preferMcAndWriteIns, sanitizeQuizQuestions } from "../src/lib/quizzes/sanitize-questions";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const topics = [
    { name: "Profit", description: "Money left after expenses" },
    { name: "Stakeholders", description: "People affected by business decisions" },
    { name: "Outsourcing", description: "Hiring external firms for work" },
    { name: "Risk", description: "Uncertainty that can affect outcomes" },
  ];
  const focusTopic = "Stakeholders";

  const sourceBlock = buildTopicsSourceBlock("Intro to Business", topics, {
    focusTopic,
  });
  assert(sourceBlock.includes("Primary focus topic: Stakeholders"), "focus topic missing");
  assert(sourceBlock.includes("Outsourcing"), "topic outline missing");

  const raw = quizQuestionsFromTopics("Intro to Business", topics, 20, { focusTopic });
  const cleaned = preferMcAndWriteIns(sanitizeQuizQuestions(raw));

  assert(cleaned.length >= 6, `expected >= 6 questions, got ${cleaned.length}`);
  assert(
    cleaned.some((q) => q.type === "MULTIPLE_CHOICE"),
    "expected multiple choice",
  );
  assert(
    cleaned.some((q) => q.type === "SHORT_ANSWER" || q.type === "FILL_IN_BLANK"),
    "expected write-in",
  );
  assert(
    cleaned.every((q) => q.type !== "TRUE_FALSE"),
    "offline bank should not emit TRUE_FALSE",
  );
  assert(
    cleaned.some((q) => /profit|stakeholder|outsourcing|risk/i.test(q.prompt)),
    "prompts should reference course topics",
  );

  console.log("✓ Offline quiz smoke PASS");
  console.log("  questions:", cleaned.length);
  console.log("  sample:", cleaned[0]?.prompt.slice(0, 72));
}

main();
