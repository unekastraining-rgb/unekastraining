"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTapHandler } from "@/hooks/useTapHandler";

type LanguageChallengeView = {
  id: string;
  title: string;
  prompt: string;
  mode?: string;
  languageCode?: string;
  promptLanguageCode?: string;
  exampleUtterance?: string;
  tutorPrompt?: string;
  listenOptions?: readonly { id: string; label: string }[];
  matchLabel?: string;
  scaffolds?: Array<{
    kind: string;
    label: string;
    content: string;
  }>;
};

type SpeechUiCapability = {
  recognitionAvailable: boolean;
  synthesisAvailable: boolean;
};

function probeSpeechCapability(): SpeechUiCapability {
  if (typeof window === "undefined") {
    return { recognitionAvailable: false, synthesisAvailable: false };
  }
  const win = window as Window & {
    webkitSpeechRecognition?: unknown;
    SpeechRecognition?: unknown;
  };
  return {
    recognitionAvailable: Boolean(
      win.webkitSpeechRecognition || win.SpeechRecognition,
    ),
    synthesisAvailable: Boolean(window.speechSynthesis),
  };
}

/**
 * Language speaking/listening workspace.
 * Play / record / transcript preview never create evidence — parent submit does.
 * Evaluation is speech/typed match — not pronunciation quality.
 */
