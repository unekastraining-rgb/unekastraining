import { describe, expect, it } from "vitest";

import { selectionStudyTopic } from "@/lib/core/canvas-clipboard";
import {
  blurtingHref,
  luckyQuizHref,
  sixChunkingHref,
  teachMeHref,
} from "@/lib/study/loop-hrefs";

/** Ink/PDF selection → Core → Six → Lucky (strategy #4 tied to #1). */
describe("ink selection study loop hrefs", () => {
  const courseId = "course-chem";
  const materialId = "mat-pdf-1";
  const inkOcrText =
    "Osmosis is the passive diffusion of water across a selectively permeable membrane";

  it("derives a page topic from OCR ink text", () => {
    const topic = selectionStudyTopic(inkOcrText, "Chapter 3");
    expect(topic.length).toBeGreaterThanOrEqual(12);
    expect(topic).toMatch(/Osmosis/i);
  });

  it("chains ink topic into Six, Blurt, Teach Me, and Lucky with material context", () => {
    const topic = selectionStudyTopic(inkOcrText, "Chapter 3");
    expect(sixChunkingHref(courseId, topic, materialId)).toContain(`materialId=${materialId}`);
    expect(blurtingHref(courseId, materialId, topic)).toContain(`courseId=${courseId}`);
    expect(teachMeHref(courseId, materialId, topic)).toContain(`courseId=${courseId}`);
    expect(luckyQuizHref(courseId, materialId, topic)).toContain("make=1");
  });
});
