/**
 * 2P-41 — Deterministic language activity evaluation (no LLM authority).
 * Never invents pronunciation quality scores.
 */

import type {
  LanguageChallenge,
  LanguageWorkspaceSubmission,
} from "./types";
import {
  matchesExpectedResponse,
  pickLearnerResponseText,
} from "./normalize";
import {
  makeServerEvaluation,
  outcomeFromPassRatio,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalEvaluationResult } from "@/lib/learning/activities/execution-contract";
import type { MasteryFacetName } from "@/lib/learning/types";

function misconceptionSignals(
  challenge: LanguageChallenge,
  matched: boolean,
): string[] {
  if (matched) return [];
  return (challenge.misconceptionTargets ?? []).slice(0, 2);
}

/**
 * Authoritative evaluator.
 * Recording state / mic permission / empty transcript alone never yield SUCCESS.
 */
export function evaluateLanguageActivity(
  challenge: LanguageChallenge,
  submission: LanguageWorkspaceSubmission,
): UniversalEvaluationResult {
  const facet: MasteryFacetName = challenge.skillFacet ?? "PERFORM";

  // Capability / recording alone is never success.
  if (
    !submission.transcript?.trim() &&
    !submission.typedResponse?.trim() &&
    !submission.selectedOptionId?.trim()
  ) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: facet,
      details: {
        matched: false,
        matchKind: "none",
        evaluationKind: "language_phrase_match",
        matchLabel: challenge.matchLabel ?? "Speech match",
        pronunciationQualityScore: null,
        misconceptionSignals: misconceptionSignals(challenge, false),
        reason: "empty_response",
        responseChannel: "empty",
        mode: challenge.mode,
        languageCode: challenge.languageCode,
      },
    });
  }

  if (challenge.mode === "LISTEN") {
    const selected = (submission.selectedOptionId ?? "").trim();
    const correctId = challenge.correctListenOptionId ?? "";
    const matched = Boolean(correctId) && selected === correctId;
    const score = matched ? 1 : 0;
    return makeServerEvaluation({
      outcome: outcomeFromPassRatio(score),
      score,
      skillFacet: facet,
      details: {
        matched,
        matchKind: "listen_option",
        evaluationKind: "language_listen_choice",
        matchLabel: challenge.matchLabel ?? "Listening choice",
        pronunciationQualityScore: null,
        selectedOptionId: selected || null,
        correctListenOptionId: correctId,
        misconceptionSignals: misconceptionSignals(challenge, matched),
        responseChannel: "typed",
        mode: challenge.mode,
        languageCode: challenge.languageCode,
      },
    });
  }

  const picked = pickLearnerResponseText(submission);
  const matched = matchesExpectedResponse(
    picked.text,
    challenge.expectedResponses,
  );
  const score = matched ? 1 : 0;

  return makeServerEvaluation({
    outcome: outcomeFromPassRatio(score),
    score,
    skillFacet: facet,
    details: {
      matched,
      matchKind:
        challenge.mode === "CONVERSATION"
          ? "accepted_response_set"
          : "phrase_match",
      evaluationKind: "language_phrase_match",
      matchLabel: challenge.matchLabel ?? "Speech match",
      /** Explicit honesty: never a real pronunciation quality metric. */
      pronunciationQualityScore: null,
      expectedIntent: challenge.expectedIntent ?? null,
      misconceptionSignals: misconceptionSignals(challenge, matched),
      responseChannel: picked.channel,
      mode: challenge.mode,
      languageCode: challenge.languageCode,
      speechCapabilityNote:
        "Transcript/typed match only — not phoneme, accent, or fluency scoring.",
    },
  });
}
