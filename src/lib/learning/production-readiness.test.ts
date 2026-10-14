/**
 * 2P-51 — Production readiness integrity (additive surface checks).
 * Does not invent engines; verifies security / persistence / CI wiring.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import {
  artifactPersistenceEvidenceBoundary,
} from "@/lib/learning/artifact-persistence";
import {
  SCHOOL_LMS_EVIDENCE_BOUNDARY,
} from "@/lib/learning/school-lms";
import {
  loginRateLimitTruthSummary,
} from "@/lib/api/simple-rate-limit";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("2P-51 production configuration integrity", () => {
  it("CI workflow and npm ci script exist", () => {
    expect(existsSync(".github/workflows/ci.yml")).toBe(true);
    const pkg = JSON.parse(read("package.json")) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.ci).toBeTruthy();
    expect(pkg.scripts?.["test:learning"]).toContain("src/lib/learning");
    const ci = read(".github/workflows/ci.yml");
    expect(ci).toContain("prisma validate");
    expect(ci).toContain("tsc --noEmit");
    expect(ci).toContain("npm run build");
    expect(ci).not.toMatch(/GEMINI_API_KEY:\s*['\"]?AIza/);
  });

  it("SESSION_SECRET is required in production paths", () => {
    const token = read("src/lib/auth/session-token.ts");
    expect(token).toContain('NODE_ENV === "production"');
    expect(token).toContain("SESSION_SECRET must be set");
    expect(token).toContain("dev-insecure-session-secret-change-me");
  });

  it("docker entrypoint does not default to accept-data-loss", () => {
    const sh = read("scripts/docker-entrypoint.sh");
    expect(sh).toContain("migrate deploy");
    expect(sh).toContain("ALLOW_DB_DATA_LOSS");
    expect(sh).toContain("Using prisma db push (no data-loss flag)");
  });

  it("login route has rate limit and ignores nothing unsafe in JSON user fields", () => {
    const login = read("app/api/auth/login/route.ts");
    expect(login).toContain("checkSimpleRateLimit");
    expect(login).toContain("429");
    expect(login).not.toMatch(/password|bcrypt/i);
    expect(loginRateLimitTruthSummary().loginGuarded).toBe(true);
  });

  it(".env.example documents SESSION_SECRET without committing real secrets", () => {
    const env = read(".env.example");
    expect(env).toContain("SESSION_SECRET");
    expect(env).not.toMatch(/sk-live|AIza[0-9A-Za-z_-]{20,}/);
  });
});

describe("2P-51 learning / artifact / LMS evidence boundaries", () => {
  it("notes and projects APIs do not write LearningAttempt", () => {
    expect(read("app/api/notes/[id]/route.ts")).not.toMatch(
      /recordEvidence|LearningAttempt|ConceptMastery/,
    );
    expect(read("app/api/projects/route.ts")).toContain("createsEvidence: false");
    expect(read("app/api/projects/route.ts")).toContain("void body?.userId");
  });

  it("LMS sync and calendar never invent mastery", () => {
    expect(SCHOOL_LMS_EVIDENCE_BOUNDARY.lmsSyncCreatesConceptMastery).toBe(
      false,
    );
    expect(
      SCHOOL_LMS_EVIDENCE_BOUNDARY.assignmentStatusChangeCreatesLearningAttempt,
    ).toBe(false);
    expect(SCHOOL_LMS_EVIDENCE_BOUNDARY.calendarEventCreatesLearningAttempt).toBe(
      false,
    );
  });

  it("artifact persistence remains outside automatic evidence", () => {
    const b = artifactPersistenceEvidenceBoundary();
    expect(b.editIsNotEvidence).toBe(true);
    expect(b.autosaveIsNotEvidence).toBe(true);
    expect(b.serverBackedIsAuthoritative).toBe(true);
    expect(b.inventsArtifactMastery).toBe(false);
  });

  it("Adaptive start ignores client learnerId/userId", () => {
    const start = read("app/api/study/adaptive/start/route.ts");
    expect(start).toContain("void body?.userId");
    expect(start).toContain("void body?.learnerId");
    expect(start).toContain("getOrCreateDefaultUser");
  });
});

describe("2P-51 accessibility surface smoke (additive)", () => {
  it("ProjectFileNavigator exposes labels and confirmation delete", () => {
    const nav = read("src/components/core/ProjectFileNavigator.tsx");
    expect(nav).toContain("aria-label");
    expect(nav).toContain("confirm(");
    expect(nav).toContain("min-h-11");
  });

  it("CORE save status is announced via title/aria-label", () => {
    const ws = read("src/components/core/CoreNotesWorkspace.tsx");
    expect(ws).toContain("artifactSaveLabel");
    expect(ws).toContain("data-core-save-status");
    expect(ws).toContain("data-core-save-error");
  });
});

describe("2P-51 architecture integrity (frozen)", () => {
  it("does not invent second engines; architecture remains CORE → SIX → LUCKY", () => {
    const status = read("src/lib/learning/PRODUCTION_READINESS.md");
    expect(status).toContain("CORE → SIX → LUCKY");
    expect(status).toContain("ONE ULE");
  });
});
