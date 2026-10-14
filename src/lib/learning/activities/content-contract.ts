/**
 * 2P-7 — Universal Activity content contract.
 *
 * Concept defines what is being learned.
 * Activity mechanism defines how it is practiced.
 * Content defines the actual learning experience.
 * Evaluation determines what was demonstrated.
 * Evidence updates the universal Learner Model.
 *
 * Domain provides context; it does not become a subject-specific learning engine.
 *
 * Content identity (contentId / challengeId) is a reusable template reference —
 * not a LearningAttempt, Adaptive run, or learner state.
 */

import { getCodingChallenge, listCodingChallenges } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge, listSqlChallenges } from "@/lib/learning/activities/sql/challenges";
import {
  getMathChallenge,
  listMathChallenges,
} from "@/lib/learning/activities/math/challenges";
import {
  getNetworkChallenge,
  listNetworkChallenges,
} from "@/lib/learning/activities/networking/challenges";
import {
  getLanguageChallenge,
  listLanguageChallenges,
} from "@/lib/learning/activities/language/challenges";
import {
  getStructuredChallenge,
  listStructuredChallenges,
  type StructuredActivityKind,
} from "@/lib/learning/activities/structured/service";
import type { MasteryFacetName } from "@/lib/learning/types";

export type UniversalContentActivityKind =
  | "coding"
  | "sql"
  | "math"
  | "networking"
  | "language"
  | StructuredActivityKind;

export type UniversalActivityContentDescriptor = {
  /** Opaque reusable content identity (= challenge id). Not an attempt id. */
  contentId: string;
  activityKind: UniversalContentActivityKind;
  title: string;
  /** What the learner will demonstrate. */
  objective: string;
  /** Concrete task presented to the learner. */
  task: string;
  /** Optional free-form domain/context label (not a subject engine). */
  domainContext: string | null;
  /** Tokens used for deterministic concept↔content matching. */
  conceptHints: readonly string[];
  skillFacet: MasteryFacetName | null;
  evaluationMode: "execution" | "structural" | "sqljs" | "rubric" | "math_steps" | "network_state" | "language_match";
};

export type ContentSelectionInput = {
  activityKind: UniversalContentActivityKind;
  /** Explicit content wins when valid for the kind. */
  contentId?: string | null;
  conceptTitle?: string | null;
  subjectDomain?: string | null;
  /**
   * Soft-exclude recently practiced content ids when alternatives exist
   * (2P-46 transfer / anti-memorization). Not a hard filter.
   */
  excludeContentIds?: readonly string[] | null;
};

export type ContentSelectionResult = {
  contentId: string;
  reason:
    | "explicit_content_id"
    | "concept_hint_match"
    | "domain_context_fallback"
    | "deterministic_catalog_default";
  descriptor: UniversalActivityContentDescriptor;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+]+/g)
    .filter((t) => t.length >= 2);
}

function scoreHints(
  hints: readonly string[],
  tokens: readonly string[],
): number {
  if (!hints.length || !tokens.length) return 0;
  let score = 0;
  for (const hint of hints) {
    const h = hint.toLowerCase();
    if (tokens.includes(h)) score += h.length >= 6 ? 3 : 2;
    else if (tokens.some((t) => t.includes(h) || h.includes(t))) score += 1;
  }
  return score;
}

function codingDescriptor(
  id: string,
): UniversalActivityContentDescriptor | null {
  const c = getCodingChallenge(id);
  if (!c) return null;
  return {
    contentId: c.id,
    activityKind: "coding",
    title: c.title,
    objective: c.objective,
    task: c.prompt,
    domainContext: c.domainTag ?? null,
    conceptHints: c.conceptHints ?? [],
    skillFacet: "PERFORM",
    evaluationMode:
      c.language === "javascript" ? "execution" : "structural",
  };
}

function sqlDescriptor(id: string): UniversalActivityContentDescriptor | null {
  const c = getSqlChallenge(id);
  if (!c) return null;
  return {
    contentId: c.id,
    activityKind: "sql",
    title: c.title,
    objective: c.objective,
    task: c.prompt,
    domainContext: c.domainTag ?? null,
    conceptHints: c.conceptHints ?? [],
    skillFacet: "PERFORM",
    evaluationMode: "sqljs",
  };
}

