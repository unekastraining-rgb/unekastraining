"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const ALL_STAGES = [
  "Question",
  "Setup",
  "Explore",
  "Observe",
  "Record",
  "Explain",
  "Conclude",
] as const;

type LabStage = (typeof ALL_STAGES)[number];

export type LabChallengeView = {
  id: string;
  title: string;
  prompt: string;
  objective?: string;
  starter?: string;
};

function stagesForPrompt(prompt: string, objective?: string): LabStage[] {
  const text = `${prompt} ${objective ?? ""}`.toLowerCase();
  const picked: LabStage[] = [];

  const want = (stage: LabStage, needles: string[]) => {
    if (needles.some((n) => text.includes(n))) picked.push(stage);
  };

  want("Question", ["question", "hypothesis", "ask"]);
  want("Setup", ["configure", "connect", "setup", "set up", "prepare"]);
  want("Explore", ["explore", "investigate", "experiment"]);
  want("Observe", ["observe", "observation", "measure", "test", "ping"]);
  want("Record", ["record", "document", "log"]);
  want("Explain", ["explain", "because", "interpret", "why", "density", "diagnose"]);
  want("Conclude", ["conclude", "conclusion", "therefore", "result", "troubleshoot"]);

  if (picked.length === 0) {
    return ["Question", "Setup", "Observe", "Record", "Explain", "Conclude"];
  }

  // Keep canonical order, unique.
  return ALL_STAGES.filter((s) => picked.includes(s));
}

function serializeLab(
  stages: LabStage[],
  notes: Record<string, string>,
  asMarkdown: boolean,
): string {
  if (asMarkdown) {
    return stages
      .map((s) => {
        const body = (notes[s] ?? "").trim();
        return body ? `## ${s}\n${body}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  const artifact: Record<string, string> = {};
  for (const s of stages) {
    const v = (notes[s] ?? "").trim();
    if (v) artifact[s.toLowerCase()] = v;
  }
  if (Object.keys(artifact).length === 0) return "";
  return JSON.stringify({ kind: "lab", stages: artifact });
}

function parseInitial(
  value: string,
  stages: LabStage[],
): Record<string, string> {
  const empty = Object.fromEntries(stages.map((s) => [s, ""])) as Record<
    string,
    string
  >;
  if (!value.trim()) return empty;
  try {
    const parsed = JSON.parse(value) as {
      stages?: Record<string, string>;
    };
    if (parsed?.stages && typeof parsed.stages === "object") {
      for (const s of stages) {
        const key = s.toLowerCase();
        if (typeof parsed.stages[key] === "string") {
          empty[s] = parsed.stages[key];
        } else if (typeof parsed.stages[s] === "string") {
          empty[s] = parsed.stages[s];
        }
      }
      return empty;
    }
  } catch {
    // markdown / plain fallback
  }
  for (const s of stages) {
    const re = new RegExp(`##\\s*${s}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
    const m = value.match(re);
    if (m?.[1]) empty[s] = m[1].trim();
  }
  if (stages.every((s) => !empty[s]) && value.trim()) {
    empty[stages[0] ?? "Question"] = value;
  }
  return empty;
}

/**
 * Guided lab workflow — staged notes combined into one submit artifact.
 */
export function LabWorkspacePanel(props: {
  challenge: LabChallengeView;
  value: string;
  onChange: (artifact: string) => void;
  onReset?: () => void;
}) {
  const { challenge, value, onChange, onReset } = props;
  const stages = useMemo(
    () => stagesForPrompt(challenge.prompt, challenge.objective),
    [challenge.prompt, challenge.objective],
  );
  const [active, setActive] = useState<LabStage>(stages[0] ?? "Question");
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    parseInitial(value, stages),
  );
  const [format, setFormat] = useState<"json" | "markdown">("markdown");

  useEffect(() => {
    if (!stages.includes(active)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setActive(stages[0] ?? "Question");
    }
  }, [stages, active]);

  const publish = useCallback(
    (next: Record<string, string>, fmt: "json" | "markdown") => {
      onChange(serializeLab(stages, next, fmt === "markdown"));
    },
    [onChange, stages],
  );

  useEffect(() => {
    publish(notes, format);
  }, [notes, format, publish]);

  return (
    <div data-lab-workspace className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
        <p className="text-sm font-medium text-stone-900">{challenge.title}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
          {challenge.prompt}
        </p>
        <p className="mt-2 text-xs text-stone-500">Guided lab — work by stage</p>
      </div>

      <div
        role="tablist"
        aria-label="Lab stages"
        className="flex flex-wrap gap-2"
      >
        {stages.map((s) => (
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
            {(notes[s] ?? "").trim() ? " ✓" : ""}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-stone-700">
        {active}
        <textarea
          className="mt-1 min-h-[12rem] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
          value={notes[active] ?? ""}
          onChange={(e) =>
            setNotes((prev) => ({ ...prev, [active]: e.target.value }))
          }
          spellCheck
          aria-label={`${active} notes`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const empty = Object.fromEntries(stages.map((s) => [s, ""])) as Record<
              string,
              string
            >;
            setNotes(empty);
            onReset?.();
            onChange(serializeLab(stages, empty, format === "markdown"));
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
        >
          Reset
        </button>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-stone-600">
          Artifact
          <select
            className="rounded-xl border border-stone-200 bg-white px-3 py-2"
            value={format}
            onChange={(e) =>
              setFormat(e.target.value === "json" ? "json" : "markdown")
            }
          >
            <option value="markdown">Markdown sections</option>
            <option value="json">JSON</option>
          </select>
        </label>
      </div>
    </div>
  );
}
