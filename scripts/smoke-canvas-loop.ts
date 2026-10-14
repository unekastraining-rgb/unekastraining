/**
 * Smoke: Canvas/LMS module-outline cold start → loop hrefs (strategy #3).
 * Run: npm run smoke:canvas-loop
 */
import { buildCanvasColdStartSyllabusText, formatCanvasModuleOutline } from "../src/lib/lms/canvas-cold-start";
import { lmsColdStartCourseEntry } from "../src/lib/lms/cold-start-course-entry";
import { coreStudyPackHref, luckyQuizHref, sixChunkingHref } from "../src/lib/study/loop-hrefs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const courseId = "canvas-course-cs201";
  const courseName = "CS 201 — Data Structures";
  const modulesOutline = formatCanvasModuleOutline([
    { name: "Week 1: Intro" },
    { name: "Week 2: Binary Search Trees" },
    { name: "Week 3: Heaps and Priority Queues" },
  ]);

  const coldStart = buildCanvasColdStartSyllabusText({
    courseName,
    syllabusHtml: null,
    modulesOutline,
  });
  assert(coldStart.seeded, "Canvas cold-start text not seeded");

  const entry = lmsColdStartCourseEntry(courseId, courseName, coldStart.text);
  assert(Boolean(entry.focusTopic), "focus topic missing");

  const pack = coreStudyPackHref(courseId, entry.focusTopic);
  const six = sixChunkingHref(courseId, entry.focusTopic!);
  const lucky = luckyQuizHref(courseId, null, entry.focusTopic);

  for (const href of [pack, six, lucky]) {
    assert(href.includes(`courseId=${courseId}`), `missing courseId in ${href}`);
  }
  assert(pack.includes("pack=1"), "pack missing pack=1");
  assert(lucky.includes("make=1"), "lucky missing make=1");

  console.log("✓ Canvas cold-start loop smoke PASS");
  console.log("  course:", courseName);
  console.log("  topic:", entry.focusTopic);
  console.log("  pack:", pack);
  console.log("  lucky:", lucky);
}

main();
