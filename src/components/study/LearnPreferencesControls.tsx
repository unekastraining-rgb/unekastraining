"use client";

/**
 * Quiet Learn controls: How do you learn best? + Material difficulty.
 * Teaching Style (HOW explanations are phrased) stays in TeachingStyleSelector.
 * Difficulty here is material/task depth — not the same as teaching mode.
 * Visual preference tiles — not a methodology catalog or plain settings form.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { HowILearnPrefVisual } from "@/components/study/HowILearnPrefVisual";
import {
  CONTENT_DIFFICULTY_SESSION_KEY,
  LEARN_PREFERENCE_KEYS,
  LEARN_PREFERENCE_LABELS,
  contentDifficultyLabel,
  parseContentDifficultyChoice,
  type ContentDifficultyChoice,
  type LearnPreferenceKey,
} from "@/lib/learning/learner-preferences";
import { useTheme } from "@/lib/theme/ThemeProvider";

function readSessionDifficulty(): ContentDifficultyChoice | null {
  if (typeof window === "undefined") return null;
  try {
    return parseContentDifficultyChoice(
      window.sessionStorage.getItem(CONTENT_DIFFICULTY_SESSION_KEY),
    );
  } catch {
    return null;
  }
}

function writeSessionDifficulty(level: ContentDifficultyChoice | null) {
  if (typeof window === "undefined") return;
  try {
    if (level == null) {
      window.sessionStorage.removeItem(CONTENT_DIFFICULTY_SESSION_KEY);
    } else {
      window.sessionStorage.setItem(
        CONTENT_DIFFICULTY_SESSION_KEY,
        String(level),
      );
    }
  } catch {
    /* ignore */
  }
}

export function LearnPreferencesControls({
  onPreferencesChange,
  onDifficultyChange,
  embedded = false,
  defaultOpen = false,
}: {
  onPreferencesChange?: (keys: LearnPreferenceKey[]) => void;
  onDifficultyChange?: (level: ContentDifficultyChoice | null) => void;
  /** When true, always show body (parent provides the How I Learn toggle). */
  embedded?: boolean;
  defaultOpen?: boolean;
}) {
  const { settings } = useTheme();
  const gradeSchool = Boolean(settings.elementaryMode);
  const [prefs, setPrefs] = useState<LearnPreferenceKey[]>([]);
  const [difficulty, setDifficulty] = useState<ContentDifficultyChoice | null>(
    () => readSessionDifficulty(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(defaultOpen || embedded);
  const notifiedDifficulty = useRef(false);

  useEffect(() => {
    if (!notifiedDifficulty.current) {
      notifiedDifficulty.current = true;
      onDifficultyChange?.(difficulty);
    }
    void (async () => {
      try {
        const res = await fetch("/api/study/learner-preferences");
        const data = (await res.json()) as {
          success?: boolean;
          preferences?: LearnPreferenceKey[];
        };
        if (data.success && Array.isArray(data.preferences)) {
          setPrefs(data.preferences);
          onPreferencesChange?.(data.preferences);
        }
      } catch {
        /* offline — keep empty */
      } finally {
        setLoading(false);
      }
    })();
    // Mount-only hydrate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistPrefs = useCallback(
    async (next: LearnPreferenceKey[]) => {
      setPrefs(next);
      onPreferencesChange?.(next);
      setSaving(true);
      try {
        await fetch("/api/study/learner-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: next }),
        });
      } catch {
        /* keep local */
      } finally {
        setSaving(false);
      }
    },
    [onPreferencesChange],
  );

  function togglePref(key: LearnPreferenceKey) {
    let next: LearnPreferenceKey[];
    if (key === "not_sure") {
      next = prefs.includes("not_sure") ? [] : ["not_sure"];
    } else {
      const without = prefs.filter((k) => k !== "not_sure" && k !== key);
      next = prefs.includes(key) ? without : [...without, key];
    }
    void persistPrefs(next);
  }

  function setDifficultyLevel(level: ContentDifficultyChoice | null) {
    writeSessionDifficulty(level);
    setDifficulty(level);
    onDifficultyChange?.(level);
  }

  const body = (
    <div
      className={
        embedded
          ? "space-y-5"
          : "space-y-5 border-t border-stone-200 px-3 py-3"
      }
    >
      <div data-learn-how-you-learn-best>
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            gradeSchool ? "text-teal-800" : "text-stone-500"
          }`}
        >
          How do you learn best?
        </p>
        <p className="mt-1 text-xs text-stone-600">
          {gradeSchool
            ? "Tap the ones that feel right. Study Haul will use them when it teaches you."
            : "Pick what fits. Study Haul adapts teaching — these are preferences, not separate study products."}
        </p>
        <div
          data-how-i-learn-visual-grid
          className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {LEARN_PREFERENCE_KEYS.map((key) => {
            const selected = prefs.includes(key);
            return (
              <button
                key={key}
                type="button"
                disabled={loading || saving}
                onClick={() => togglePref(key)}
                aria-pressed={selected}
                className={`flex min-h-[5.5rem] flex-col items-start gap-2 rounded-2xl border px-2.5 py-2.5 text-left touch-manipulation transition ${
                  selected
                    ? gradeSchool
                      ? "border-teal-600 bg-teal-50 shadow-sm ring-2 ring-teal-300"
                      : "border-stone-800 bg-stone-900 text-white shadow-sm"
                    : gradeSchool
                      ? "border-teal-200 bg-gradient-to-b from-teal-50 to-amber-50/40 hover:border-teal-400"
                      : "border-stone-200 bg-gradient-to-b from-stone-50 to-white hover:border-stone-400"
                }`}
              >
                <HowILearnPrefVisual pref={key} gradeSchool={gradeSchool} />
                <span
                  className={`text-[11px] font-semibold leading-snug ${
                    selected && !gradeSchool ? "text-stone-100" : "text-stone-800"
                  }`}
                >
                  {LEARN_PREFERENCE_LABELS[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div data-learn-material-difficulty>
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            gradeSchool ? "text-teal-800" : "text-stone-500"
          }`}
        >
          Material difficulty
        </p>
        <p className="mt-1 text-xs text-stone-600">
          How advanced the tasks should be — separate from explanation style.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setDifficultyLevel(null)}
            className={`inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold touch-manipulation ${
              difficulty == null
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-700 ring-1 ring-stone-200"
            }`}
          >
            Adaptive
          </button>
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficultyLevel(level)}
              className={`inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold touch-manipulation ${
                difficulty === level
                  ? "bg-stone-800 text-white"
                  : "bg-white text-stone-700 ring-1 ring-stone-200"
              }`}
            >
              {contentDifficultyLabel(level)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      data-learn-preferences
      data-learn-change-how
      className={
        embedded
          ? "space-y-4"
          : "rounded-xl border border-stone-200 bg-stone-50/80"
      }
    >
      {!embedded ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-stone-800 touch-manipulation"
          aria-expanded={open}
        >
          <span>Change how I learn</span>
          <span className="text-xs font-medium text-stone-500">
            {open ? "Hide" : "Show"}
          </span>
        </button>
      ) : null}
      {open || embedded ? body : null}
    </div>
  );
}
