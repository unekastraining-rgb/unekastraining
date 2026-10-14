/**
 * Conservative transcript normalization for language match evaluation.
 * Does not rewrite incorrect grammar into correct forms.
 */

export function normalizeLanguageText(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[¿¡]/g, "")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True when normalized learner text equals any approved expected response.
 * No fuzzy rewrite of wrong language into correct language.
 */
export function matchesExpectedResponse(
  learnerText: string,
  expectedResponses: readonly string[],
): boolean {
  const normalized = normalizeLanguageText(learnerText);
  if (!normalized) return false;
  return expectedResponses.some(
    (expected) => normalizeLanguageText(expected) === normalized,
  );
}

export function pickLearnerResponseText(input: {
  transcript?: string;
  typedResponse?: string;
}): { text: string; channel: "spoken_transcript" | "typed" | "empty" } {
  const spoken = (input.transcript ?? "").trim();
  if (spoken) {
    return { text: spoken, channel: "spoken_transcript" };
  }
  const typed = (input.typedResponse ?? "").trim();
  if (typed) {
    return { text: typed, channel: "typed" };
  }
  return { text: "", channel: "empty" };
}
