/**
 * Provider-independent speech capability description.
 * Learning model must not depend on provider-specific IDs or scores.
 */

export type SpeechCapabilitySnapshot = {
  recognitionAvailable: boolean;
  synthesisAvailable: boolean;
  /** Honest: we can match transcripts; we cannot score phonemes/accent. */
  canScorePronunciationQuality: false;
  canMatchTranscript: true;
  notes: string;
};

/** Pure description for docs/tests — browser probing happens client-side. */
export function describeSpeechCapabilityHonesty(): SpeechCapabilitySnapshot {
  return {
    recognitionAvailable: false,
    synthesisAvailable: false,
    canScorePronunciationQuality: false,
    canMatchTranscript: true,
    notes:
      "Authoritative evaluation is normalized phrase/intent match. Browser STT/TTS are optional UX aids. No phoneme, accent, or fluency scoring.",
  };
}

export type NormalizedSpeechResult = {
  transcript: string;
  /** Always null in v1 — honesty boundary. */
  pronunciationQualityScore: null;
  source: "browser_stt" | "typed" | "unavailable";
};
