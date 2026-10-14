import { fileNeedsVisionOcr } from "@/lib/syllabus/extract-text";

/** Minimum OCR chars before we treat a photo as usable cold-start text. */
export const MIN_VISION_OCR_CHARS = 40;

export function visionOcrFailureMessage(error: unknown): string {
  const detail =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : "Could not read text from this photo.";
  if (/GEMINI|OPENROUTER|OCR needs|vision/i.test(detail)) {
    return detail;
  }
  return `${detail} Add GEMINI_API_KEY (preferred) or OPENROUTER_API_KEY for vision OCR, or paste syllabus text / sync Canvas. Free-tier text AI still uses Gemini → Groq → OpenRouter.`;
}

/**
 * For syllabus/photo cold start: fail loudly instead of saving empty OCR.
 * Returns an error message when the upload needs vision OCR but text is unusable.
 */
export function visionOcrUnusableReason(
  mimeType: string,
  fileName: string,
  text: string | null | undefined,
): string | null {
  if (!fileNeedsVisionOcr(mimeType, fileName)) return null;
  if ((text ?? "").trim().length >= MIN_VISION_OCR_CHARS) return null;
  return "Could not read enough text from this photo. Try a clearer shot, add a Gemini/OpenRouter vision key, or paste syllabus text / sync Canvas.";
}
