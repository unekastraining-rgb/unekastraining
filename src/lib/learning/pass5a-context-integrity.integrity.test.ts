/**
 * Phase 5A — Practice & material context integrity.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import JSZip from "jszip";

import {
  buildPracticeItemHref,
  listSupportedPracticeLandscape,
  UNSUPPORTED_PRACTICE_KINDS,
} from "@/lib/study/practice-landscape";
import { coreStudyGuideHref } from "@/lib/study/loop-hrefs";
import { extractPptxText, isPptxFile } from "@/lib/syllabus/extract-pptx";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

async function buildMinimalPptx(slides: Array<{ texts: string[]; notes?: string }>) {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>`,
  );
  slides.forEach((slide, index) => {
    const n = index + 1;
    const runs = slide.texts.map((t) => `<a:t>${t}</a:t>`).join("");
    zip.file(
      `ppt/slides/slide${n}.xml`,
      `<?xml version="1.0"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>${runs}</p:spTree></p:cSld></p:sld>`,
    );
    if (slide.notes) {
      zip.file(
        `ppt/notesSlides/notesSlide${n}.xml`,
        `<?xml version="1.0"?><p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>${slide.notes}</a:t></p:notes>`,
      );
    }
  });
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

describe("Phase 5A practice context", () => {
  it("universal practice hrefs preserve course, topic, material, and concept when known", () => {
    const coding = listSupportedPracticeLandscape().find(
      (i) => i.activityKey === "coding",
    )!;
    const href = buildPracticeItemHref(coding, {
      courseId: "c1",
      topic: "Inheritance",
      materialId: "m1",
      conceptId: "concept-9",
    });
    expect(href).toContain("/study/activities/coding?");
    expect(href).toContain("courseId=c1");
    expect(href).toContain("topic=Inheritance");
    expect(href).toContain("materialId=m1");
    expect(href).toContain("conceptId=concept-9");
  });

  it("topic-only practice launches without requiring course", () => {
    const math = listSupportedPracticeLandscape().find(
      (i) => i.activityKey === "math",
    )!;
    const href = buildPracticeItemHref(math, { topic: "Fractions" });
    expect(href).toContain("/study/activities/math?");
    expect(href).toContain("topic=Fractions");
    expect(href).not.toContain("courseId=");
    expect(href).not.toContain("conceptId=");
  });

  it("does not invent placeholder context values", () => {
    const writing = listSupportedPracticeLandscape().find(
      (i) => i.activityKey === "writing",
    )!;
    const href = buildPracticeItemHref(writing, {
      courseId: "  ",
      topic: null,
      materialId: undefined,
      conceptId: "",
    });
    expect(href).toBe("/study/activities/writing");
    expect(href).not.toContain("unknown");
    expect(href).not.toContain("default");
  });

  it("activity page resolves concept from course/topic/material query", () => {
    const page = read("app/study/activities/[kind]/page.tsx");
    expect(page).toContain("resolveActivityLaunchConceptId");
    expect(page).toContain("courseId");
    expect(page).toContain("topic");
    expect(page).toContain("materialId");
    expect(page).toContain("data-activity-topic-context");
  });

  it("Locker coding practice uses shared practice href builder with context", () => {
    const actions = read("src/components/materials/MaterialOpenActions.tsx");
    expect(actions).toContain("buildPracticeItemHref");
    expect(actions).toContain("listSupportedPracticeLandscape");
  });

  it("unsupported activities remain hidden", () => {
    for (const fake of UNSUPPORTED_PRACTICE_KINDS) {
      expect(
        listSupportedPracticeLandscape().some((i) => i.id === fake),
      ).toBe(false);
    }
  });
});

describe("Phase 5A PPTX extraction", () => {
  it("detects pptx mime/extension", () => {
    expect(
      isPptxFile(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "deck.pptx",
      ),
    ).toBe(true);
    expect(isPptxFile("application/pdf", "x.pdf")).toBe(false);
  });

  it("extracts multi-slide titles, bullets, and notes", async () => {
    const buffer = await buildMinimalPptx([
      { texts: ["Objects and Classes", "• A class is a blueprint"], notes: "Mention inheritance" },
      { texts: ["Inheritance", "extends shares behavior"] },
    ]);
    const text = await extractPptxText(buffer);
    expect(text).toContain("--- slide 1 ---");
    expect(text).toContain("Objects and Classes");
    expect(text).toContain("blueprint");
    expect(text).toContain("Notes: Mention inheritance");
    expect(text).toContain("--- slide 2 ---");
    expect(text).toContain("Inheritance");
  });

  it("fails clearly on malformed pptx", async () => {
    await expect(extractPptxText(Buffer.from("not-a-zip"))).rejects.toThrow(
      /Could not read this PowerPoint|corrupted/i,
    );
  });

  it("wires pptx into extractTextFromFile pipeline", () => {
    const extract = read("src/lib/syllabus/extract-text.ts");
    expect(extract).toContain("extractPptxText");
    expect(extract).toContain("isPptxFile");
    expect(extract).toContain("PPTX");
    const route = read("app/api/materials/route.ts");
    expect(route).toContain("isPptxFile");
  });
});

describe("Phase 5A Study Guide deep link", () => {
  it("builds CORE Studio study-guide href without a duplicate system", () => {
    const href = coreStudyGuideHref({
      courseId: "c1",
      topic: "Inheritance",
      materialId: "m1",
    });
    expect(href).toContain("/core?");
    expect(href).toContain("courseId=c1");
    expect(href).toContain("topic=Inheritance");
    expect(href).toContain("materialId=m1");
    expect(href).toContain("assist=1");
    expect(href).toContain("studio=study-guide");
  });

  it("Study Haul and Locker surface Study Guide", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    const actions = read("src/components/materials/MaterialOpenActions.tsx");
    const core = read("src/components/core/CoreNotesWorkspace.tsx");
    expect(topic).toContain("coreStudyGuideHref");
    expect(topic).toContain("Study Guide");
    expect(actions).toContain("Study Guide");
    expect(actions).toContain("coreStudyGuideHref");
    expect(core).toContain('searchParams.get("studio")');
    expect(core).toContain('pendingStudio === "study-guide"');
  });
});
