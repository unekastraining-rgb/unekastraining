"use client";

import { useCallback, useEffect, useState } from "react";

const SECTIONS = ["Brief", "Plan", "Work", "Evidence", "Review"] as const;
type ProjectSection = (typeof SECTIONS)[number];

export type ProjectChallengeView = {
  id: string;
  title: string;
  prompt: string;
  objective?: string;
  starter?: string;
};

type ProjectFields = Record<ProjectSection, string>;

function emptyFields(): ProjectFields {
  return {
    Brief: "",
    Plan: "",
    Work: "",
    Evidence: "",
    Review: "",
  };
}

function serializeProject(fields: ProjectFields): string {
  return SECTIONS.map((s) => {
    const body = fields[s].trim();
    return body ? `## ${s}\n${body}` : "";
  })
    .filter(Boolean)
    .join("\n\n");
}

function parseProject(value: string): ProjectFields {
  const fields = emptyFields();
  if (!value.trim()) return fields;
  try {
    const parsed = JSON.parse(value) as Partial<Record<string, string>>;
    if (parsed && typeof parsed === "object") {
      for (const s of SECTIONS) {
        const key = s.toLowerCase();
        if (typeof parsed[s] === "string") fields[s] = parsed[s];
        else if (typeof parsed[key] === "string") fields[s] = parsed[key]!;
      }
      if (SECTIONS.some((s) => fields[s].trim())) return fields;
    }
  } catch {
    // markdown
  }
  for (const s of SECTIONS) {
    const re = new RegExp(`##\\s*${s}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
    const m = value.match(re);
    if (m?.[1]) fields[s] = m[1].trim();
  }
  if (SECTIONS.every((s) => !fields[s].trim()) && value.trim()) {
    fields.Brief = value;
  }
  return fields;
}

/**
 * Project workspace — structured sections that serialize for existing submit.
 */
export function ProjectWorkspacePanel(props: {
  challenge: ProjectChallengeView;
  value: string;
  onChange: (artifact: string) => void;
  onReset?: () => void;
}) {
  const { challenge, value, onChange, onReset } = props;
  const [active, setActive] = useState<ProjectSection>("Brief");
  const [fields, setFields] = useState<ProjectFields>(() => parseProject(value));

  const publish = useCallback(
    (next: ProjectFields) => {
      onChange(serializeProject(next));
    },
    [onChange],
  );

  useEffect(() => {
    publish(fields);
  }, [fields, publish]);

  return (
    <div data-project-workspace className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
        <p className="text-sm font-medium text-stone-900">{challenge.title}</p>
        {challenge.objective ? (
          <p className="mt-1 text-sm text-stone-700">
            Goal: {challenge.objective}
          </p>
        ) : null}
        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
          {challenge.prompt}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Project sections"
        className="flex flex-wrap gap-2"
      >
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={active === s}
            onClick={() => setActive(s)}
            className={
              active === s
                ? "inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white touch-manipulation"
                : "inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
            }
          >
            {s}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-stone-700">
        {active}
        <textarea
          className="mt-1 min-h-[12rem] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
          value={fields[active]}
          onChange={(e) =>
            setFields((prev) => ({ ...prev, [active]: e.target.value }))
          }
          spellCheck
          aria-label={`${active} section`}
          placeholder={
            active === "Brief"
              ? "Objective, audience, constraints…"
              : active === "Plan"
                ? "Milestones, phases, success criteria…"
                : active === "Work"
                  ? "What you built or did…"
                  : active === "Evidence"
                    ? "Artifacts, examples, data…"
                    : "Reflection and next steps…"
          }
        />
      </label>

      <button
        type="button"
        onClick={() => {
          const empty = emptyFields();
          setFields(empty);
          onReset?.();
          onChange(serializeProject(empty));
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
      >
        Reset
      </button>
    </div>
  );
}
