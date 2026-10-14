/**
 * 2P-20 — Lightweight Teaching Style hints from learner messages.
 * Not a second intent parser. Only clear, explicit style phrases.
 * Never infers age, intelligence, struggle, or diagnosis.
 */

import type { TeachingStyle } from "./types";
import { TEACH_ME_LIKE_IM_5_STYLE } from "./types";

/**
 * Extract an explicit style request from free text when present.
 * Returns undefined when no clear style phrase is found.
 */
export function extractTeachingStyleHintFromMessage(
  message: string | null | undefined,
): TeachingStyle | undefined {
  if (!message?.trim()) return undefined;
  const lower = message.toLowerCase();

  if (
    /teach\s+me\s+(this\s+|that\s+|it\s+)?like\s+i('?| a)?m\s+5/.test(lower) ||
    /explain\s+(this\s+|that\s+|it\s+)?like\s+i('?| a)?m\s+5/.test(lower) ||
    /like\s+i('?| a)?m\s+five/.test(lower) ||
    (/\bsimplif(y|ied)\b/.test(lower) && /please|explain|teach/.test(lower))
  ) {
    return TEACH_ME_LIKE_IM_5_STYLE;
  }

  if (
    /explain\s+(that\s+|this\s+|it\s+)?normally/.test(lower) ||
    /standard\s+explanation/.test(lower) ||
    /give\s+me\s+the\s+normal\s+version/.test(lower)
  ) {
    return "STANDARD";
  }

  if (
    /detailed\s+version/.test(lower) ||
    /give\s+me\s+the\s+detailed/.test(lower) ||
    /more\s+detail(ed)?\s+explanation/.test(lower) ||
    /go\s+deeper/.test(lower) && /explain|detail/.test(lower)
  ) {
    return "DETAILED";
  }

  if (/beginner\s+(explanation|version|style)/.test(lower)) {
    return "BEGINNER";
  }

  return undefined;
}
