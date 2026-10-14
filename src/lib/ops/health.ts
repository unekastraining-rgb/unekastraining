/**
 * Operator health probe — no secrets in response.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { db } from "@/lib/db";
import { logOpsEvent } from "@/lib/ops/safe-log";

export type HealthReport = {
  ok: boolean;
  status: "ok" | "degraded" | "error";
  version: string;
  checks: {
    app: boolean;
    database: boolean;
    sessionSecretConfigured: boolean;
    databaseUrlConfigured: boolean;
    appUrlConfigured: boolean;
  };
  checkedAt: string;
};

function readPackageVersion(): string {
  try {
    const raw = readFileSync(
      path.join(process.cwd(), "package.json"),
      "utf8",
    );
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version?.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

export async function runHealthCheck(): Promise<HealthReport> {
  const checks = {
    app: true,
    database: false,
    sessionSecretConfigured: Boolean(
      process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16,
    ),
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL?.trim()),
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const ok =
    checks.app &&
    checks.database &&
    checks.sessionSecretConfigured &&
    checks.databaseUrlConfigured;

  const status: HealthReport["status"] = !checks.database
    ? "error"
    : !ok
      ? "degraded"
      : "ok";

  logOpsEvent("ops.health.check", {
    status,
    database: checks.database,
  });

  return {
    ok,
    status,
    version: readPackageVersion(),
    checks,
    checkedAt: new Date().toISOString(),
  };
}
