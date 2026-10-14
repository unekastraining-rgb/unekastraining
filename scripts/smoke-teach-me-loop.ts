/**
 * Smoke: teach-me ↔ blurting ↔ Core → Six → Lucky loop hrefs (strategy #1 + #3).
 * Run: npm run smoke:teach-me-loop
 */
import { demoColdStartCourseEntry } from "../src/lib/lms/demo-cold-start";
import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
  teachMeHref,
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
  const teach = teachMeHref(courseId, null, topic);
  const blurt = blurtingHref(courseId, null, topic);

  for (const href of [pack, six, lucky, teach, blurt]) {
    assert(href.includes(`courseId=${courseId}`), `missing courseId in ${href}`);
  }
  assert(pack.includes("pack=1"), "pack missing pack=1");
  assert(lucky.includes("make=1"), "lucky missing make=1");
  assert(teach.startsWith("/study/teach-me"), "teach-me wrong path");
  assert(blurt.startsWith("/study/blurting"), "blurting wrong path");
  assert(
    !topic.toLowerCase().includes("intro"),
    `cold-start topic should skip meta syllabus labels, got ${topic}`,
  );

  console.log("✓ Teach-me loop smoke PASS");
  console.log("  course:", entry.title);
  console.log("  topic:", topic);
  console.log("  teach:", teach);
  console.log("  blurt:", blurt);
  console.log("  lucky:", lucky);
}

main();
