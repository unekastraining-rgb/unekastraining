import { createClient } from "@libsql/client";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dir = mkdtempSync(path.join(tmpdir(), "sh-2e2a-schema-"));
const dbPath = path.join(dir, "clean.db");
const url = `file:${dbPath}`;

try {
  execFileSync("npx", ["prisma", "db", "push"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: url },
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const client = createClient({ url });
  await client.execute("PRAGMA foreign_keys = ON");
  const table = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='ConceptRelationship'`,
  );
  const indexes = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='ConceptRelationship' ORDER BY name`,
  );
  const result = {
    ok: table.rows.length === 1,
    table: table.rows.map((row) => row.name),
    indexes: indexes.rows.map((row) => row.name),
  };
  console.log(JSON.stringify(result, null, 2));
  client.close();
  if (!result.ok) process.exit(1);
} finally {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // Windows may briefly lock the SQLite file; temp dirs are disposable.
  }
}
