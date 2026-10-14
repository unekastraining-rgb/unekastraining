/**
 * 2P-41 — Language workspace normalization, evaluation, honesty, evidence tests.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  getLanguageChallenge,
  listLanguageChallenges,
  LANGUAGE_CHALLENGES,
} from "@/lib/learning/activities/language/challenges";
import { evaluateLanguageActivity } from "@/lib/learning/activities/language/evaluate";
import {
  matchesExpectedResponse,
  normalizeLanguageText,
} from "@/lib/learning/activities/language/normalize";
import { LANGUAGE_WORKSPACE_PROGRESSION_ENTRIES } from "@/lib/learning/activities/language/progression";
import { describeSpeechCapabilityHonesty } from "@/lib/learning/activities/language/speech-capability";

describe("2P-41 normalization", () => {
  it("normalizes case, whitespace, and punctuation conservatively", () => {
    expect(normalizeLanguageText("  Estoy BIEN!!! ")).toBe("estoy bien");
    expect(normalizeLanguageText("¿Cómo estás?")).toBe("cómo estás");
  });

  it("accepts approved variants and rejects incorrect responses", () => {
    expect(
      matchesExpectedResponse("Estoy bien.", ["Estoy bien.", "Muy bien."]),
    ).toBe(true);
    expect(
      matchesExpectedResponse("I am go store", [
        "I am going to the store.",
      ]),
    ).toBe(false);
  });
});

describe("2P-41 evaluateLanguageActivity", () => {
  it("accepts valid transcript and typed responses", () => {
    const challenge = getLanguageChallenge("lang-speak-train-station")!;
    const spoken = evaluateLanguageActivity(challenge, {
      transcript: "I need help finding the train station.",
    });
    expect(spoken.outcome).toBe("SUCCESS");
    expect(spoken.details.pronunciationQualityScore).toBeNull();
    expect(spoken.details.responseChannel).toBe("spoken_transcript");

    const typed = evaluateLanguageActivity(challenge, {
      typedResponse: "I need help finding the train station.",
    });
    expect(typed.outcome).toBe("SUCCESS");
    expect(typed.details.responseChannel).toBe("typed");
  });

  it("rejects invalid transcript and never invents pronunciation score", () => {
    const challenge = getLanguageChallenge("lang-pronounce-cognate")!;
    const bad = evaluateLanguageActivity(challenge, {
      transcript: "university",
      recordingState: "READY",
    });
    expect(bad.outcome).not.toBe("SUCCESS");
    expect(bad.details.pronunciationQualityScore).toBeNull();
    expect(bad.details.matchLabel).toBe("Speech match");
  });

  it("does not create SUCCESS from recording alone or empty response", () => {
    const challenge = getLanguageChallenge("lang-speak-es-greeting")!;
    const empty = evaluateLanguageActivity(challenge, {
      recordingState: "READY",
      speechCapability: { recognitionAvailable: true },
    });
    expect(empty.outcome).toBe("FAIL");
    expect(empty.score).toBe(0);
  });

  it("evaluates listening choices deterministically", () => {
    const challenge = getLanguageChallenge("lang-listen-store-hours")!;
    expect(
      evaluateLanguageActivity(challenge, { selectedOptionId: "a" }).outcome,
    ).toBe("SUCCESS");
    expect(
      evaluateLanguageActivity(challenge, { selectedOptionId: "b" }).outcome,
    ).not.toBe("SUCCESS");
  });

  it("accepts conversation response variants and rejects others", () => {
    const challenge = getLanguageChallenge("lang-convo-es-greeting")!;
    expect(
      evaluateLanguageActivity(challenge, {
        typedResponse: "Bien, gracias.",
      }).outcome,
    ).toBe("SUCCESS");
    expect(
      evaluateLanguageActivity(challenge, {
        typedResponse: "I am fine",
      }).outcome,
    ).not.toBe("SUCCESS");
  });
});

describe("2P-41 content + capability honesty", () => {
  it("ships a focused English↔Spanish pack", () => {
    expect(LANGUAGE_CHALLENGES.length).toBeGreaterThanOrEqual(6);
    expect(LANGUAGE_CHALLENGES.length).toBeLessThanOrEqual(10);
    expect(listLanguageChallenges().every((c) => c.languageCode)).toBe(true);
    expect(LANGUAGE_WORKSPACE_PROGRESSION_ENTRIES).toHaveLength(
      LANGUAGE_CHALLENGES.length,
    );
    const honesty = describeSpeechCapabilityHonesty();
    expect(honesty.canScorePronunciationQuality).toBe(false);
    expect(honesty.canMatchTranscript).toBe(true);
  });
});

describe("2P-41 submitLanguageChallenge evidence boundary", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("records evidence only on submit and strips forgery; no fake SUCCESS", async () => {
    vi.doMock("@/lib/learning/activities/server-evaluation", async () => {
      const actual = await vi.importActual<
        typeof import("@/lib/learning/activities/server-evaluation")
      >("@/lib/learning/activities/server-evaluation");
      return {
        ...actual,
        recordAuthoritativeActivityEvidence: vi.fn(async (input) => ({
          ok: true as const,
          completion: {
            outcome: input.evaluation.outcome,
            score: input.evaluation.score,
            learningAttemptId: "attempt-lang-1",
            conceptId: input.conceptId,
            skillFacet: input.skillFacet,
          },
        })),
      };
    });

    const { submitLanguageChallenge } = await import(
      "@/lib/learning/activities/language/service"
    );

    const forged = await submitLanguageChallenge({
      learnerId: "learner-a",
      conceptId: "concept-1",
      challengeId: "lang-speak-train-station",
      clientBody: {
        transcript: "wrong phrase",
        outcome: "SUCCESS",
        score: 1,
        learnerId: "forged",
      },
    });
    expect(forged.ok).toBe(true);
    if (forged.ok) {
      expect(forged.completion.outcome).not.toBe("SUCCESS");
      expect(forged.rejectedForgeryKeys.length).toBeGreaterThan(0);
      expect(forged.evaluationDetails.pronunciationQualityScore).toBeNull();
    }

    const valid = await submitLanguageChallenge({
      learnerId: "learner-a",
      conceptId: "concept-1",
      challengeId: "lang-speak-train-station",
      clientBody: {
        typedResponse: "I need help finding the train station.",
        recordingState: "IDLE",
      },
    });
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.completion.outcome).toBe("SUCCESS");
      expect(valid.evaluationDetails.pronunciationQualityScore).toBeNull();
    }
  });
});
