/**
 * Safe coding evaluators — language abstraction.
 * JavaScript: node:vm sandbox with timeout (no require/process).
 * Python/Java: structural criteria only (no host execution).
 */

import { createContext, runInContext } from "node:vm";
import type { CodingChallenge } from "./challenges";
import {
  makeServerEvaluation,
  outcomeFromPassRatio,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalEvaluationResult } from "@/lib/learning/activities/execution-contract";

export type CodingLanguageEvaluator = {
  language: CodingChallenge["language"];
  evaluate(
    challenge: CodingChallenge,
    code: string,
  ): UniversalEvaluationResult;
};

function evaluateJavascript(
  challenge: CodingChallenge,
  code: string,
): UniversalEvaluationResult {
  const results: Array<{ id: string; pass: boolean; error?: string }> = [];
  const sandbox: Record<string, unknown> = { console: undefined };
  const context = createContext(sandbox);

  try {
    runInContext(
      `${code}\n;this.__entry = typeof ${challenge.entryFunction} === "function" ? ${challenge.entryFunction} : null;`,
      context,
      { timeout: 200, displayErrors: true },
    );
  } catch (err) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: "PERFORM",
      details: {
        language: "javascript",
        error: err instanceof Error ? err.message : "runtime_error",
        passed: 0,
        total: challenge.tests.length,
      },
    });
  }

  const entry = sandbox.__entry;
  if (typeof entry !== "function") {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: "PERFORM",
      details: {
        language: "javascript",
        error: `missing_function:${challenge.entryFunction}`,
        passed: 0,
        total: challenge.tests.length,
      },
    });
  }

  for (const test of challenge.tests) {
    try {
      const got = (entry as (...a: unknown[]) => unknown)(...test.args);
      const pass = Object.is(got, test.expected) || got === test.expected;
      results.push({ id: test.id, pass });
    } catch (err) {
      results.push({
        id: test.id,
        pass: false,
        error: err instanceof Error ? err.message : "test_error",
      });
    }
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length || 1;
  const ratio = passed / total;
  return makeServerEvaluation({
    outcome: outcomeFromPassRatio(ratio),
    score: ratio,
    skillFacet: "PERFORM",
    details: {
      language: "javascript",
      passed,
      total,
      results,
      execution: "node_vm_sandbox",
    },
  });
}

function evaluateStructural(
  challenge: CodingChallenge,
  code: string,
): UniversalEvaluationResult {
  const patterns = challenge.requiredPatterns ?? [];
  const hits = patterns.filter((p) => code.includes(p));
  const ratio = patterns.length === 0 ? 0 : hits.length / patterns.length;
  return makeServerEvaluation({
    outcome: outcomeFromPassRatio(ratio),
    score: ratio,
    skillFacet: "PERFORM",
    details: {
      language: challenge.language,
      mode: "structural_criteria",
      required: patterns,
      matched: hits,
      note: "Host language runtime not executed — structural objective checks only.",
    },
  });
}

export const javascriptVmEvaluator: CodingLanguageEvaluator = {
  language: "javascript",
  evaluate: evaluateJavascript,
};

export const pythonStructuralEvaluator: CodingLanguageEvaluator = {
  language: "python",
  evaluate: evaluateStructural,
};

export const javaStructuralEvaluator: CodingLanguageEvaluator = {
  language: "java",
  evaluate: evaluateStructural,
};

const EVALUATORS: Record<CodingChallenge["language"], CodingLanguageEvaluator> =
  {
    javascript: javascriptVmEvaluator,
    python: pythonStructuralEvaluator,
    java: javaStructuralEvaluator,
  };

export function evaluateCodingChallenge(
  challenge: CodingChallenge,
  code: string,
): UniversalEvaluationResult {
  const trimmed = code.trim();
  if (!trimmed) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: "PERFORM",
      details: { error: "empty_code" },
    });
  }
  return EVALUATORS[challenge.language].evaluate(challenge, trimmed);
}
