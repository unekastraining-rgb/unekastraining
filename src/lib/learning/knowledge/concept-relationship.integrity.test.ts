/**
 * Phase 2E-2A — disposable SQLite integrity validation.
 * Uses a temp DB only (never production / never shared with ./dev.db).
 * Applies the real migration SQL against minimal parent tables.
 */
import { afterEach, describe, expect, it } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const MIGRATION_PATH = path.join(
  process.cwd(),
  "prisma/migrations/20260915180000_concept_relationship/migration.sql",
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
  url: string;
}> {
  const dir = mkdtempSync(path.join(tmpdir(), "sh-concept-rel-"));
  const dbPath = path.join(dir, "integrity.db");
  const url = `file:${dbPath}`;
  const client = createClient({ url });

  await client.execute("PRAGMA foreign_keys = ON");

  // Minimal parent tables required by ConceptRelationship FKs only.
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

  const migrationSql = readFileSync(MIGRATION_PATH, "utf8");
  for (const statement of splitSqlStatements(migrationSql)) {
    await client.execute(statement);
  }

  return { client, dir, url };
}

async function seedUserConcepts(client: Client) {
  await client.execute({
    sql: `INSERT INTO "User" ("id", "email") VALUES (?, ?)`,
    args: ["user-a", "a@test.local"],
  });
  await client.execute({
    sql: `INSERT INTO "User" ("id", "email") VALUES (?, ?)`,
    args: ["user-b", "b@test.local"],
  });
  await client.execute({
    sql: `INSERT INTO "Concept" ("id", "userId", "title") VALUES (?, ?, ?)`,
    args: ["concept-a", "user-a", "Exception Handling"],
  });
  await client.execute({
    sql: `INSERT INTO "Concept" ("id", "userId", "title") VALUES (?, ?, ?)`,
    args: ["concept-b", "user-a", "Exceptions"],
  });
  await client.execute({
    sql: `INSERT INTO "Concept" ("id", "userId", "title") VALUES (?, ?, ?)`,
    args: ["concept-c", "user-b", "Other User Concept"],
  });
}

