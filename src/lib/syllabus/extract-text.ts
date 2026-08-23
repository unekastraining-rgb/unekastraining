import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { getVisionExtractor } from "@/lib/ai/service";

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
  "Extract all readable text from this syllabus document image. Return only the extracted text with no commentary.";

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text.trim();
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

async function extractImageText(buffer: Buffer, mimeType: string): Promise<string> {
  const vision = getVisionExtractor();
  const base64 = buffer.toString("base64");

  if (vision.provider === "gemini") {
    return vision.extract(IMAGE_EXTRACTION_PROMPT, base64, mimeType);
  }

  throw new Error(
    "Image syllabi need AI for text extraction. Upload a PDF or DOCX for offline parsing, or add GEMINI_API_KEY for image OCR.",
  );
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
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

  if (IMAGE_MIME_TYPES.has(mimeType) || /\.(jpe?g|png|webp|gif)$/i.test(lowerName)) {
    return extractImageText(buffer, mimeType || "image/jpeg");
  }

  throw new Error(
    "Unsupported file type. Please upload a PDF, DOCX, or image file.",
  );
}
