import { describe, expect, it } from "vitest";

import {
  buildCanvasColdStartSyllabusText,
  canvasSyllabusMaterialMeta,
  formatCanvasModuleOutline,
  stripHtmlToText,
} from "@/lib/lms/canvas-cold-start";

describe("Canvas cold-start syllabus text", () => {
  it("strips HTML into readable syllabus text", () => {
    const text = stripHtmlToText(
      "<h1>BIO 101</h1><p>Week 1: Cells&nbsp;&amp; membranes</p><script>x()</script>",
    );
    expect(text).toContain("BIO 101");
    expect(text).toContain("Week 1: Cells & membranes");
    expect(text).not.toContain("<");
    expect(text).not.toContain("x()");
  });

  it("formats module names as an outline for empty syllabi", () => {
    expect(
      formatCanvasModuleOutline([
        { name: "Intro to cells" },
        { name: "  " },
        { name: "Membrane transport" },
      ]),
    ).toBe("Module outline\n1. Intro to cells\n2. Membrane transport");
  });

  it("uses syllabus body when rich enough", () => {
    const rich = "A".repeat(100);
    const result = buildCanvasColdStartSyllabusText({
      courseName: "Biology",
      syllabusHtml: `<p>${rich}</p>`,
      modulesOutline: formatCanvasModuleOutline([{ name: "Module 1" }]),
    });
    expect(result.seeded).toBe(true);
    expect(result.usedModules).toBe(false);
    expect(result.text).toContain(rich);
  });

  it("falls back to modules when syllabus is thin", () => {
    const outline = formatCanvasModuleOutline([
      { name: "Photosynthesis" },
      { name: "Cellular respiration" },
    ]);
    const result = buildCanvasColdStartSyllabusText({
      courseName: "BIO 101",
      syllabusHtml: "<p>Short</p>",
      modulesOutline: outline,
    });
    expect(result.seeded).toBe(true);
    expect(result.usedModules).toBe(true);
    expect(result.text).toContain("Photosynthesis");
    expect(result.text).toContain("Short");

    const emptySyllabus = buildCanvasColdStartSyllabusText({
      courseName: "BIO 101",
      syllabusHtml: "",
      modulesOutline: outline,
    });
    expect(emptySyllabus.text).toContain("BIO 101");
    expect(emptySyllabus.text).toContain("Photosynthesis");
  });

  it("does not seed when both syllabus and modules are empty", () => {
    const result = buildCanvasColdStartSyllabusText({
      courseName: "Empty",
      syllabusHtml: "",
      modulesOutline: "",
    });
    expect(result.seeded).toBe(false);
    expect(result.text).toBe("");
  });

  it("builds syllabus material title/url for Canvas", () => {
    expect(
      canvasSyllabusMaterialMeta({
        baseUrl: "https://school.instructure.com/",
        courseId: 42,
        courseName: "Biology",
        courseCode: "BIO101",
      }),
    ).toEqual({
      title: "BIO101 Syllabus",
      url: "https://school.instructure.com/courses/42/assignments/syllabus",
    });
  });
});