function mathDescriptor(id: string): UniversalActivityContentDescriptor | null {
  const c = getMathChallenge(id);
  if (!c) return null;
  return {
    contentId: c.id,
    activityKind: "math",
    title: c.title,
    objective: c.objective,
    task: c.prompt,
    domainContext: c.domainTag ?? null,
    conceptHints: c.conceptHints ?? [],
    skillFacet: "SOLVE",
    evaluationMode: "math_steps",
  };
}

function networkingDescriptor(
  id: string,
): UniversalActivityContentDescriptor | null {
  const c = getNetworkChallenge(id);
  if (!c) return null;
  return {
    contentId: c.id,
    activityKind: "networking",
    title: c.title,
    objective: c.objective,
    task: c.prompt,
    domainContext: c.domainTag ?? null,
    conceptHints: c.conceptHints ?? [],
    skillFacet: c.skillFacet ?? "SOLVE",
    evaluationMode: "network_state",
  };
}

function languageDescriptor(
  id: string,
): UniversalActivityContentDescriptor | null {
  const c = getLanguageChallenge(id);
  if (!c) return null;
  return {
    contentId: c.id,
    activityKind: "language",
    title: c.title,
    objective: c.objective,
    task: c.prompt,
    domainContext: c.domainTag ?? null,
    conceptHints: c.conceptHints ?? [],
    skillFacet: c.skillFacet ?? "PERFORM",
    evaluationMode: "language_match",
  };
}

function structuredDescriptor(
  id: string,
): UniversalActivityContentDescriptor | null {
  const c = getStructuredChallenge(id);
  if (!c) return null;
  return {
    contentId: c.id,
    activityKind: c.kind,
    title: c.title,
    objective: c.objective,
    task: c.prompt,
    domainContext: c.domainTag ?? null,
    conceptHints: c.conceptHints ?? [],
    skillFacet: c.skillFacet,
    evaluationMode: "rubric",
  };
}

export function getActivityContentDescriptor(
  activityKind: UniversalContentActivityKind,
  contentId: string,
): UniversalActivityContentDescriptor | null {
  if (activityKind === "coding") return codingDescriptor(contentId);
  if (activityKind === "sql") return sqlDescriptor(contentId);
  if (activityKind === "math") return mathDescriptor(contentId);
  if (activityKind === "networking") return networkingDescriptor(contentId);
  if (activityKind === "language") return languageDescriptor(contentId);
  const d = structuredDescriptor(contentId);
  if (!d || d.activityKind !== activityKind) return null;
  return d;
}

export function listActivityContentDescriptors(
  activityKind: UniversalContentActivityKind,
): UniversalActivityContentDescriptor[] {
  if (activityKind === "coding") {
    return listCodingChallenges()
      .map((c) => codingDescriptor(c.id))
      .filter((d): d is UniversalActivityContentDescriptor => d != null);
  }
  if (activityKind === "sql") {
    return listSqlChallenges()
      .map((c) => sqlDescriptor(c.id))
      .filter((d): d is UniversalActivityContentDescriptor => d != null);
  }
  if (activityKind === "math") {
    return listMathChallenges()
      .map((c) => mathDescriptor(c.id))
      .filter((d): d is UniversalActivityContentDescriptor => d != null);
  }
  if (activityKind === "networking") {
    return listNetworkChallenges()
      .map((c) => networkingDescriptor(c.id))
      .filter((d): d is UniversalActivityContentDescriptor => d != null);
  }
  if (activityKind === "language") {
    return listLanguageChallenges()
      .map((c) => languageDescriptor(c.id))
      .filter((d): d is UniversalActivityContentDescriptor => d != null);
  }
  return listStructuredChallenges(activityKind)
    .map((c) => structuredDescriptor(c.id))
    .filter((d): d is UniversalActivityContentDescriptor => d != null);
}

