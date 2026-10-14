/**
 * 2P-39 — Constrained linear-equation algebra (NOT a CAS).
 *
 * Supported:
 * - ax + b = c
 * - ax − b = c
 * - ax + b = dx + e
 * - a(x + b) = c  /  a(x − b) = c  (single distribution)
 * - x = k  (solved form)
 *
 * Unsupported (intentional): polynomials degree > 1, systems, systems, systems,
 * systems, inequalities, absolute value, arbitrary symbolic simplification.
 */

import type { MathErrorCategory } from "./types";

export type LinearSide = { coef: number; const: number };

export type ParsedEquation = {
  left: LinearSide;
  right: LinearSide;
};

const EPS = 1e-9;

export function normalizeMathInput(raw: string): string {
  return raw
    .replace(/\u2212/g, "-")
    .replace(/\u00d7/g, "*")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** Parse a linear side: 2x+4, -x, 5, 3(x+2), 3(x-2), x/2 (as 0.5x). */
export function parseLinearSide(raw: string): LinearSide | null {
  const s = normalizeMathInput(raw);
  if (!s) return null;

  // a(x±b)
  const dist = s.match(/^(-?\d+(?:\.\d+)?)?\((x)([+-]\d+(?:\.\d+)?)?\)$/);
  if (dist) {
    const a = dist[1] === undefined || dist[1] === "" || dist[1] === "-"
      ? dist[1] === "-"
        ? -1
        : 1
      : Number(dist[1]);
    if (!Number.isFinite(a)) return null;
    const inner = dist[3] ? Number(dist[3]) : 0;
    if (!Number.isFinite(inner)) return null;
    return { coef: a, const: a * inner };
  }

  // Plain number
  if (/^-?\d+(?:\.\d+)?$/.test(s)) {
    return { coef: 0, const: Number(s) };
  }

  // Terms with x: ±ax ± b (order flexible enough for common forms)
  let coef = 0;
  let constant = 0;
  const work = s.startsWith("+") || s.startsWith("-") ? s : `+${s}`;

  // Split into signed terms while keeping x terms intact
  const termRe = /([+-](?:\d+(?:\.\d+)?)?x(?:\/\d+(?:\.\d+)?)?|[+-]\d+(?:\.\d+)?)/g;
  const terms = work.match(termRe);
  if (!terms || terms.join("") !== work) {
    // Try x alone patterns already covered; fail closed
    return null;
  }

  for (const term of terms) {
    if (term.includes("x")) {
      const m = term.match(/^([+-])(?:(\d+(?:\.\d+)?)?)x(?:\/(\d+(?:\.\d+)?))?$/);
      if (!m) return null;
      const sign = m[1] === "-" ? -1 : 1;
      let n = m[2] ? Number(m[2]) : 1;
      if (m[3]) n = n / Number(m[3]);
      if (!Number.isFinite(n)) return null;
      coef += sign * n;
    } else {
      const n = Number(term);
      if (!Number.isFinite(n)) return null;
      constant += n;
    }
  }

  return { coef, const: constant };
}

export function parseLinearEquation(raw: string): ParsedEquation | null {
  const s = normalizeMathInput(raw);
  const parts = s.split("=");
  if (parts.length !== 2) return null;
  const left = parseLinearSide(parts[0]);
  const right = parseLinearSide(parts[1]);
  if (!left || !right) return null;
  return { left, right };
}

export function solveLinearEquation(eq: ParsedEquation): number | null {
  const coef = eq.left.coef - eq.right.coef;
  const constant = eq.right.const - eq.left.const;
  if (Math.abs(coef) < EPS) {
    // 0x = k — identity or contradiction; not a unique solve
    return null;
  }
  return constant / coef;
}

export function equationsEquivalent(a: ParsedEquation, b: ParsedEquation): boolean {
  const sa = solveLinearEquation(a);
  const sb = solveLinearEquation(b);
  if (sa === null || sb === null) return false;
  return Math.abs(sa - sb) < 1e-6;
}

export function nearlyEqual(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) < tol;
}

