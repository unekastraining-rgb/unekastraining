import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { getVisionExtractor } from "@/lib/ai/service";
import {
  extractPptxText,
  isPptxFile,
} from "@/lib/syllabus/extract-pptx";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function fileNeedsVisionOcr(mimeType: string, fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return (
    IMAGE_MIME_TYPES.has(mimeType) || /\.(jpe?g|png|webp|gif)$/i.test(lowerName)
  );
}

const IMAGE_EXTRACTION_PROMPT =
  "You are OCR for student study materials (syllabus, textbook page, lecture slide, handwritten board photo). Extract ALL readable text in reading order. Keep headings, numbered lists, definitions, and formulas. Skip decorative UI chrome. Return only the extracted text — no commentary.";

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const pages = Array.isArray(result.pages) ? result.pages : [];
  if (pages.length > 0) {
    const withMarkers = pages
      .map((page: { text?: string; num?: number }, index: number) => {
        const pageNum = typeof page.num === "number" ? page.num : index + 1;
        const text = String(page.text ?? "").trim();
        if (!text) return "";
        return `--- page ${pageNum} ---\n${text}`;
      })
      .filter(Boolean)
      .join("\n\n");
    if (withMarkers.trim()) return withMarkers.trim();
  }

  return result.text.trim();
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

async function extractImageText(
  buffer: Buffer,
  mimeType: string,
  options?: { includeOpenAIPro?: boolean },
): Promise<string> {
  const vision = getVisionExtractor({
    includeOpenAIPro: options?.includeOpenAIPro,
  });
  const base64 = buffer.toString("base64");

  if (!("extract" in vision)) {
    throw new Error(
      "Image OCR needs a free AI key. Add GEMINI_API_KEY or OPENROUTER_API_KEY (vision), or upload a PDF/DOCX.",
    );
  }

  return vision.extract(IMAGE_EXTRACTION_PROMPT, base64, mimeType);
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  options?: { includeOpenAIPro?: boolean },
): Promise<string> {
  const lowerName = fileName.toLowerCase();

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return extractPdfText(buffer);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    return extractDocxText(buffer);
  }

  if (isPptxFile(mimeType, fileName)) {
    return extractPptxText(buffer);
  }

  if (IMAGE_MIME_TYPES.has(mimeType) || /\.(jpe?g|png|webp|gif)$/i.test(lowerName)) {
    return extractImageText(buffer, mimeType || "image/jpeg", options);
  }

  throw new Error(
    "Unsupported file type. Please upload a PDF, DOCX, PPTX, or image file.",
  );
}
