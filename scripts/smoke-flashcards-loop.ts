/**
 * Smoke: flashcards ↔ Core → Six → Lucky loop hrefs (strategy #1).
 * Run: npm run smoke:flashcards-loop
 */
import { demoColdStartCourseEntry } from "../src/lib/lms/demo-cold-start";
import {
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
} from "../src/lib/study/loop-hrefs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const entry = demoColdStartCourseEntry("demo-cs201", "CS 201 — Data Structures", "CS201");
  const courseId = entry.id;
  const topic = entry.focusTopic!;

  const pack = coreStudyPackHref(courseId, topic);
  const six = sixChunkingHref(courseId, topic);
  const lucky = luckyQuizHref(courseId, null, topic);
  const flashcards = `/flashcards?courseId=${encodeURIComponent(courseId)}&topic=${encodeURIComponent(topic)}`;

  for (const href of [pack, six, lucky, flashcards]) {
    assert(href.includes(`courseId=${courseId}`), `missing courseId in ${href}`);
  }
  assert(pack.includes("topic="), "pack missing topic");
  assert(lucky.includes("make=1"), "lucky missing make=1");
  assert(flashcards.includes("topic="), "flashcards missing topic");

  console.log("✓ Flashcards loop smoke PASS");
  console.log("  course:", entry.title);
  console.log("  topic:", topic);
  console.log("  flashcards:", flashcards);
  console.log("  lucky:", lucky);
}

main();
