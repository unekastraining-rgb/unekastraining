"use client";

import { useState } from "react";

import {
  listTeachingStylePolicies,
  readSessionTeachingStyle,
  writeSessionTeachingStyle,
  type TeachingStyle,
} from "@/lib/learning/tutor/teaching-style";

/**
 * 2P-19/20 — Optional Teaching Style selector (presentation only).
 * Persists to sessionStorage so style can travel across Tutor entry points
 * without resetting chat/concept/intent. Does not write mastery or notes.
 */
export function TeachingStyleSelector({
  value,
  onChange,
  id = "teaching-style",
  className,
  persistSession = true,
}: {
  value: TeachingStyle | "";
  onChange: (next: TeachingStyle | "") => void;
  id?: string;
  className?: string;
  /** When true (default), sync selection to sessionStorage for cross-entry use. */
  persistSession?: boolean;
}) {
  const options = listTeachingStylePolicies();

  return (
    <label
      className={
        className ??
        "block text-xs font-medium text-stone-600"
      }
      htmlFor={id}
    >
      Explanation style
      <select
        id={id}
        className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-800"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          const style = next === "" ? "" : (next as TeachingStyle);
          if (persistSession) writeSessionTeachingStyle(style);
          onChange(style);
        }}
        aria-describedby={`${id}-hint`}
        data-teaching-mode-control
      >
        <option value="">Default (unchanged)</option>
        {options.map((opt) => (
          <option key={opt.style} value={opt.style} title={opt.description}>
            {opt.learnerLabel}
          </option>
        ))}
      </select>
      <span id={`${id}-hint`} className="mt-1 block text-[11px] font-normal text-stone-500">
        {value
          ? options.find((o) => o.style === value)?.description
          : "Teaching mode — how explanations are phrased. Not the same as material difficulty."}
      </span>
    </label>
  );
}

/** Controlled style hydrated from sessionStorage (client). Changing style does not clear chats. */
export function useSessionTeachingStyle(
  initial: TeachingStyle | "" = "",
): [TeachingStyle | "", (next: TeachingStyle | "") => void] {
  const [style, setStyle] = useState<TeachingStyle | "">(() => {
    return readSessionTeachingStyle() ?? initial;
  });
  return [
    style,
    (next) => {
      writeSessionTeachingStyle(next);
      setStyle(next);
    },
  ];
}
