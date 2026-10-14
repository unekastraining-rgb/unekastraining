/**
 * Smoke: OCR syllabus upload → Core pack=1 redirect (strategy #3).
 * Run: npm run smoke:ocr-loop
 */
import { chapterSubtopicsFromText } from "../src/lib/syllabus/enrich-course-from-syllabus";
import { coreStudyPackHref, luckyQuizHref } from "../src/lib/study/loop-hrefs";

const OCR_SYLLABUS_TEXT = `
ENG 110 — Composition
Course outline (from syllabus photo)

## Chapters
- Narrative and personal essay
- Research and citation
- Rhetorical analysis
- Revision and editing
`.trim();

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const courseId = "eng110-ocr";
  const topics = chapterSubtopicsFromText(OCR_SYLLABUS_TEXT);
  assert(topics.length >= 3, "OCR topics not extracted");

  const topic = topics.find((item) => /rhetorical/i.test(item.name))?.name ?? topics[0]!.name;
  const materialId = "mat-syllabus-photo";

  const pack = new URL(coreStudyPackHref(courseId, topic), "http://local");
  pack.searchParams.set("materialId", materialId);
  const packHref = `${pack.pathname}${pack.search}`;

  assert(packHref.includes("pack=1"), "OCR redirect missing pack=1");
  assert(packHref.includes(`courseId=${courseId}`), "OCR redirect missing courseId");
  assert(packHref.includes(`materialId=${materialId}`), "OCR redirect missing materialId");
  assert(packHref.includes("topic="), "OCR redirect missing topic");

  const lucky = luckyQuizHref(courseId, materialId, topic);
  assert(lucky.includes("make=1"), "Lucky from OCR material missing make=1");

  console.log("✓ OCR cold-start loop smoke PASS");
  console.log("  topics:", topics.length);
  console.log("  focus:", topic);
  console.log("  pack:", packHref);
  console.log("  lucky:", lucky);
}

main();
