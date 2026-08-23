"use client";

import { useState } from "react";
import { CheckCircle2, Lightbulb, Loader2 } from "lucide-react";

import { readJsonResponse } from "@/lib/api-json";
import type { LessonWidget } from "@/lib/grade-school/subjects";

interface ThinkingFeedback {
  summary: string;
  encouragement: string;
  onTrack: boolean;
  hint?: string | null;
}

export function SubjectInteractive({
  widget,
  gradeLevel,
  subject,
  onAnswer,
}: {
  widget: LessonWidget;
  gradeLevel?: string | null;
  subject?: string | null;
  onAnswer?: (correct: boolean) => void;
}) {
  switch (widget.type) {
    case "reading":
      return (
        <ReadingWidget
          widget={widget}
          gradeLevel={gradeLevel}
          subject={subject}
          onAnswer={onAnswer}
        />
      );
    case "math":
      return <MathWidget widget={widget} onAnswer={onAnswer} />;
    case "science":
      return <ScienceWidget widget={widget} onAnswer={onAnswer} />;
    case "writing":
      return (
        <WritingWidget
          widget={widget}
          gradeLevel={gradeLevel}
          subject={subject}
        />
      );
    case "reflect":
      return <ReflectWidget widget={widget} />;
    default:
      return null;
  }
}

