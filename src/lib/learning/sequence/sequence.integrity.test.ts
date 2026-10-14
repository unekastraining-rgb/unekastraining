/**
 * Phase 2G-2 — disposable SQLite integrity validation for AdaptiveSequenceRun.
 * Uses a temp DB only (never production / never shared with ./dev.db).
 */
import { afterEach, describe, expect, it } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const MIGRATION_PATH = path.join(
  process.cwd(),
  "prisma/migrations/20260918180000_adaptive_sequence_run/migration.sql",
);

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((part) =>
      part
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

async function createDisposableDb(): Promise<{
  client: Client;
  dir: string;
}> {
  const dir = mkdtempSync(path.join(tmpdir(), "sh-adaptive-seq-"));
  const dbPath = path.join(dir, "integrity.db");
  const client = createClient({ url: `file:${dbPath}` });

  await client.execute("PRAGMA foreign_keys = ON");

  await client.execute(`
    CREATE TABLE "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`
    CREATE TABLE "Concept" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "metadataJson" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  // LearningAttempt parent stubs — prove run delete does not cascade to attempts.
  await client.execute(`
    CREATE TABLE "LearningObject" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "payloadRefJson" TEXT NOT NULL DEFAULT '{}'
    )
  `);
  await client.execute(`
    CREATE TABLE "LearningAttempt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "learningObjectId" TEXT NOT NULL,
      "outcome" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("learningObjectId") REFERENCES "LearningObject" ("id") ON DELETE CASCADE
    )
  `);

  const migrationSql = readFileSync(MIGRATION_PATH, "utf8");
  for (const statement of splitSqlStatements(migrationSql)) {
    await client.execute(statement);
  }

  return { client, dir };
}

describe("Phase 2G-2 disposable DB integrity", () => {
  const dirs: string[] = [];
  const clients: Client[] = [];

  afterEach(async () => {
    for (const client of clients.splice(0)) {
      try {
        client.close();
      } catch {
        /* ignore */
      }
    }
    for (const dir of dirs.splice(0)) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });

  it("applies migration SQL on a clean disposable database", async () => {
    const { client, dir } = await createDisposableDb();
    clients.push(client);
    dirs.push(dir);

    const tables = await client.execute(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='AdaptiveSequenceRun'`,
    );
    expect(tables.rows.length).toBe(1);
  });

  it("deleting AdaptiveSequenceRun does not delete LearningAttempt (no FK)", async () => {
    const { client, dir } = await createDisposableDb();
    clients.push(client);
    dirs.push(dir);

    await client.execute({
      sql: `INSERT INTO "User" ("id", "email") VALUES (?, ?)`,
      args: ["user-a", "a@test.local"],
    });
    await client.execute({
      sql: `INSERT INTO "Concept" ("id", "userId", "title") VALUES (?, ?, ?)`,
      args: ["concept-a", "user-a", "Exceptions"],
    });
    await client.execute({
      sql: `INSERT INTO "LearningObject" ("id", "userId", "type") VALUES (?, ?, ?)`,
      args: ["lo-1", "user-a", "QUIZ_ITEM"],
    });
    await client.execute({
      sql: `INSERT INTO "LearningAttempt" ("id", "userId", "learningObjectId", "outcome") VALUES (?, ?, ?, ?)`,
      args: ["attempt-1", "user-a", "lo-1", "FAIL"],
    });
    await client.execute({
      sql: `INSERT INTO "AdaptiveSequenceRun"
        ("id", "userId", "conceptId", "status", "currentStepIndex", "stepsJson", "interventionHistoryJson", "lastAttemptId", "updatedAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        "run-1",
        "user-a",
        "concept-a",
        "ACTIVE",
        0,
        '[{"intervention":"chunking","learningObjectId":"lo-1"}]',
        "[]",
        "attempt-1",
      ],
    });

    await client.execute(`DELETE FROM "AdaptiveSequenceRun" WHERE "id" = 'run-1'`);

    const attempts = await client.execute(
      `SELECT id FROM "LearningAttempt" WHERE id = 'attempt-1'`,
    );
    expect(attempts.rows.length).toBe(1);
  });

  it("FK rejects conceptId that does not exist", async () => {
    const { client, dir } = await createDisposableDb();
    clients.push(client);
    dirs.push(dir);

    await client.execute({
      sql: `INSERT INTO "User" ("id", "email") VALUES (?, ?)`,
      args: ["user-a", "a@test.local"],
    });

    await expect(
      client.execute({
        sql: `INSERT INTO "AdaptiveSequenceRun"
          ("id", "userId", "conceptId", "status", "currentStepIndex", "stepsJson", "interventionHistoryJson", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [
          "run-x",
          "user-a",
          "missing-concept",
          "ACTIVE",
          0,
          '[{"intervention":"chunking"}]',
          "[]",
        ],
      }),
    ).rejects.toThrow();
  });
});
