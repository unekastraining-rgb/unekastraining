"use client";

import { useMemo, useState } from "react";

export type CodingTestCaseView = {
  id: string;
  args: unknown[];
  expected: unknown;
};

export type CodingChallengeView = {
  id: string;
  title: string;
  prompt: string;
  language?: string;
  starter?: string;
  objective?: string;
  entryFunction?: string;
  tests?: CodingTestCaseView[];
};

type LocalTryResult = {
  id: string;
  pass: boolean;
  error?: string;
};

function resolveEntryName(
  code: string,
  challenge: CodingChallengeView,
): string | null {
  if (challenge.entryFunction?.trim()) return challenge.entryFunction.trim();
  const fn = code.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (fn?.[1]) return fn[1];
  const arrow = code.match(
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
  );
  if (arrow?.[1]) return arrow[1];
  return null;
}

function runLocalJsTests(
  code: string,
  challenge: CodingChallengeView,
  tests: CodingTestCaseView[],
): LocalTryResult[] {
  const entry = resolveEntryName(code, challenge);
  if (!entry) {
    return tests.map((t) => ({
      id: t.id,
      pass: false,
      error: "Could not find entry function in your code.",
    }));
  }

  return tests.map((test) => {
    try {
      // Client-only structural practice — not server evidence.
      const runner = new Function(
        "args",
        `${code}\n; if (typeof ${entry} !== "function") throw new Error("missing_function:${entry}");\nreturn ${entry}.apply(null, args);`,
      );
      const got = runner(test.args);
      const pass = Object.is(got, test.expected) || got === test.expected;
      return { id: test.id, pass };
    } catch (err) {
      return {
        id: test.id,
        pass: false,
        error: err instanceof Error ? err.message : "runtime_error",
      };
    }
  });
}

/**
 * Coding practice workspace — instructions + editor + optional local JS try.
 * Local try is practice only; submit remains server-authoritative.
 */
export function CodingWorkspacePanel(props: {
  challenge: CodingChallengeView;
  value: string;
  onChange: (code: string) => void;
  onReset: () => void;
}) {
  const { challenge, value, onChange, onReset } = props;
  const language = (challenge.language ?? "javascript").toLowerCase();
  const isJs = language === "javascript" || language === "js";
  const tests = challenge.tests ?? [];
  const [localResults, setLocalResults] = useState<LocalTryResult[] | null>(
    null,
  );

  const languageLabel = useMemo(() => language || "code", [language]);

  return (
    <div
      data-coding-workspace
      className="grid gap-4 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]"
    >
      <aside className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-semibold uppercase tracking-wide text-teal-800">
            {languageLabel}
          </span>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Instructions
          </h2>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {challenge.title}
          </p>
          {challenge.objective ? (
            <p className="mt-2 text-sm text-stone-700">
              Goal: {challenge.objective}
            </p>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
            {challenge.prompt}
          </p>
        </div>
        {!isJs ? (
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
            data-coding-honesty
          >
            Guided coding practice — structural check on submit (this language
            is not executed in the browser).
          </p>
        ) : tests.length === 0 ? (
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
            data-coding-honesty
          >
            No local test cases for this challenge — write your solution, then
            submit for server evaluation.
          </p>
        ) : (
          <p className="text-xs text-stone-500" data-coding-honesty>
            Optional local try is practice feedback only — not a scored result.
            Submit for server evaluation.
          </p>
        )}
      </aside>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-stone-700">
          Your code
          <textarea
            className="mt-1 min-h-[16rem] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm text-stone-900"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setLocalResults(null);
            }}
            spellCheck={false}
            aria-label="Code editor"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onReset();
              setLocalResults(null);
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
          >
            Reset
          </button>
          {isJs && tests.length > 0 ? (
            <button
              type="button"
              onClick={() => setLocalResults(runLocalJsTests(value, challenge, tests))}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-100 touch-manipulation"
            >
              Try tests
            </button>
          ) : null}
        </div>

        {tests.length > 0 ? (
          <div
            className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3"
            data-coding-tests
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Test cases
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-stone-700">
              {tests.map((t) => {
                const local = localResults?.find((r) => r.id === t.id);
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-start gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2"
                  >
                    <span className="font-mono text-xs text-stone-600">
                      {t.id}: args {JSON.stringify(t.args)} → expected{" "}
                      {JSON.stringify(t.expected)}
                    </span>
                    {local ? (
                      <span
                        className={
                          local.pass
                            ? "text-xs font-semibold text-teal-700"
                            : "text-xs font-semibold text-rose-700"
                        }
                      >
                        {local.pass
                          ? "Local pass"
                          : `Local fail${local.error ? `: ${local.error}` : ""}`}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {localResults ? (
              <p className="mt-2 text-xs text-stone-500" data-coding-local-try>
                Local try only — not server evidence. Submit when ready for
                evaluation.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
