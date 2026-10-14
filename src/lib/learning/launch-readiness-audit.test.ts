/**
 * Private beta launch-readiness audit — contracts only.
 * Does not deploy; does not read live Fly secrets.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("private beta launch-readiness audit", () => {
  it("version agreement: package + RELEASE_NOTES + PRIVATE_BETA_DEPLOYMENT", () => {
    const pkg = JSON.parse(read("package.json")) as { version: string };
    expect(pkg.version).toBe("0.2.0-beta.1");
    const notes = read("RELEASE_NOTES.md");
    const deploy = read("src/lib/learning/PRIVATE_BETA_DEPLOYMENT.md");
    expect(notes).toContain("0.2.0-beta.1");
    expect(deploy).toContain("0.2.0-beta.1");
    expect(notes).toMatch(/PRIVATE \/ CONTROLLED LIMITED BETA/i);
    expect(notes).toMatch(/Not ready for/i);
    expect(notes).toMatch(/public multi-tenant SaaS/i);
    expect(deploy).toContain("NOT READY");
  });

  it("entrypoint prefers migrate deploy; no default accept-data-loss", () => {
    const sh = read("scripts/docker-entrypoint.sh");
    expect(sh).toContain("prisma migrate deploy");
    expect(sh).toContain("ALLOW_DB_DATA_LOSS");
    expect(sh).toMatch(/db push \(no data-loss flag\)/);
    // Destructive path only behind explicit opt-in branch
    expect(sh).toMatch(
      /ALLOW_DB_DATA_LOSS[^\n]*\n[^\n]*accept-data-loss/,
    );
  });

  it("documents P3005 as local/baselining — production migrate path unchanged", () => {
    const deploy = read("src/lib/learning/PRIVATE_BETA_DEPLOYMENT.md");
    expect(deploy).toContain("P3005");
    expect(deploy).toMatch(/local\/baselining|local.*baselining/i);
    expect(deploy).toContain("Do not change the entrypoint");
    expect(deploy).toContain("Baselining");
  });

  it("Fly volume + DATA_DIR persistence contract", () => {
    const fly = read("fly.toml");
    expect(fly).toContain('DATA_DIR = \'/data\'');
    expect(fly).toContain("file:/data/dev.db");
    expect(fly).toContain("studyhaul_data");
    expect(fly).toContain("force_https");
  });

  it("health is presence-flags only; feedback stays off evidence chain", () => {
    const health = read("src/lib/ops/health.ts");
    expect(health).toContain("sessionSecretConfigured");
    expect(health).toMatch(/sessionSecretConfigured:\s*Boolean\(/);
    expect(health).not.toMatch(/checks\.sessionSecretConfigured\s*=\s*process\.env\.SESSION_SECRET[^&]/);
    const feedback = read("src/lib/beta/feedback.ts");
    expect(feedback).toContain("db.betaFeedback.create");
    expect(feedback).not.toMatch(/db\.learningAttempt\.create|db\.conceptMastery\./);
    expect(feedback).toContain("doesNotUpdateConceptMastery");
  });

  it("restore drill honesty: documented but live restore not claimed verified", () => {
    const deploy = read("src/lib/learning/PRIVATE_BETA_DEPLOYMENT.md");
    const notes = read("RELEASE_NOTES.md");
    expect(deploy).toContain("NOT VERIFIED");
    expect(notes).toMatch(/restore drill|NOT VERIFIED/i);
  });
});
