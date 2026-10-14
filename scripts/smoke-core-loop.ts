/**
 * Smoke: Core ink/PDF selection → Six / Blurt / Lucky href chain (strategy #4 + #1).
 * Run: npm run smoke:core-loop
 */
import { selectionStudyTopic } from "../src/lib/core/canvas-clipboard";
import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
  sixFeynmanHref,
  teachMeHref,
} from "../src/lib/study/loop-hrefs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const courseId = "course-chem";
  const materialId = "mat-pdf-2";
  const inkOcrText =
    "Osmosis is the passive diffusion of water across a selectively permeable membrane";

  const topic = selectionStudyTopic(inkOcrText, "Chapter 3");
  assert(topic.length >= 12, "ink topic too short");
  assert(/osmosis/i.test(topic), "ink topic should mention Osmosis");

  const six = sixChunkingHref(courseId, topic, materialId);
  const feynman = sixFeynmanHref(courseId, topic, materialId);
  const blurt = blurtingHref(courseId, materialId, topic);
  const teach = teachMeHref(courseId, materialId, topic);
  const quiz = luckyQuizHref(courseId, materialId, topic);
  const pack = coreStudyPackHref(courseId, topic);

  for (const href of [six, feynman, blurt, teach, quiz, pack]) {
    assert(href.includes(`courseId=${courseId}`), `missing courseId in ${href}`);
  }
  for (const href of [six, feynman, blurt, teach, quiz]) {
    assert(href.includes(`materialId=${materialId}`), `missing materialId in ${href}`);
  }
  assert(quiz.includes("make=1"), "Lucky quiz missing make=1");
  assert(blurt.includes("topic="), "Blurt missing topic");
  assert(pack.includes("pack=1"), "study pack missing pack=1");

  console.log("✓ Core ink/PDF loop smoke PASS");
  console.log("  topic:", topic.slice(0, 60));
  console.log("  quiz:", quiz);
}

main();
