/**
 * Phase 8 — Source integrity for AI lessons / prompts.
 * Detects fabricated citation claims when no real retrieved sources exist.
 * Not a universal fact-checker.
 */

const URL_IN_TEXT =
  /\bhttps?:\/\/[^\s)\]"']+/gi;

const FAKE_ATTRIBUTION =
  /\b(according to|as reported by|cited in|from the article|wikipedia says|per a study at|researchers at)\b[^.]{0,80}\b(https?:\/\/|www\.|[A-Z][a-z]+\s+(Times|Journal|Review|University|Press))\b/i;

const WEB_RESEARCH_CLAIM =
  /\b(based on (web|online) (search|research|sources)|retrieved from the (web|internet)|sources found online)\b/i;

export type SourceIntegrityResult = {
  ok: boolean;
  reasons: string[];
};

/**
 * When no real external references were retrieved, reject lessons that
 * invent URLs or claim web/source attribution.
 */
export function validateLessonSourceIntegrity(input: {
  lessonText: string;
  /** Real references from provenance (may be empty). */
  allowedReferences?: string[];
  /** True when sourceKind is retrieved-web or combined with external sources. */
  hasRetrievedWebSources?: boolean;
  /** True when knowledge came only from general-ai (no web). */
  isGeneralAiOnly?: boolean;
}): SourceIntegrityResult {
  const reasons: string[] = [];
  const text = input.lessonText ?? "";
  const allowed = new Set(
    (input.allowedReferences ?? []).map((r) => r.trim().toLowerCase()),
  );

  const urls = text.match(URL_IN_TEXT) ?? [];
  for (const url of urls) {
    const key = url.replace(/[.,;:]+$/, "").toLowerCase();
    if (!allowed.has(key) && !input.hasRetrievedWebSources) {
      reasons.push("fabricated-url");
      break;
    }
    if (allowed.size > 0 && !allowed.has(key)) {
      // URL not in allowed set even when some web sources exist.
      if (![...allowed].some((a) => key.includes(a) || a.includes(key))) {
        reasons.push("unlisted-url");
        break;
      }
    }
  }

  if (
    (input.isGeneralAiOnly || !input.hasRetrievedWebSources) &&
    WEB_RESEARCH_CLAIM.test(text)
  ) {
    reasons.push("false-web-research-claim");
  }

  if (
    (input.isGeneralAiOnly || !input.hasRetrievedWebSources) &&
    FAKE_ATTRIBUTION.test(text)
  ) {
    reasons.push("fabricated-attribution");
  }

  return { ok: reasons.length === 0, reasons };
}
