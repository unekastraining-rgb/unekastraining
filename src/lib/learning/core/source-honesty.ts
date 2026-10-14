/**
 * Bundle J — Core source honesty summaries.
 * Does not invent OCR/vision; reports when understanding is unavailable.
 */

export type CoreSourceHonesty = {
  understandingAvailable: boolean;
  sourceKind: "text" | "ink" | "pdf" | "image" | "mixed" | "unknown";
  learnerMessage: string;
};

/**
 * Summarize whether Core can identify concepts from extract metadata.
 */
export function summarizeCoreSourceHonesty(input: {
  understanding?: "available" | "unavailable" | string | null;
  sourceType?: string | null;
  textLength?: number;
  hasInk?: boolean;
  hasImages?: boolean;
  hasPdf?: boolean;
}): CoreSourceHonesty {
  const understandingAvailable = input.understanding === "available";
  let sourceKind: CoreSourceHonesty["sourceKind"] = "unknown";
  if (input.hasPdf || input.sourceType === "pdf") sourceKind = "pdf";
  else if (input.hasImages && !(input.textLength && input.textLength > 0))
    sourceKind = "image";
  else if (input.hasInk && !(input.textLength && input.textLength > 20))
    sourceKind = "ink";
  else if ((input.textLength ?? 0) > 0) sourceKind = "text";
  else if (input.hasImages || input.hasInk) sourceKind = "mixed";

  if (understandingAvailable) {
    return {
      understandingAvailable: true,
      sourceKind,
      learnerMessage:
        "Concepts were identified from available text. Your note content was not changed.",
    };
  }

  const reason =
    sourceKind === "pdf"
      ? "PDF text was not extracted for concept identification."
      : sourceKind === "image"
        ? "Image/drawing content could not be interpreted as text."
        : sourceKind === "ink"
          ? "Handwriting could not be converted to text for concept identification."
          : "Not enough readable text to identify concepts.";

  return {
    understandingAvailable: false,
    sourceKind,
    learnerMessage: `${reason} You can still Learn from a typed topic, or add typed notes.`,
  };
}