describe("Phase 2E-2A disposable DB integrity", () => {
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

  it("applies migration SQL on a clean disposable database (with parent tables)", async () => {
    const { client, dir } = await createDisposableDb();
    clients.push(client);
    dirs.push(dir);

    const tables = await client.execute(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='ConceptRelationship'`,
    );
    expect(tables.rows).toHaveLength(1);

    const indexes = await client.execute(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='ConceptRelationship' ORDER BY name`,
    );
    const indexNames = indexes.rows.map((row) => String(row.name));
    expect(indexNames).toContain(
      "ConceptRelationship_userId_fromConceptId_toConceptId_type_key",
    );
    expect(indexNames).toContain("ConceptRelationship_userId_idx");
    expect(indexNames).toContain("ConceptRelationship_fromConceptId_idx");
    expect(indexNames).toContain("ConceptRelationship_toConceptId_idx");
  });

  it("migration SQL contains no destructive statements", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    const withoutComments = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    // ON DELETE/UPDATE CASCADE are intentional FK clauses — not data mutation statements.
    expect(withoutComments).not.toMatch(/\bDROP\s+TABLE\b/i);
    expect(withoutComments).not.toMatch(/\bALTER\s+TABLE\b/i);
    expect(withoutComments).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(withoutComments).not.toMatch(/\bUPDATE\s+\w+\s+SET\b/i);
    expect(withoutComments).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(withoutComments).toMatch(/CREATE TABLE "ConceptRelationship"/);
    expect(withoutComments).toMatch(/ON DELETE CASCADE/);
    expect(withoutComments).toMatch(/ON UPDATE CASCADE/);
  });

  it("enforces unique (userId, from, to, type) at the database layer", async () => {
    const { client, dir } = await createDisposableDb();
    clients.push(client);
    dirs.push(dir);
    await seedUserConcepts(client);

    await client.execute({
      sql: `INSERT INTO "ConceptRelationship"
        ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
        VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
      args: ["rel-1", "user-a", "concept-a", "concept-b", "PREREQUISITE"],
    });

    await expect(
      client.execute({
        sql: `INSERT INTO "ConceptRelationship"
          ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
          VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
        args: ["rel-2", "user-a", "concept-a", "concept-b", "PREREQUISITE"],
      }),
    ).rejects.toThrow(/UNIQUE/i);
  });

  it("DB unique key blocks reverse RELATED/CONFUSABLE_WITH when endpoints are canonicalized", async () => {
    const { client, dir } = await createDisposableDb();
    clients.push(client);
    dirs.push(dir);
    await seedUserConcepts(client);

    // Canonical order: concept-a < concept-b lexicographically
    await client.execute({
      sql: `INSERT INTO "ConceptRelationship"
        ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
        VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
      args: ["rel-related", "user-a", "concept-a", "concept-b", "RELATED"],
    });

    await expect(
      client.execute({
        sql: `INSERT INTO "ConceptRelationship"
          ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
          VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
        args: ["rel-related-rev", "user-a", "concept-a", "concept-b", "RELATED"],
      }),
    ).rejects.toThrow(/UNIQUE/i);

    await client.execute({
      sql: `INSERT INTO "ConceptRelationship"
        ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
        VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
      args: [
        "rel-confusable",
        "user-a",
        "concept-a",
        "concept-b",
        "CONFUSABLE_WITH",
      ],
    });

    await expect(
      client.execute({
        sql: `INSERT INTO "ConceptRelationship"
          ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
          VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
        args: [
          "rel-confusable-dup",
          "user-a",
          "concept-a",
          "concept-b",
          "CONFUSABLE_WITH",
        ],
      }),
    ).rejects.toThrow(/UNIQUE/i);

    // Non-canonical reverse row is a different unique key if inserted raw —
    // domain layer prevents this; document DB alone does not block reverse order.
    const reverse = await client.execute({
      sql: `INSERT INTO "ConceptRelationship"
        ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
        VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
      args: ["rel-related-raw-rev", "user-a", "concept-b", "concept-a", "RELATED"],
    });
    expect(reverse.rowsAffected).toBe(1);

    const count = await client.execute(
      `SELECT COUNT(*) AS c FROM "ConceptRelationship" WHERE type='RELATED' AND userId='user-a'`,
    );
    expect(Number(count.rows[0]?.c)).toBe(2);
  });

  it("cascades relationship deletion when fromConcept is deleted", async () => {
    const { client, dir } = await createDisposableDb();
    clients.push(client);
    dirs.push(dir);
    await seedUserConcepts(client);

    await client.execute({
      sql: `INSERT INTO "ConceptRelationship"
        ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
        VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
      args: ["rel-cascade-from", "user-a", "concept-a", "concept-b", "PART_OF"],
    });

    await client.execute(`DELETE FROM "Concept" WHERE id='concept-a'`);

    const remaining = await client.execute(
      `SELECT COUNT(*) AS c FROM "ConceptRelationship" WHERE id='rel-cascade-from'`,
    );
    expect(Number(remaining.rows[0]?.c)).toBe(0);

    const otherConcept = await client.execute(
      `SELECT COUNT(*) AS c FROM "Concept" WHERE id='concept-b'`,
    );
    expect(Number(otherConcept.rows[0]?.c)).toBe(1);
  });

  it("cascades relationship deletion when toConcept is deleted", async () => {
    const { client, dir } = await createDisposableDb();
    clients.push(client);
    dirs.push(dir);
    await seedUserConcepts(client);

    await client.execute({
      sql: `INSERT INTO "ConceptRelationship"
        ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
        VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
      args: [
        "rel-cascade-to",
        "user-a",
        "concept-a",
        "concept-b",
        "PREREQUISITE",
      ],
    });

    await client.execute(`DELETE FROM "Concept" WHERE id='concept-b'`);

    const remaining = await client.execute(
      `SELECT COUNT(*) AS c FROM "ConceptRelationship" WHERE id='rel-cascade-to'`,
    );
    expect(Number(remaining.rows[0]?.c)).toBe(0);

    const fromStillExists = await client.execute(
      `SELECT COUNT(*) AS c FROM "Concept" WHERE id='concept-a'`,
    );
    expect(Number(fromStillExists.rows[0]?.c)).toBe(1);
  });

  it("FK rejects relationship targeting another user's concept only via application ownership (DB allows if IDs exist)", async () => {
    const { client, dir } = await createDisposableDb();
    clients.push(client);
    dirs.push(dir);
    await seedUserConcepts(client);

    // DB FK only checks Concept id existence, not same userId —
    // ownership is enforced in domain. Confirm FK still allows insert of
    // cross-user concept ids if forced at SQL (documents domain responsibility).
    const forced = await client.execute({
      sql: `INSERT INTO "ConceptRelationship"
        ("id", "userId", "fromConceptId", "toConceptId", "type", "metadataJson", "updatedAt")
        VALUES (?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)`,
      args: ["rel-cross", "user-a", "concept-a", "concept-c", "RELATED"],
    });
    expect(forced.rowsAffected).toBe(1);
  });
});
