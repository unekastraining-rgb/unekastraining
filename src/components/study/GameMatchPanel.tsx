"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type MatchPair = {
  term: string;
  definition: string;
};

export type GameChallengeView = {
  id: string;
  title: string;
  prompt: string;
  objective?: string;
};

/** Educational glossary for common match-game terms (not arcade fluff). */
const EDUCATIONAL_GLOSSARY: Record<string, string> = {
  mitochondria:
    "Organelle that produces ATP / cellular energy (often called the cell's powerhouse).",
  nucleus: "Contains DNA and directs cell activities / genetic control center.",
  ribosome: "Site of protein synthesis (translation).",
  dhcp: "Assigns IP addresses (and related config) dynamically to hosts.",
  dns: "Resolves domain names to IP addresses (name lookup).",
  "default gateway":
    "Router used as the default exit path from a local network.",
  gateway: "Router used as the default exit path from a local network.",
};

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractTermsFromPrompt(prompt: string): string[] {
  const forMatch = prompt.match(
    /(?:for|terms?\s*:?)\s+(.+?)(?:\.|$)/i,
  );
  const chunk = forMatch?.[1] ?? "";
  if (!chunk) {
    // Fallback: quoted or Capitalized technical tokens
    const caps = prompt.match(
      /\b(?:DHCP|DNS|[A-Z][a-z]+(?:\s+[a-z]+)?)\b/g,
    );
    return [...new Set((caps ?? []).map((t) => t.trim()))].slice(0, 6);
  }
  return chunk
    .replace(/\band\b/gi, ",")
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && t.length < 48)
    .slice(0, 8);
}

function buildPairs(
  challenge: GameChallengeView,
  pairsProp?: MatchPair[],
): MatchPair[] {
  if (pairsProp && pairsProp.length > 0) return pairsProp;

  const arrowPairs = [
    ...challenge.prompt.matchAll(
      /([A-Za-z][\w\s/-]{1,40}?)\s*(?:→|->|:)\s*([^.;\n]+)/g,
    ),
  ]
    .map((m) => ({
      term: (m[1] ?? "").trim(),
      definition: (m[2] ?? "").trim(),
    }))
    .filter((p) => p.term && p.definition);

  if (arrowPairs.length >= 2) return arrowPairs;

  const terms = extractTermsFromPrompt(challenge.prompt);
  const fromGlossary = terms
    .map((term) => {
      const def = EDUCATIONAL_GLOSSARY[normalizeTerm(term)];
      return def ? { term, definition: def } : null;
    })
    .filter((p): p is MatchPair => Boolean(p));

  if (fromGlossary.length >= 2) return fromGlossary;

  // Last resort: term cards with objective-based definition stubs learners still match.
  if (terms.length >= 2) {
    return terms.map((term) => ({
      term,
      definition: `Accurate definition for ${term} (from your materials / objective).`,
    }));
  }

  return [
    {
      term: "Concept A",
      definition: challenge.objective ?? "Primary idea from the prompt.",
    },
    {
      term: "Concept B",
      definition: "Related idea you should distinguish from Concept A.",
    },
  ];
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function serializeMatches(matched: MatchPair[]): string {
  return matched.map((p) => `${p.term} → ${p.definition}`).join("\n");
}

/**
 * Educational matching game — term ↔ definition practice for rubric text submit.
 */
export function GameMatchPanel(props: {
  challenge: GameChallengeView;
  pairs?: MatchPair[];
  onArtifactChange: (artifact: string) => void;
}) {
  const { challenge, pairs: pairsProp, onArtifactChange } = props;
  const basePairs = useMemo(
    () => buildPairs(challenge, pairsProp),
    [challenge, pairsProp],
  );

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<MatchPair[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [defOrder, setDefOrder] = useState<string[]>(() =>
    shuffle(basePairs.map((p) => p.definition)),
  );

  const remainingTerms = basePairs.filter(
    (p) => !matched.some((m) => normalizeTerm(m.term) === normalizeTerm(p.term)),
  );
  const remainingDefs = defOrder.filter(
    (d) => !matched.some((m) => m.definition === d),
  );

  const publish = useCallback(
    (next: MatchPair[]) => {
      onArtifactChange(serializeMatches(next));
    },
    [onArtifactChange],
  );

  useEffect(() => {
    publish(matched);
  }, [matched, publish]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setMatched([]);
    setSelectedTerm(null);
    setStreak(0);
    setRound(1);
    setFeedback(null);
    setDefOrder(shuffle(basePairs.map((p) => p.definition)));
  }, [challenge.id, basePairs]);

  const tryMatch = (definition: string) => {
    if (!selectedTerm) {
      setFeedback("Select a term first, then its definition.");
      return;
    }
    const expected = basePairs.find(
      (p) => normalizeTerm(p.term) === normalizeTerm(selectedTerm),
    );
    if (!expected) return;

    if (expected.definition === definition) {
      const next = [...matched, expected];
      setMatched(next);
      setStreak((s) => s + 1);
      setSelectedTerm(null);
      setFeedback("Correct match.");
      if (next.length >= basePairs.length) {
        setFeedback("Round complete — review your pairs, then submit.");
        setRound((r) => r + 1);
      }
    } else {
      setStreak(0);
      setSelectedTerm(null);
      setFeedback("Not a match — try another pairing.");
    }
  };

  return (
    <div data-game-workspace className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
        <p className="text-sm font-medium text-stone-900">{challenge.title}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
          {challenge.prompt}
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Learning game — match terms to definitions. Points alone are not
          mastery; your matched pairs are submitted for evaluation.
        </p>
        <p className="mt-2 text-sm text-stone-700">
          Round {round} · Streak {streak} · Matched {matched.length}/
          {basePairs.length}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Terms
          </h2>
          <ul className="mt-2 space-y-2">
            {remainingTerms.map((p) => (
              <li key={p.term}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTerm(p.term);
                    setFeedback(null);
                  }}
                  className={
                    selectedTerm === p.term
                      ? "flex min-h-11 w-full items-center rounded-xl bg-teal-700 px-3 py-2 text-left text-sm font-semibold text-white touch-manipulation"
                      : "flex min-h-11 w-full items-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-left text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
                  }
                >
                  {p.term}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Definitions
          </h2>
          <ul className="mt-2 space-y-2">
            {remainingDefs.map((definition) => (
              <li key={definition}>
                <button
                  type="button"
                  onClick={() => tryMatch(definition)}
                  className="flex min-h-11 w-full items-start rounded-xl border border-stone-300 bg-white px-3 py-2 text-left text-sm text-stone-800 hover:bg-stone-50 touch-manipulation"
                >
                  {definition}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {feedback ? (
        <p className="text-sm text-stone-700" role="status">
          {feedback}
        </p>
      ) : null}

      {matched.length > 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Matched pairs (for submit)
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-stone-700">
            {matched.map((p) => (
              <li key={p.term} className="font-mono text-xs">
                {p.term} → {p.definition}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setMatched([]);
          setSelectedTerm(null);
          setStreak(0);
          setFeedback(null);
          setDefOrder(shuffle(basePairs.map((p) => p.definition)));
          onArtifactChange("");
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
      >
        Reset matches
      </button>
    </div>
  );
}
