/**
 * Educational SQL evaluation via sql.js in-memory DB.
 * No production DB. No external connections.
 */

import initSqlJs from "sql.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getSqlChallenge,
  isSafeEducationalSelect,
  type SqlChallenge,
} from "./challenges";
import {
  makeServerEvaluation,
  outcomeFromPassRatio,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalEvaluationResult } from "@/lib/learning/activities/execution-contract";

function normalizeRows(
  rows: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return rows
    .map((row) => {
      const next: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        next[k.toLowerCase()] = v;
      }
      return next;
    })
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function rowsEqual(
  actual: Array<Record<string, unknown>>,
  expected: Array<Record<string, unknown>>,
): boolean {
  const a = normalizeRows(actual);
  const e = normalizeRows(expected);
  if (a.length !== e.length) return false;
  return a.every((row, i) => JSON.stringify(row) === JSON.stringify(e[i]));
}

async function createEducationalDb() {
  const wasmPath = join(
    process.cwd(),
    "node_modules",
    "sql.js",
    "dist",
    "sql-wasm.wasm",
  );
  const wasmBinary = readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  return new SQL.Database();
}

export async function evaluateSqlChallenge(
  challenge: SqlChallenge,
  learnerSql: string,
): Promise<UniversalEvaluationResult> {
  const safety = isSafeEducationalSelect(learnerSql);
  if (!safety.ok) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: "PERFORM",
      details: { error: safety.reason, mode: "educational_sqljs" },
    });
  }

  const db = await createEducationalDb();
  try {
    db.run(challenge.seedSql);
    const result = db.exec(learnerSql.trim().replace(/;+\s*$/, ""));
    if (!result.length) {
      const emptyOk = challenge.expectedRows.length === 0;
      return makeServerEvaluation({
        outcome: emptyOk ? "SUCCESS" : "FAIL",
        score: emptyOk ? 1 : 0,
        skillFacet: "PERFORM",
        details: { mode: "educational_sqljs", rows: 0 },
      });
    }

    const columns = result[0].columns;
    const values = result[0].values;
    const actual = values.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });

    const pass = rowsEqual(actual, challenge.expectedRows);
    const ratio = pass ? 1 : 0;
    return makeServerEvaluation({
      outcome: outcomeFromPassRatio(ratio),
      score: ratio,
      skillFacet: "PERFORM",
      details: {
        mode: "educational_sqljs",
        pass,
        actualRowCount: actual.length,
        expectedRowCount: challenge.expectedRows.length,
      },
    });
  } catch (err) {
    return makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: "PERFORM",
      details: {
        mode: "educational_sqljs",
        error: err instanceof Error ? err.message : "sql_error",
      },
    });
  } finally {
    db.close();
  }
}

export async function evaluateSqlById(
  challengeId: string,
  learnerSql: string,
): Promise<UniversalEvaluationResult | null> {
  const challenge = getSqlChallenge(challengeId);
  if (!challenge) return null;
  return evaluateSqlChallenge(challenge, learnerSql);
}
