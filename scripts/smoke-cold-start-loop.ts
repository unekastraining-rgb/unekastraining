/**
 * Smoke: cold-start Core → Six → Lucky href chain (strategy #3 + #1).
 * Run: npm run smoke:cold-start
 */
import { buildLuckySession, enrichLuckyBlocksForCourse } from "../src/lib/csl/lucky-engine";
import {
  buildColdStartFocusTopics,
  buildStudyNowPlan,
  enrichStudyNowBlocksForCourse,
} from "../src/lib/csl/study-now";
import { buildMixedReviewPlan } from "../src/lib/csl/mixed-review";
import { demoColdStartCourseEntry } from "../src/lib/lms/demo-cold-start";
import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
} from "../src/lib/study/loop-hrefs";
import { hubChatHref } from "../src/lib/hub/tabs";

const DEMO_TOPICS = [
  "Instructor & Course Information",
  "Binary Search Trees",
  "Graph Traversal",
];

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const entry = demoColdStartCourseEntry("demo-cs201", "CS 201 — Data Structures", "CS201");
  assert(entry.focusTopic === "Binary Search Trees", "demo focus topic missing");

  const courseId = entry.id;
  const focusTopic = entry.focusTopic!;

  const pack = coreStudyPackHref(courseId, focusTopic);
  assert(pack.includes("pack=1"), "study pack missing pack=1");
  assert(pack.includes("topic="), "study pack missing topic");

  const six = sixChunkingHref(courseId, focusTopic);
  assert(six.includes(`courseId=${courseId}`), "Six link missing courseId");

  const quiz = luckyQuizHref(courseId, null, focusTopic);
  assert(quiz.includes("make=1"), "Lucky quiz missing make=1");
  assert(quiz.includes("topic="), "Lucky quiz missing topic");

  const blurt = blurtingHref(courseId, null, focusTopic);
  assert(blurt.includes(`courseId=${courseId}`), "Blurt link missing courseId");
  assert(blurt.includes("topic="), "Blurt link missing topic");

  const chat = hubChatHref({ courseId, topic: focusTopic });
  assert(chat.includes(`courseId=${courseId}`), "Hub chat link missing courseId");
  assert(chat.includes("topic="), "Hub chat link missing topic");

  const focusTopics = buildColdStartFocusTopics({
    courseId,
    courseTitle: entry.title,
    topicNames: DEMO_TOPICS,
  });
  assert(focusTopics.length >= 1, "cold-start focus topics empty");

  const studyPlan = buildStudyNowPlan(20, {}, focusTopics);
  const studyBlocks = enrichStudyNowBlocksForCourse(studyPlan.blocks, {
    courseId,
    courseTitle: entry.title,
    focusTopics,
  });
  const studyQuiz = studyBlocks.find((block) => block.activity === "quiz");
  assert(Boolean(studyQuiz?.href?.includes("make=1")), "Study Now quiz not auto-build");
  assert(Boolean(studyQuiz?.href?.includes("topic=")), "Study Now quiz missing topic");

  const luckyPlan = buildLuckySession({
    missedQuestions: 0,
    dueFlashcards: 1,
    weakTopics: 1,
    lowUnderstanding: 1,
    lowRecall: 0,
  });
  const luckyBlocks = enrichLuckyBlocksForCourse(luckyPlan.blocks, {
    courseId,
    coldStartTopic: focusTopic,
  });
  const learn = luckyBlocks.find((block) => block.id === "learn");
  assert(Boolean(learn?.href?.includes("pack=1")), "Lucky learn step missing study pack");

  const mixed = buildMixedReviewPlan({
    missedQuestions: 0,
    dueFlashcards: 0,
    weakTopics: 1,
    lowUnderstanding: 1,
    courseId,
    focusTopic,
  });
  assert(
    mixed.every((step) => step.href.includes(`courseId=${courseId}`)),
    "mixed review steps missing courseId",
  );

  console.log("✓ Cold-start loop smoke PASS");
  console.log("  demo topic:", focusTopic);
  console.log("  pack:", pack);
  console.log("  quiz:", quiz);
  console.log("  blurt:", blurt);
}

main();
