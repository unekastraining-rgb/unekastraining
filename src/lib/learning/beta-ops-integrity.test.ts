/**
 * Controlled-beta ops integrity — feedback ≠ evidence; health/logging present.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("beta ops integrity", () => {
  it("Study Hub mounts front-door CTAs and feedback widget", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).toContain("data-beta-start-learning");
    expect(center).toContain("data-hub-learning-front-door");
    expect(center).toContain("What are you here to learn?");
    expect(hub).toContain("BetaFeedbackWidget");
    expect(hub).toContain('surface="study-hub"');
  });

  it("feedback API never writes LearningAttempt / ConceptMastery", () => {
    const route = read("app/api/beta/feedback/route.ts");
    const lib = read("src/lib/beta/feedback.ts");
    expect(route + lib).toContain("createBetaFeedback");
    expect(route + lib).toContain("db.betaFeedback.create");
    expect(route + lib).not.toMatch(/db\.learningAttempt\.create|db\.conceptMastery\./);
    expect(lib).toContain("doesNotUpdateConceptMastery");
  });

  it("ops health endpoint exists and omits secret values", () => {
    const route = read("app/api/ops/health/route.ts");
    const lib = read("src/lib/ops/health.ts");
    expect(route).toContain("runHealthCheck");
    expect(lib).toContain("sessionSecretConfigured");
    expect(lib).toContain("databaseUrlConfigured");
    // Presence flags only — never return env values in the report object
    expect(lib).toMatch(/sessionSecretConfigured:\s*Boolean\(/);
    expect(lib).toMatch(/databaseUrlConfigured:\s*Boolean\(/);
    expect(route).not.toMatch(/SESSION_SECRET|DATABASE_URL/);
  });

  it("structured ops events cover auth/activity/adaptive/core/ai/lms", () => {
    const log = read("src/lib/ops/safe-log.ts");
    for (const event of [
      "auth.failure",
      "activity.failure",
      "adaptive.failure",
      "core.save.conflict",
      "ai.provider.failure",
      "lms.sync.failure",
      "server.error",
      "beta.feedback.created",
      "ops.health.check",
    ]) {
      expect(log).toContain(`"${event}"`);
    }
  });
});
