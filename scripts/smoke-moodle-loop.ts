/**
 * Smoke: Moodle module-outline cold start → loop hrefs (strategy #3).
 * Run: npm run smoke:moodle-loop
 */
import { buildMoodleColdStartSyllabusText, formatMoodleModuleOutline } from "../src/lib/lms/moodle-cold-start";
import type { MoodleCourseContentSection } from "../src/lib/lms/moodle-api";
import { lmsColdStartCourseEntry } from "../src/lib/lms/cold-start-course-entry";
import { coreStudyPackHref, luckyQuizHref, sixChunkingHref } from "../src/lib/study/loop-hrefs";

const SECTIONS: MoodleCourseContentSection[] = [
  {
    id: 1,
    name: "Welcome to CSCI 2340",
    section: 0,
    modules: [{ id: 1, instance: 1, modname: "forum", name: "Announcements" }],
  },
  {
    id: 3,
    name: "Module 1: Objects and Classes",
    section: 2,
    modules: [
      { id: 3, instance: 3, modname: "book", name: "Module 1 Resources" },
      { id: 4, instance: 4, modname: "quiz", name: "Module 1 Quiz" },
    ],
  },
  {
    id: 4,
    name: "Module 2: Thinking in Objects",
    section: 3,
    modules: [],
  },
];

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const courseId = "moodle-csci2340";
  const courseName = "Object-Oriented Design";
  const outline = formatMoodleModuleOutline(SECTIONS);
  const coldStart = buildMoodleColdStartSyllabusText({
    courseName,
    syllabusText: "",
    modulesOutline: outline,
  });

  assert(coldStart.seeded, "Moodle cold-start text not seeded");
  assert(coldStart.usedModules, "expected module outline path");

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

  console.log("✓ Moodle cold-start loop smoke PASS");
  console.log("  course:", courseName);
  console.log("  topic:", entry.focusTopic);
  console.log("  pack:", pack);
  console.log("  lucky:", lucky);
}

main();
