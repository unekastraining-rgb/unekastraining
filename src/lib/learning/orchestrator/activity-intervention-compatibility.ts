/**
 * 2G-74 / 2G-77 — Activity intervention compatibility (post-capability, pre-availability).
 *
 * Answers: "Does this activity fit the available learning context?"
 * Does NOT answer diagnosis, availability, ranking, or Adaptive progression.
 *
 * States:
 * - MATCH — authoritative-enough context supports the activity
 * - NO_MATCH — authoritative context indicates the activity does not fit
 * - INSUFFICIENT_CONTEXT — cannot safely determine (do not guess → no auto-select)
 *
 * Concept remains the primary knowledge atom. Prefer Concept/LearningSpace
 * subjectDomain over title/topic string cues. Title/topic may reinforce a match
 * but never invent a domain taxonomy.
 *
 * 2G-77 — Matching is contiguous token/phrase based (not arbitrary substring).
 * Longer phrase matches outrank shorter token matches so
 * "computer science" does not falsely MATCH Lab via "science".
 */

import type { ActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";
import { ACTIVITY_INTERVENTION_CAPABILITIES } from "@/lib/learning/orchestrator/activity-intervention-capability";

export type ActivityCompatibilityStatus =
  | "MATCH"
  | "NO_MATCH"
  | "INSUFFICIENT_CONTEXT";

/** Higher = stronger authoritative fit (only meaningful when status === MATCH). */
export type ActivityCompatibilityStrength =
  | 0 // capability does not require context
  | 1 // title/topic cue only
  | 2; // subjectDomain cue

export type ActivitySelectionContext = {
  conceptTitle: string;
  topicName?: string | null;
  /** Authoritative Concept / LearningSpace subjectDomain when present. */
  subjectDomain?: string | null;
};

export type ActivityCompatibilityResult = {
  status: ActivityCompatibilityStatus;
  strength: ActivityCompatibilityStrength;
  /** Hint tokens that matched (empty when not MATCH). */
  matchedTokens: readonly string[];
  reason: string;
};

type HintMatch = {
  hint: string;
  /** Contiguous token length of the matched hint phrase. */
  phraseLength: number;
};

/**
 * Normalize for deterministic matching: lower-case, separators → space,
 * strip other punctuation, collapse whitespace.
 */
export function normalizeCompatibilityText(
  value: string | null | undefined,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[/_|.,;:+\-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize normalized text into whole tokens (empty → []). */
export function tokenizeCompatibilityText(
  value: string | null | undefined,
): string[] {
  const normalized = normalizeCompatibilityText(value);
  return normalized ? normalized.split(" ") : [];
}

/**
 * True when hint tokens appear as a contiguous phrase inside haystack tokens.
 * Never uses arbitrary substring containment (avoids java⊂javascript,
 * science⊂computer science as an accidental Lab match when a longer Coding
 * phrase also matches — see longest-phrase preference below).
 */
export function hintMatchesAsPhrase(
  hint: string,
  haystackTokens: readonly string[],
): boolean {
  const hintTokens = tokenizeCompatibilityText(hint);
  if (hintTokens.length === 0 || haystackTokens.length === 0) return false;
  if (hintTokens.length > haystackTokens.length) return false;

  for (let i = 0; i <= haystackTokens.length - hintTokens.length; i++) {
    let ok = true;
    for (let j = 0; j < hintTokens.length; j++) {
      if (haystackTokens[i + j] !== hintTokens[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function collectHintMatches(
  hints: readonly string[],
  haystackTokens: readonly string[],
): HintMatch[] {
  const out: HintMatch[] = [];
  for (const hint of hints) {
    if (!hintMatchesAsPhrase(hint, haystackTokens)) continue;
    const phraseLength = tokenizeCompatibilityText(hint).length;
    if (phraseLength === 0) continue;
    out.push({ hint: hint.trim(), phraseLength });
  }
  return out;
}

/**
 * Prefer longer contiguous phrase matches over shorter ones.
 * Example: domain tokens [computer, science] —
 * Coding "computer science" (len 2) outranks Lab "science" (len 1).
 */
export function selectMaximalPhraseMatches(
  ownMatches: readonly HintMatch[],
  competitorMatches: readonly HintMatch[],
): {
  ownMaximal: HintMatch[];
  competitorHasMaximal: boolean;
  competitorHasAny: boolean;
  maxPhraseLength: number;
} {
  const all = [...ownMatches, ...competitorMatches];
  if (all.length === 0) {
    return {
      ownMaximal: [],
      competitorHasMaximal: false,
      competitorHasAny: false,
      maxPhraseLength: 0,
    };
  }
  const maxPhraseLength = Math.max(...all.map((m) => m.phraseLength));
  return {
    ownMaximal: ownMatches.filter((m) => m.phraseLength === maxPhraseLength),
    competitorHasMaximal: competitorMatches.some(
      (m) => m.phraseLength === maxPhraseLength,
    ),
    competitorHasAny: competitorMatches.length > 0,
    maxPhraseLength,
  };
}

function buildTitleTopicBlob(context: ActivitySelectionContext): string {
  return [context.conceptTitle, context.topicName ?? ""]
    .map(normalizeCompatibilityText)
    .filter(Boolean)
    .join(" ");
}

/**
 * Other intervention-eligible Adaptive-ready activities' context hints.
 * Used only to detect authoritative NO_MATCH (domain clearly belongs elsewhere).
 */
function competingAdaptiveReadyHints(
  excludeAdapterKey: string,
): readonly string[] {
  const hints: string[] = [];
  for (const cap of ACTIVITY_INTERVENTION_CAPABILITIES) {
    if (cap.adapterKey === excludeAdapterKey) continue;
    if (!cap.interventionEligible) continue;
    if (!cap.adaptiveBindIntegrated) continue;
    if (!cap.requiresConceptContext) continue;
    hints.push(...cap.contextHints);
  }
  return hints;
}

/**
 * Match capability hints against a haystack with longest-phrase preference
 * relative to competing Adaptive-ready families.
 */
function matchHintsWithCompetition(
  capabilityHints: readonly string[],
  competitorHints: readonly string[],
  haystackTokens: readonly string[],
): { matchedHints: string[]; competitorOwnsDomain: boolean } {
  const own = collectHintMatches(capabilityHints, haystackTokens);
  const competitors = collectHintMatches(competitorHints, haystackTokens);
  const selected = selectMaximalPhraseMatches(own, competitors);

  if (selected.ownMaximal.length > 0) {
    return {
      matchedHints: selected.ownMaximal.map((m) => m.hint),
      competitorOwnsDomain: false,
    };
  }

  // No maximal own match — if any competitor matched (including shorter when
  // own had nothing, or maximal when own was only shorter), domain belongs elsewhere.
  if (selected.competitorHasAny) {
    return { matchedHints: [], competitorOwnsDomain: true };
  }

  return { matchedHints: [], competitorOwnsDomain: false };
}

/**
 * Evaluate compatibility for one capability against selection context.
 * Pure — no DB, no evidence, no mastery writes.
 */
export function evaluateActivityCompatibility(
  capability: ActivityInterventionCapability,
  context: ActivitySelectionContext,
): ActivityCompatibilityResult {
  if (!capability.requiresConceptContext) {
    return {
      status: "MATCH",
      strength: 0,
      matchedTokens: [],
      reason: "capability_does_not_require_context",
    };
  }

  if (capability.contextHints.length === 0) {
    return {
      status: "INSUFFICIENT_CONTEXT",
      strength: 0,
      matchedTokens: [],
      reason: "capability_has_no_context_vocabulary",
    };
  }

  const competitors = competingAdaptiveReadyHints(capability.adapterKey);
  const domain = normalizeCompatibilityText(context.subjectDomain);
  if (domain) {
    const domainTokens = tokenizeCompatibilityText(domain);
    const resolved = matchHintsWithCompetition(
      capability.contextHints,
      competitors,
      domainTokens,
    );
    if (resolved.matchedHints.length > 0) {
      return {
        status: "MATCH",
        strength: 2,
        matchedTokens: resolved.matchedHints,
        reason: "subject_domain_match",
      };
    }
    if (resolved.competitorOwnsDomain) {
      return {
        status: "NO_MATCH",
        strength: 0,
        matchedTokens: [],
        reason: "subject_domain_matches_other_activity_family",
      };
    }

    // Domain present but unrecognized — do not guess from title alone when
    // an authoritative domain string already exists and did not match.
    return {
      status: "INSUFFICIENT_CONTEXT",
      strength: 0,
      matchedTokens: [],
      reason: "subject_domain_unrecognized",
    };
  }

  const titleBlob = buildTitleTopicBlob(context);
  if (!titleBlob) {
    return {
      status: "INSUFFICIENT_CONTEXT",
      strength: 0,
      matchedTokens: [],
      reason: "no_title_or_topic_context",
    };
  }

  const titleTokens = tokenizeCompatibilityText(titleBlob);
  const titleResolved = matchHintsWithCompetition(
    capability.contextHints,
    competitors,
    titleTokens,
  );
  if (titleResolved.matchedHints.length > 0) {
    return {
      status: "MATCH",
      strength: 1,
      matchedTokens: titleResolved.matchedHints,
      reason: "title_topic_cue_match",
    };
  }

  // Title-path: competitor ownership does not force NO_MATCH (title cues are
  // weaker / mixed). Fall through to insufficient when this capability missed.
  return {
    status: "INSUFFICIENT_CONTEXT",
    strength: 0,
    matchedTokens: [],
    reason: "no_compatible_context_cues",
  };
}

export function isActivityCompatibilityMatch(
  result: ActivityCompatibilityResult,
): boolean {
  return result.status === "MATCH";
}

export function activityCompatibilityTruthSummary(): {
  contaminatesDiagnosis: false;
  guessesWhenInsufficient: false;
  prefersSubjectDomainOverTitle: true;
  titleOnlyCanMatch: true;
  writesEvidence: false;
  writesMastery: false;
  usesSubstringContainment: false;
  prefersLongerPhraseMatches: true;
} {
  return {
    contaminatesDiagnosis: false,
    guessesWhenInsufficient: false,
    prefersSubjectDomainOverTitle: true,
    titleOnlyCanMatch: true,
    writesEvidence: false,
    writesMastery: false,
    usesSubstringContainment: false,
    prefersLongerPhraseMatches: true,
  };
}
