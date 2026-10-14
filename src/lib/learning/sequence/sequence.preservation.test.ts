/**
 * Phase 2G-2 preservation — sequence run must not wire into product surfaces
 * or mutate authoritative ULE engines.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-2 AdaptiveSequenceRun preservation", () => {
  it("does not connect sequence run to Study Hub / SIX / CORE / LUCKY / Tutor UI", () => {
    const studyHub = read("app/study/study-hub-view.tsx");
    expect(studyHub).not.toMatch(/AdaptiveSequenceRun|createAdaptiveSequenceRun/);

    const sixPage = read("app/study/six/[component]/page.tsx");
    expect(sixPage).not.toMatch(/AdaptiveSequenceRun|createAdaptiveSequenceRun/);

    const corePage = read("app/core/page.tsx");
    expect(corePage).not.toMatch(/AdaptiveSequenceRun|createAdaptiveSequenceRun/);

    const lucky = read("app/study/lucky/lucky-engine-view.tsx");
    expect(lucky).not.toMatch(/AdaptiveSequenceRun|createAdaptiveSequenceRun/);

    const tutorService = read("src/lib/learning/tutor/service.ts");
    expect(tutorService).not.toMatch(/AdaptiveSequenceRun|createAdaptiveSequenceRun/);
  });

  it("does not call Orchestrator, recordEvidence, or mastery from sequence service", () => {
    const service = read("src/lib/learning/sequence/service.ts");
    expect(service).not.toMatch(
      /orchestrateForConcept|orchestrateFromLearnerState|recordEvidence|applyEvidenceToMastery|upsertRetentionItem|createStudySession/,
    );
    expect(service).toContain("lastAttemptId");
    expect(service).toMatch(/scalar|pointer|no FK|never cascaded/i);
  });

  it("does not add public sequence API routes in 2G-2", () => {
    expect(
      existsSync(
        path.join(process.cwd(), "app/api/learning/sequence/route.ts"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        path.join(process.cwd(), "app/api/study/adaptive-sequence/route.ts"),
      ),
    ).toBe(false);
  });

  it("schema stores lastAttemptId as scalar without LearningAttempt FK", () => {
    const schema = read("prisma/schema.prisma");
    const modelBlock = schema.slice(
      schema.indexOf("model AdaptiveSequenceRun"),
      schema.indexOf("enum RetentionSourceType"),
    );
    expect(modelBlock).toContain("lastAttemptId");
    expect(modelBlock).toContain("String?");
    // No Prisma relation field or FK to LearningAttempt — scalar pointer only.
    expect(modelBlock).not.toMatch(/lastAttempt\s+LearningAttempt/);
    expect(modelBlock).not.toMatch(/@relation\(.*LearningAttempt/);
    expect(modelBlock).toMatch(/user\s+User/);
    expect(modelBlock).toMatch(/concept\s+Concept/);

    const migration = read(
      "prisma/migrations/20260918180000_adaptive_sequence_run/migration.sql",
    );
    expect(migration).toContain('"lastAttemptId" TEXT');
    expect(migration).not.toMatch(/lastAttemptId_fkey|REFERENCES "LearningAttempt"/);
  });

  it("keeps LearningAttempt create-only evidence path untouched by sequence", () => {
    const record = read("src/lib/learning/evidence/record.ts");
    expect(record).toContain("learningAttempt.create");
    expect(record).not.toMatch(/AdaptiveSequenceRun|adaptiveSequenceRun/);
  });
});