/**
 * Classify transition from previous equation to next.
 * Conservative: unsupported / non-equivalent → structured category.
 */
export function classifyStepError(
  previousRaw: string,
  nextRaw: string,
  expectedX: number,
): MathErrorCategory {
  const prev = parseLinearEquation(previousRaw);
  const next = parseLinearEquation(nextRaw);
  if (!prev || !next) return "UNSUPPORTED_TRANSFORM";

  if (equationsEquivalent(prev, next)) return "NONE";

  const nextSol = solveLinearEquation(next);
  const prevSol = solveLinearEquation(prev);

  // Sign flip relative to expected / previous solution
  if (nextSol !== null && nearlyEqual(nextSol, -expectedX) && expectedX !== 0) {
    return "SIGN_ERROR";
  }
  if (
    nextSol !== null &&
    prevSol !== null &&
    nearlyEqual(nextSol, -prevSol) &&
    prevSol !== 0
  ) {
    return "SIGN_ERROR";
  }

  // Constant moved across equality with the wrong sign (classic ± slip).
  if (
    Math.abs(prev.left.coef - next.left.coef) < EPS &&
    Math.abs(prev.right.coef - next.right.coef) < EPS &&
    Math.abs(prev.left.const) > EPS
  ) {
    const moved = -prev.left.const;
    const correctRight = prev.right.const + moved;
    const wrongRight = prev.right.const - moved;
    if (
      Math.abs(next.left.const) < EPS &&
      nearlyEqual(next.right.const, wrongRight) &&
      !nearlyEqual(next.right.const, correctRight)
    ) {
      return "SIGN_ERROR";
    }
  }

  // Distribution smell: original had parens, next dropped them wrong
  if (
    normalizeMathInput(previousRaw).includes("(") &&
    !normalizeMathInput(nextRaw).includes("(")
  ) {
    // Compare naive wrong expand a(x+b) -> ax+b
    const m = normalizeMathInput(previousRaw).match(
      /^(-?\d+)\((x)([+-]\d+)\)=(.+)$/,
    );
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[3]);
      const wrong = parseLinearEquation(`${a}x${b >= 0 ? "+" : ""}${b}=${m[4]}`);
      if (wrong && equationsEquivalent(wrong, next)) {
        return "DISTRIBUTION_ERROR";
      }
    }
  }

  // One side arithmetic slip but same coef structure
  if (
    prev.left.coef === next.left.coef &&
    prev.right.coef === next.right.coef &&
    (prev.left.const !== next.left.const || prev.right.const !== next.right.const)
  ) {
    return "ARITHMETIC_ERROR";
  }

  // Coefs changed asymmetrically → likely equality break / inverse op
  if (prev.left.coef !== next.left.coef || prev.right.coef !== next.right.coef) {
    if (
      Math.abs((prev.left.coef - prev.right.coef) - (next.left.coef - next.right.coef)) >
      EPS
    ) {
      return "INVERSE_OPERATION_ERROR";
    }
  }

  if (nextSol === null) return "EQUALITY_BREAK";
  return "EQUALITY_BREAK";
}

export function formatSolution(x: number): string {
  if (Number.isInteger(x)) return `x=${x}`;
  const rounded = Math.round(x * 1000) / 1000;
  return `x=${rounded}`;
}

export function isSolvedForm(raw: string, expectedX: number): boolean {
  const eq = parseLinearEquation(raw);
  if (!eq) return false;
  // Prefer x = k or k = x with zero other terms
  const n = normalizeMathInput(raw);
  if (!/^x=-?\d+(?:\.\d+)?$/.test(n) && !/^-?\d+(?:\.\d+)?=x$/.test(n)) {
    // Still accept any equivalent equation that isolates uniquely
    const sol = solveLinearEquation(eq);
    return sol !== null && nearlyEqual(sol, expectedX);
  }
  const sol = solveLinearEquation(eq);
  return sol !== null && nearlyEqual(sol, expectedX);
}