/**
 * Deterministic content selection for a mechanism + concept/domain context.
 * Does NOT choose the activity mechanism (Orchestrator/policy does that).
 * Does NOT use LLM / randomness.
 */
export function selectActivityContent(
  input: ContentSelectionInput,
): ContentSelectionResult | null {
  const catalog = listActivityContentDescriptors(input.activityKind);
  if (catalog.length === 0) return null;

  const explicit = input.contentId?.trim();
  if (explicit) {
    const found = catalog.find((c) => c.contentId === explicit);
    if (found) {
      return {
        contentId: found.contentId,
        reason: "explicit_content_id",
        descriptor: found,
      };
    }
    return null;
  }

  const exclude = new Set(
    (input.excludeContentIds ?? []).map((k) => k.trim()).filter(Boolean),
  );
  let pool = catalog;
  if (exclude.size > 0) {
    const filtered = catalog.filter((c) => !exclude.has(c.contentId));
    if (filtered.length > 0) pool = filtered;
  }

  const titleTokens = tokenize(input.conceptTitle ?? "");
  const domainTokens = tokenize(input.subjectDomain ?? "");

  let best: UniversalActivityContentDescriptor | null = null;
  let bestScore = 0;
  for (const item of pool) {
    const s = scoreHints(item.conceptHints, titleTokens);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }
  if (best && bestScore > 0) {
    return {
      contentId: best.contentId,
      reason: "concept_hint_match",
      descriptor: best,
    };
  }

  if (domainTokens.length > 0) {
    let domainBest: UniversalActivityContentDescriptor | null = null;
    let domainScore = 0;
    for (const item of pool) {
      const ctx = item.domainContext ? tokenize(item.domainContext) : [];
      const s = scoreHints(ctx, domainTokens) + scoreHints(item.conceptHints, domainTokens);
      if (s > domainScore) {
        domainScore = s;
        domainBest = item;
      }
    }
    if (domainBest && domainScore > 0) {
      return {
        contentId: domainBest.contentId,
        reason: "domain_context_fallback",
        descriptor: domainBest,
      };
    }
  }

  // Stable default: first by contentId sort (deterministic catalog order).
  const sorted = [...pool].sort((a, b) =>
    a.contentId.localeCompare(b.contentId),
  );
  const fallback = sorted[0]!;
  return {
    contentId: fallback.contentId,
    reason: "deterministic_catalog_default",
    descriptor: fallback,
  };
}

/**
 * Soft integrity helper: content templates must not carry learner attempt fields.
 */
export function contentTemplateTruthSummary(): {
  contentIdIsNotAttemptId: true;
  contentMustNotStoreLearnerWork: true;
  domainDoesNotChooseMechanism: true;
  conceptDistinctFromMechanism: true;
  evaluationDistinctFromContent: true;
  noLlmContentGeneration: true;
  selectionDeterministic: true;
} {
  return {
    contentIdIsNotAttemptId: true,
    contentMustNotStoreLearnerWork: true,
    domainDoesNotChooseMechanism: true,
    conceptDistinctFromMechanism: true,
    evaluationDistinctFromContent: true,
    noLlmContentGeneration: true,
    selectionDeterministic: true,
  };
}

/**
 * Same concept may be practiced via different mechanisms when content exists.
 * Architecture permission proof — not a forced selector.
 */
export function listMechanismsWithContentForConceptHints(
  conceptTitle: string,
): UniversalContentActivityKind[] {
  const kinds: UniversalContentActivityKind[] = [
    "coding",
    "sql",
    "math",
    "networking",
    "language",
    "lab",
    "simulation",
    "game",
    "writing",
    "project",
    "presentation",
  ];
  const tokens = tokenize(conceptTitle);
  const out: UniversalContentActivityKind[] = [];
  for (const kind of kinds) {
    const catalog = listActivityContentDescriptors(kind);
    if (
      catalog.some((c) => scoreHints(c.conceptHints, tokens) > 0) ||
      catalog.some(
        (c) =>
          c.domainContext &&
          scoreHints(tokenize(c.domainContext), tokens) > 0,
      )
    ) {
      out.push(kind);
    }
  }
  return out;
}