function ThinkingFeedbackCard({
  feedback,
  onTrack,
}: {
  feedback: ThinkingFeedback;
  onTrack: boolean;
}) {
  return (
    <div
      className={`space-y-2 rounded-xl px-4 py-3 text-sm ${
        onTrack ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
      }`}
    >
      <p className="flex items-center gap-2 font-semibold">
        {onTrack ? <CheckCircle2 className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
        {feedback.encouragement}
      </p>
      <p>{feedback.summary}</p>
      {feedback.hint ? (
        <p className="text-xs opacity-90">
          <span className="font-semibold">Try this:</span> {feedback.hint}
        </p>
      ) : null}
    </div>
  );
}

async function checkThinkingRequest(body: Record<string, unknown>) {
  const response = await fetch("/api/study/grade-school/check-thinking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await readJsonResponse<{
    success: boolean;
    feedback?: ThinkingFeedback;
    error?: string;
  }>(response);

  if (!response.ok || !data.success || !data.feedback) {
    throw new Error(data.error ?? "Could not check your thinking.");
  }

  return data.feedback;
}

function ReadingWidget({
  widget,
  gradeLevel,
  subject,
  onAnswer,
}: {
  widget: Extract<LessonWidget, { type: "reading" }>;
  gradeLevel?: string | null;
  subject?: string | null;
  onAnswer?: (correct: boolean) => void;
}) {
  const [response, setResponse] = useState("");
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<ThinkingFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    const answer = response.trim();
    if (!answer || checking) return;

    setChecking(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await checkThinkingRequest({
        mode: "reading",
        passage: widget.passage,
        question: widget.question,
        userAnswer: answer,
        gradeLevel,
        subject,
      });
      setFeedback(result);
      onAnswer?.(result.onTrack);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check your thinking.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Reading practice</p>
      <p className="rounded-xl bg-white px-4 py-3 text-sm leading-relaxed text-stone-800">
        {widget.highlightPhrase && widget.passage.includes(widget.highlightPhrase) ? (
          <>
            {widget.passage.split(widget.highlightPhrase)[0]}
            <mark className="rounded bg-yellow-200 px-1">{widget.highlightPhrase}</mark>
            {widget.passage.split(widget.highlightPhrase).slice(1).join(widget.highlightPhrase)}
          </>
        ) : (
          widget.passage
        )}
      </p>
      <label className="block text-sm font-semibold text-stone-700">{widget.question}</label>
      <textarea
        value={response}
        onChange={(e) => {
          setResponse(e.target.value);
          setFeedback(null);
          setError(null);
        }}
        rows={3}
        className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm"
        placeholder="Type your answer…"
      />
      <button
        type="button"
        disabled={!response.trim() || checking}
        onClick={() => void handleCheck()}
        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {checking ? "Checking…" : "Check my thinking"}
      </button>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {feedback ? <ThinkingFeedbackCard feedback={feedback} onTrack={feedback.onTrack} /> : null}
    </div>
  );
}

function MathWidget({
  widget,
  onAnswer,
}: {
  widget: Extract<LessonWidget, { type: "math" }>;
  onAnswer?: (correct: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const normalized = (s: string) => s.replace(/\s/g, "").toLowerCase();
  const correct = normalized(value) === normalized(widget.answer);

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Math practice</p>
      <p className="text-lg font-bold text-stone-900">{widget.problem}</p>
      {widget.steps?.length ? (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-600">
          {widget.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setChecked(false);
          }}
          className="w-32 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold"
          placeholder="?"
        />
        {widget.unit ? <span className="text-sm text-stone-600">{widget.unit}</span> : null}
      </div>
      <button
        type="button"
        disabled={!value.trim()}
        onClick={() => {
          setChecked(true);
          onAnswer?.(correct);
        }}
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        Check answer
      </button>
      {checked ? (
        <p
          className={`flex items-center gap-2 text-sm font-semibold ${correct ? "text-emerald-700" : "text-amber-700"}`}
        >
          {correct ? <CheckCircle2 className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
          {correct ? "Great job!" : `Not quite — the answer is ${widget.answer}`}
        </p>
      ) : null}
    </div>
  );
}

function ScienceWidget({
  widget,
  onAnswer,
}: {
  widget: Extract<LessonWidget, { type: "science" }>;
  onAnswer?: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Science explore</p>
      <p className="text-sm text-stone-700">{widget.scenario}</p>
      <p className="font-semibold text-stone-900">{widget.question}</p>
      <div className="grid gap-2">
        {widget.choices.map((choice, index) => (
          <button
            key={choice}
            type="button"
            onClick={() => {
              setSelected(index);
              onAnswer?.(index === widget.correctIndex);
            }}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              selected === index
                ? index === widget.correctIndex
                  ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                  : "border-amber-300 bg-amber-50 text-amber-900"
                : "border-emerald-100 bg-white hover:border-emerald-200"
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
      {selected !== null && widget.explanation ? (
        <p className="text-sm text-stone-600">{widget.explanation}</p>
      ) : null}
    </div>
  );
}

function WritingWidget({
  widget,
  gradeLevel,
  subject,
}: {
  widget: Extract<LessonWidget, { type: "writing" }>;
  gradeLevel?: string | null;
  subject?: string | null;
}) {
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<ThinkingFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    const answer = text.trim();
    if (!answer || checking) return;

    setChecking(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await checkThinkingRequest({
        mode: "writing",
        question: widget.prompt,
        userAnswer: answer,
        gradeLevel,
        subject,
        sampleAnswer: widget.sampleAnswer,
      });
      setFeedback(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check your writing.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-orange-200 bg-orange-50/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Writing practice</p>
      <p className="font-semibold text-stone-900">{widget.prompt}</p>
      {widget.wordBank?.length ? (
        <div className="flex flex-wrap gap-2">
          {widget.wordBank.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => setText((t) => (t ? `${t} ${word}` : word))}
              className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-800"
            >
              {word}
            </button>
          ))}
        </div>
      ) : null}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setFeedback(null);
          setError(null);
        }}
        rows={4}
        className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={!text.trim() || checking}
        onClick={() => void handleCheck()}
        className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {checking ? "Checking…" : "Check my writing"}
      </button>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {feedback ? <ThinkingFeedbackCard feedback={feedback} onTrack={feedback.onTrack} /> : null}
    </div>
  );
}

function ReflectWidget({
  widget,
}: {
  widget: Extract<LessonWidget, { type: "reflect" }>;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Think about it</p>
      <p className="mt-2 font-semibold text-stone-900">{widget.prompt}</p>
    </div>
  );
}
