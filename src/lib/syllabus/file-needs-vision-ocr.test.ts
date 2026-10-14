import { describe, expect, it } from "vitest";

import { fileNeedsVisionOcr } from "@/lib/syllabus/extract-text";

describe("fileNeedsVisionOcr (cold-start photo path)", () => {
  it("flags common syllabus photo types for Gemini/OpenRouter vision", () => {
    expect(fileNeedsVisionOcr("image/jpeg", "syllabus.jpg")).toBe(true);
    expect(fileNeedsVisionOcr("image/png", "board.png")).toBe(true);
    expect(fileNeedsVisionOcr("image/webp", "slide.webp")).toBe(true);
    expect(fileNeedsVisionOcr("application/octet-stream", "lecture.JPEG")).toBe(
      true,
    );
  });

  it("leaves PDF/DOCX on the non-vision extract path", () => {
    expect(fileNeedsVisionOcr("application/pdf", "chapter.pdf")).toBe(false);
    expect(
      fileNeedsVisionOcr(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "syllabus.docx",
      ),
    ).toBe(false);
  });
});
