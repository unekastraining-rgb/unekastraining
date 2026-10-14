import { describe, expect, it } from "vitest";

import {
  MIN_VISION_OCR_CHARS,
  visionOcrFailureMessage,
  visionOcrUnusableReason,
} from "@/lib/syllabus/ocr-gate";

describe("vision OCR cold-start gate", () => {
  it("requires a minimum amount of extracted text for photos", () => {
    expect(visionOcrUnusableReason("image/jpeg", "syllabus.jpg", "")).toMatch(
      /enough text/i,
    );
    expect(
      visionOcrUnusableReason("image/png", "page.png", "x".repeat(MIN_VISION_OCR_CHARS - 1)),
    ).toMatch(/enough text/i);
    expect(
      visionOcrUnusableReason(
        "image/png",
        "page.png",
        "Week 1 markets and supply ".repeat(3),
      ),
    ).toBeNull();
  });

  it("does not gate PDFs or DOCX", () => {
    expect(visionOcrUnusableReason("application/pdf", "ch1.pdf", "")).toBeNull();
  });

  it("surfaces missing vision key errors clearly", () => {
    expect(
      visionOcrFailureMessage(
        new Error("Image OCR needs a free AI key. Add GEMINI_API_KEY"),
      ),
    ).toMatch(/GEMINI_API_KEY/);
  });
});
