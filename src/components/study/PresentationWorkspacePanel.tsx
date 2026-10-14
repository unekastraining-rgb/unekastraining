"use client";

import { useCallback, useEffect, useState } from "react";

export type PresentationChallengeView = {
  id: string;
  title: string;
  prompt: string;
  objective?: string;
  starter?: string;
};

type SlideSection = {
  id: string;
  title: string;
  talkingPoints: string;
  speakerNotes: string;
};

type PresentationState = {
  goal: string;
  audience: string;
  slides: SlideSection[];
};

function newSlide(n: number): SlideSection {
  return {
    id: `slide-${n}-${Date.now()}`,
    title: `Section ${n}`,
    talkingPoints: "",
    speakerNotes: "",
  };
}

function serializePresentation(state: PresentationState): string {
  const hasContent =
    state.goal.trim() ||
    state.audience.trim() ||
    state.slides.some(
      (s) =>
        s.talkingPoints.trim() ||
        s.speakerNotes.trim() ||
        (s.title.trim() && !/^Section\s+\d+$/i.test(s.title.trim())),
    );
  if (!hasContent) return "";

  const lines: string[] = [];
  if (state.goal.trim()) lines.push(`## Goal\n${state.goal.trim()}`);
  if (state.audience.trim()) {
    lines.push(`## Audience\n${state.audience.trim()}`);
  }
  const slideLines: string[] = [];
  state.slides.forEach((s, i) => {
    if (
      !s.talkingPoints.trim() &&
      !s.speakerNotes.trim() &&
      (!s.title.trim() || /^Section\s+\d+$/i.test(s.title.trim()))
    ) {
      return;
    }
    slideLines.push(
      `### ${i + 1}. ${s.title.trim() || `Section ${i + 1}`}`,
      `Talking points:\n${s.talkingPoints.trim()}`,
      `Speaker notes:\n${s.speakerNotes.trim()}`,
    );
  });
  if (slideLines.length > 0) {
    lines.push("## Outline", ...slideLines);
  }
  return lines.join("\n\n").trim();
}

function parsePresentation(value: string): PresentationState {
  const fallback: PresentationState = {
    goal: "",
    audience: "",
    slides: [newSlide(1)],
  };
  if (!value.trim()) return fallback;

  const goalMatch = value.match(
    /##\s*Goal\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  );
  const audienceMatch = value.match(
    /##\s*Audience\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  );
  const slideBlocks = [
    ...value.matchAll(
      /###\s*\d+\.\s*(.+)\nTalking points:\n([\s\S]*?)\nSpeaker notes:\n([\s\S]*?)(?=\n###\s|\n##\s|$)/gi,
    ),
  ];

  const slides =
    slideBlocks.length > 0
      ? slideBlocks.map((m, i) => ({
          id: `slide-parsed-${i}`,
          title: (m[1] ?? `Section ${i + 1}`).trim(),
          talkingPoints: (m[2] ?? "").trim(),
          speakerNotes: (m[3] ?? "").trim(),
        }))
      : fallback.slides;

  if (goalMatch || audienceMatch || slideBlocks.length > 0) {
    return {
      goal: (goalMatch?.[1] ?? "").trim(),
      audience: (audienceMatch?.[1] ?? "").trim(),
      slides,
    };
  }

  return { ...fallback, goal: value };
}

/**
 * Presentation builder — guided draft (not PowerPoint).
 */
export function PresentationWorkspacePanel(props: {
  challenge: PresentationChallengeView;
  value: string;
  onChange: (artifact: string) => void;
  onReset?: () => void;
}) {
  const { challenge, value, onChange, onReset } = props;
  const [state, setState] = useState<PresentationState>(() =>
    parsePresentation(value),
  );

  const publish = useCallback(
    (next: PresentationState) => {
      onChange(serializePresentation(next));
    },
    [onChange],
  );

  useEffect(() => {
    publish(state);
  }, [state, publish]);

  return (
    <div data-presentation-workspace className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
        <p className="text-sm font-medium text-stone-900">{challenge.title}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
          {challenge.prompt}
        </p>
        <p
          className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
          data-presentation-honesty
        >
          Presentation builder — guided draft
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          Goal
          <textarea
            className="mt-1 min-h-[6rem] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            value={state.goal}
            onChange={(e) =>
              setState((prev) => ({ ...prev, goal: e.target.value }))
            }
            spellCheck
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Audience
          <textarea
            className="mt-1 min-h-[6rem] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            value={state.audience}
            onChange={(e) =>
              setState((prev) => ({ ...prev, audience: e.target.value }))
            }
            spellCheck
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-stone-800">
            Outline / slides
          </h2>
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                slides: [...prev.slides, newSlide(prev.slides.length + 1)],
              }))
            }
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-100 touch-manipulation"
          >
            Add section
          </button>
        </div>

        {state.slides.map((slide, index) => (
          <div
            key={slide.id}
            className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex-1 text-sm font-medium text-stone-700">
                Section title
                <input
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                  value={slide.title}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      slides: prev.slides.map((s) =>
                        s.id === slide.id
                          ? { ...s, title: e.target.value }
                          : s,
                      ),
                    }))
                  }
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {index > 0 ? (
                  <button
                    type="button"
                    aria-label={`Move section ${index + 1} up`}
                    onClick={() =>
                      setState((prev) => {
                        const slides = [...prev.slides];
                        const tmp = slides[index - 1]!;
                        slides[index - 1] = slides[index]!;
                        slides[index] = tmp;
                        return { ...prev, slides };
                      })
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation"
                  >
                    ↑
                  </button>
                ) : null}
                {index < state.slides.length - 1 ? (
                  <button
                    type="button"
                    aria-label={`Move section ${index + 1} down`}
                    onClick={() =>
                      setState((prev) => {
                        const slides = [...prev.slides];
                        const tmp = slides[index + 1]!;
                        slides[index + 1] = slides[index]!;
                        slides[index] = tmp;
                        return { ...prev, slides };
                      })
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation"
                  >
                    ↓
                  </button>
                ) : null}
                {state.slides.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        slides: prev.slides.filter((s) => s.id !== slide.id),
                      }))
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
            <p className="text-xs text-stone-500">Slide {index + 1}</p>
            <label className="block text-sm font-medium text-stone-700">
              Talking points
              <textarea
                className="mt-1 min-h-[5rem] w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                value={slide.talkingPoints}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    slides: prev.slides.map((s) =>
                      s.id === slide.id
                        ? { ...s, talkingPoints: e.target.value }
                        : s,
                    ),
                  }))
                }
                spellCheck
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Speaker notes
              <textarea
                className="mt-1 min-h-[5rem] w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                value={slide.speakerNotes}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    slides: prev.slides.map((s) =>
                      s.id === slide.id
                        ? { ...s, speakerNotes: e.target.value }
                        : s,
                    ),
                  }))
                }
                spellCheck
              />
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          const next = {
            goal: "",
            audience: "",
            slides: [newSlide(1)],
          };
          setState(next);
          onReset?.();
          onChange(serializePresentation(next));
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
      >
        Reset
      </button>
    </div>
  );
}
