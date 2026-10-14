/**
 * Private/beta release readiness — config & architecture integrity.
 * Not an architecture phase; verifies deploy-safe contracts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { resolveSessionCookieSecure } from "@/lib/auth/session-cookie";
import { longHorizonScheduleTruthSummary } from "@/lib/learning/retention/schedule";
import { lmsTokenCryptoTruthSummary } from "@/lib/security/lms-token-crypto";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("private/beta deployment readiness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("PRIVATE_BETA_DEPLOYMENT.md exists with secrets + backup guidance", () => {
    const doc = read("src/lib/learning/PRIVATE_BETA_DEPLOYMENT.md");
    expect(doc).toContain("SESSION_SECRET");
    expect(doc).toContain("Backup");
    expect(doc).toContain("Recovery");
    expect(doc).toContain("migrate deploy");
    expect(doc).toContain("P3005");
    expect(doc).not.toMatch(/sk-live|AIza[0-9A-Za-z_-]{20,}/);
    expect(doc).toContain("NOT READY");
    expect(doc).toContain("passwordless");
  });

  it("Fly + Docker keep migrate-safe entrypoint and volume", () => {
    const fly = read("fly.toml");
    expect(fly).toContain("DATA_DIR");
    expect(fly).toContain("/data");
    expect(fly).toContain("studyhaul_data");
    expect(fly).toContain("force_https");
    const sh = read("scripts/docker-entrypoint.sh");
    expect(sh).toContain("migrate deploy");
    expect(sh).toContain("ALLOW_DB_DATA_LOSS");
    expect(sh).toContain("Using prisma db push (no data-loss flag)");
  });

  it("production ignores SESSION_COOKIE_SECURE=false override", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_COOKIE_SECURE", "false");
    expect(resolveSessionCookieSecure("https")).toBe(true);
    expect(resolveSessionCookieSecure("http")).toBe(false);
  });

  it("Calendar path uses shared token seal helpers", () => {
    const cal = read("src/lib/calendar/google-calendar.ts");
    expect(cal).toContain("sealLmsToken");
    expect(cal).toContain("openLmsToken");
    expect(lmsTokenCryptoTruthSummary().requiresSessionSecret).toBe(true);
  });

  it("2P-52 long-horizon schedule contract remains AI-independent", () => {
    const t = longHorizonScheduleTruthSummary();
    expect(t.inventsFSRS).toBe(false);
    expect(t.inventsSecondRetentionEngine).toBe(false);
    expect(t.successSpacingWidens).toBe(true);
    expect(t.noCronRequired).toBe(true);
  });

  it(".env.example documents seal + required production vars", () => {
    const env = read(".env.example");
    expect(env).toContain("SESSION_SECRET");
    expect(env).toContain("DATABASE_URL");
    expect(env).toContain("NEXT_PUBLIC_APP_URL");
    expect(env).toMatch(/seal|AES|at rest/i);
  });

  it("deployment docs exist and do not embed secrets", () => {
    expect(existsSync("DEPLOY-PERSONAL.md")).toBe(true);
    expect(existsSync("DEPLOY.md")).toBe(true);
    const personal = read("DEPLOY-PERSONAL.md");
    expect(personal).toContain("fly secrets set");
    expect(personal).toContain("PRIVATE_BETA_DEPLOYMENT");
    expect(personal).not.toMatch(/sk-live|AIza[0-9A-Za-z_-]{20,}/);
  });
});
