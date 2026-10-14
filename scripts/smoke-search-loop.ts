/**
 * Smoke: search loop context + href builders (strategy #1).
 * Run: npm run smoke:search-loop
 */
import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
} from "../src/lib/study/loop-hrefs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const courseId = "course-bio";
  const topic = "Cell Membrane Transport";

  const pack = coreStudyPackHref(courseId, topic);
  const six = sixChunkingHref(courseId, topic);
  const lucky = luckyQuizHref(courseId, null, topic);
  const blurt = blurtingHref(courseId, null, topic);

  for (const href of [pack, six, lucky, blurt]) {
    assert(href.includes(`courseId=${courseId}`), `missing courseId in ${href}`);
    assert(href.includes("topic="), `missing topic in ${href}`);
  }
  assert(pack.includes("pack=1"), "study pack missing pack=1");
  assert(lucky.includes("make=1"), "lucky missing make=1");

  console.log("✓ Search loop smoke PASS");
  console.log("  pack:", pack);
  console.log("  lucky:", lucky);
}

main();