export function LanguageWorkspacePanel(props: {
  challenge: LanguageChallengeView;
  onArtifactChange: (payload: string) => void;
}) {
  const { challenge, onArtifactChange } = props;
  const capability = useMemo(() => probeSpeechCapability(), []);
  const [transcript, setTranscript] = useState("");
  const [typedResponse, setTypedResponse] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [recordingState, setRecordingState] = useState<
    "IDLE" | "RECORDING" | "READY" | "UNAVAILABLE" | "DENIED"
  >(capability.recognitionAvailable ? "IDLE" : "UNAVAILABLE");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const mode = challenge.mode ?? "SPEAK";
  const isListen = mode === "LISTEN";
  const matchLabel = challenge.matchLabel ?? "Speech match";
  const lang =
    challenge.promptLanguageCode ?? challenge.languageCode ?? "en";

  const publish = useCallback(
    (next: {
      transcript: string;
      typedResponse: string;
      selectedOptionId: string;
      recordingState: string;
    }) => {
      const channel = next.transcript.trim()
        ? "spoken_transcript"
        : next.typedResponse.trim() || next.selectedOptionId
          ? "typed"
          : undefined;
      onArtifactChange(
        JSON.stringify({
          transcript: next.transcript,
          typedResponse: next.typedResponse,
          selectedOptionId: next.selectedOptionId || undefined,
          responseChannel: channel,
          recordingState: next.recordingState,
          speechCapability: {
            recognitionAvailable: capability.recognitionAvailable,
            synthesisAvailable: capability.synthesisAvailable,
            microphoneDenied: next.recordingState === "DENIED",
          },
        }),
      );
    },
    [onArtifactChange, capability],
  );

  useEffect(() => {
    publish({
      transcript,
      typedResponse,
      selectedOptionId,
      recordingState,
    });
  }, [transcript, typedResponse, selectedOptionId, recordingState, publish]);

  const playExample = useTapHandler(() => {
    const text =
      challenge.exampleUtterance ??
      challenge.tutorPrompt ??
      challenge.prompt;
    if (!capability.synthesisAvailable) {
      setStatusMessage(
        "Browser speech playback is unavailable. Read the example text instead.",
      );
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "es" ? "es-ES" : "en-US";
      window.speechSynthesis.speak(utter);
      setStatusMessage("Playing example (browser text-to-speech).");
    } catch {
      setStatusMessage("Could not play example speech.");
    }
  });

  const startListening = useTapHandler(() => {
    setRecognitionError(null);
    const win = window as Window & {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) {
      setRecordingState("UNAVAILABLE");
      setStatusMessage(
        "Speech recognition unavailable — use the typed response field.",
      );
      return;
    }
    try {
      const recognition = new Ctor();
      recognition.lang = lang === "es" ? "es-ES" : "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setRecordingState("RECORDING");
      recognition.onerror = (event: { error?: string }) => {
        if (event.error === "not-allowed") {
          setRecordingState("DENIED");
          setStatusMessage(
            "Microphone permission denied — type your response instead.",
          );
        } else {
          setRecordingState("IDLE");
          setRecognitionError(event.error ?? "recognition_error");
          setStatusMessage(
            "Speech recognition failed — type your response instead.",
          );
        }
      };
      recognition.onresult = (event: {
        results: ArrayLike<{ 0: { transcript: string } }>;
      }) => {
        const text = event.results[0]?.[0]?.transcript ?? "";
        setTranscript(text);
        setRecordingState("READY");
        setStatusMessage(
          `Transcript ready (${matchLabel} — not pronunciation scoring).`,
        );
      };
      recognition.onend = () => {
        setRecordingState((prev) =>
          prev === "RECORDING" ? "IDLE" : prev,
        );
      };
      recognition.start();
    } catch {
      setRecordingState("UNAVAILABLE");
      setStatusMessage(
        "Could not start speech recognition — use typed response.",
      );
    }
  });

  const stopListening = useTapHandler(() => {
    setRecordingState((prev) => (prev === "RECORDING" ? "IDLE" : prev));
    setStatusMessage("Recording stopped.");
  });

  const showHint = useTapHandler(() => setHintVisible(true));

  const recordingLabel =
    recordingState === "RECORDING"
      ? "Recording"
      : recordingState === "READY"
        ? "Transcript ready"
        : recordingState === "DENIED"
          ? "Microphone denied"
          : recordingState === "UNAVAILABLE"
            ? "Speech recognition unavailable"
            : "Ready";

  return (
    <div
      className="space-y-4"
      data-language-workspace
      data-language-mode={mode}
      aria-label="Language workspace"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
        {mode === "LISTEN"
          ? "Listening"
          : mode === "CONVERSATION"
            ? "Conversation"
            : mode === "PRONUNCIATION"
              ? "Speech match practice"
              : "Speaking"}{" "}
        · {challenge.languageCode ?? "en"} · evaluated as {matchLabel}
      </p>

      {challenge.tutorPrompt ? (
        <div
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800"
          data-language-tutor-line
        >
          <span className="font-semibold">Prompt: </span>
          {challenge.tutorPrompt}
        </div>
      ) : null}

      <p className="text-sm text-stone-700">{challenge.prompt}</p>

      {challenge.exampleUtterance ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            {...playExample}
            aria-label="Hear example"
          >
            Hear example
          </button>
          <p className="sr-only">
            Example text: {challenge.exampleUtterance}
          </p>
        </div>
      ) : null}

      {isListen && challenge.listenOptions ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-800">
            Choose what you heard
          </legend>
          {challenge.listenOptions.map((opt) => (
            <label
              key={opt.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 touch-manipulation focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-700"
            >
              <input
                type="radio"
                name={`lang-listen-${challenge.id}`}
                value={opt.id}
                checked={selectedOptionId === opt.id}
                onChange={() => setSelectedOptionId(opt.id)}
                className="h-4 w-4"
              />
              {opt.label}
            </label>
          ))}
        </fieldset>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50"
              {...startListening}
              disabled={
                recordingState === "RECORDING" ||
                recordingState === "UNAVAILABLE"
              }
              aria-pressed={recordingState === "RECORDING"}
              aria-label="Start speaking"
            >
              Start speaking
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              {...stopListening}
              disabled={recordingState !== "RECORDING"}
              aria-label="Stop speaking"
            >
              Stop
            </button>
          </div>

          <p
            className="text-sm text-stone-700"
            aria-live="polite"
            data-recording-state={recordingState}
          >
            Recording status:{" "}
            <span className="font-semibold">{recordingLabel}</span>
            {recordingState === "RECORDING" ? " (active)" : ""}
          </p>

          <label className="block text-sm font-medium text-stone-700">
            Transcript (speech recognition preview)
            <textarea
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm"
              rows={2}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              aria-label="Speech transcript"
            />
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Typed practice (fallback — always available)
            <textarea
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm"
              rows={2}
              value={typedResponse}
              onChange={(e) => setTypedResponse(e.target.value)}
              aria-label="Typed language response"
              placeholder="Type the expected response if speech is unavailable"
            />
          </label>
        </>
      )}

      <p className="text-xs text-stone-500">
        Honest evaluation: {matchLabel}. This is not phoneme-level pronunciation
        scoring. Typed and spoken submissions both create evidence only when you
        submit.
      </p>

      {statusMessage ? (
        <p className="text-sm text-stone-700" aria-live="polite" role="status">
          {statusMessage}
        </p>
      ) : null}
      {recognitionError ? (
        <p className="text-sm text-amber-900" role="status">
          Recognition note: {recognitionError}
        </p>
      ) : null}

      {challenge.scaffolds && challenge.scaffolds.length > 0 ? (
        <div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            {...showHint}
            aria-expanded={hintVisible}
          >
            Show hint
          </button>
          {hintVisible ? (
            <p className="mt-2 text-sm text-stone-700" data-language-hint>
              {challenge.scaffolds[0]?.content}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Minimal Web Speech types for optional browser STT. */
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: {
    results: ArrayLike<{ 0: { transcript: string } }>;
  }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
