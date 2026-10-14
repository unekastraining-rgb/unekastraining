/**
 * 2P-41 — Provider-independent language activity contract.
 * Speech quality claims must match measurable mechanisms (transcript match ≠ pronunciation).
 */

export type LanguageActivityMode =
  | "SPEAK"
  | "LISTEN"
  | "CONVERSATION"
  | "PRONUNCIATION";

/** How the learner produced the response — never inferred as pronunciation quality. */
export type LanguageResponseChannel = "spoken_transcript" | "typed";

export type LanguageRecordingState =
  | "IDLE"
  | "RECORDING"
  | "PROCESSING"
  | "READY"
  | "UNAVAILABLE"
  | "DENIED";

export type LanguageChallengeScaffold = {
  kind: "HINT" | "STEP" | "EXAMPLE" | "CHECKLIST" | "CONSTRAINT";
  label: string;
  content: string;
  level?: 1 | 2 | 3;
  revealPolicy?: "ON_REQUEST" | "ALWAYS";
  doesNotRevealAnswer?: boolean;
};

export type LanguageListenOption = {
  id: string;
  label: string;
};

export type LanguageChallenge = {
  id: string;
  title: string;
  objective: string;
  prompt: string;
  mode: LanguageActivityMode;
  /** BCP-47-ish codes used for UI / TTS / STT hints — not provider IDs. */
  languageCode: string;
  /** Prompt language for TTS example (may differ from response language). */
  promptLanguageCode?: string;
  /** Exact / approved responses after normalization. */
  expectedResponses: readonly string[];
  /** Optional listening multiple-choice. */
  listenOptions?: readonly LanguageListenOption[];
  /** Correct listen option id when mode is LISTEN. */
  correctListenOptionId?: string;
  /** Text shown for TTS / "hear example" (defaults to first expected or prompt). */
  exampleUtterance?: string;
  /** Conversation tutor line (deterministic, not open AI chat). */
  tutorPrompt?: string;
  /** Conversation intent label (internal). */
  expectedIntent?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  domainTag?: string;
  conceptHints?: readonly string[];
  misconceptionTargets?: readonly string[];
  scaffolds?: readonly LanguageChallengeScaffold[];
  successLooksLike?: string;
  progressionStage?: "PRACTICE" | "APPLY" | "CHALLENGE" | "RETAIN";
  contextVariant?: string;
  contentKey?: string;
  skillFacet?: "RECOGNIZE" | "APPLY" | "SOLVE" | "PERFORM" | "RETAIN";
  /**
   * Honest capability label for UI — never "Perfect pronunciation".
   * PRONUNCIATION mode still evaluates as speech/typed match.
   */
  matchLabel?: string;
};

/** Client working payload — never authoritative evidence by itself. */
export type LanguageWorkspaceSubmission = {
  transcript?: string;
  typedResponse?: string;
  selectedOptionId?: string;
  responseChannel?: LanguageResponseChannel;
  /** Capability snapshot — informational; never alone creates SUCCESS. */
  speechCapability?: {
    recognitionAvailable?: boolean;
    synthesisAvailable?: boolean;
    microphoneDenied?: boolean;
  };
  recordingState?: LanguageRecordingState;
};
