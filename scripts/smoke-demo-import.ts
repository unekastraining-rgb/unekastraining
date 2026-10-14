/**
 * Smoke: demo cold-start import response shape (strategy #3).
 * Run: npm run smoke:demo-import
 *
 * Does not mutate DB — validates the demo cold-start helper used by onboarding UI.
 */
import { demoColdStartCourseEntry } from "../src/lib/lms/demo-cold-start";
import { coreStudyPackHref, luckyQuizHref, sixChunkingHref } from "../src/lib/study/loop-hrefs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const entry = demoColdStartCourseEntry("demo-cs201", "CS 201 — Data Structures", "CS201");
  assert(Boolean(entry.id), "demo course id missing");
  assert(Boolean(entry.focusTopic), "demo focus topic missing");

  const courseId = entry.id;
  const topic = entry.focusTopic!;

  const pack = coreStudyPackHref(courseId, topic);
  assert(pack.includes("pack=1"), "demo pack missing pack=1");

  const six = sixChunkingHref(courseId, topic);
  assert(six.includes(`courseId=${courseId}`), "demo Six missing courseId");

  const quiz = luckyQuizHref(courseId, null, topic);
  assert(quiz.includes("make=1"), "demo Lucky missing make=1");

  console.log("✓ Demo import cold-start smoke PASS");
  console.log("  course:", entry.title);
  console.log("  topic:", topic);
  console.log("  pack:", pack);
}

main();
