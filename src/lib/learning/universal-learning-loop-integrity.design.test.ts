/**
 * Phase 2G-66 — Universal Learning Loop Integrity Audit (inspection).
 * Freezes claims from UNIVERSAL_LEARNING_LOOP_INTEGRITY_AUDIT.md.
 * No production behavior changes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-66 Universal Learning Loop Integrity Audit (inspection)", () => {
  const audit = read(
    "src/lib/learning/UNIVERSAL_LEARNING_LOOP_INTEGRITY_AUDIT.md",
  );

  it("1. audit recommends exactly one next phase (2G-67 Tutor evidenceIntent)", () => {
    expect(audit).toContain("INSPECTION / DESIGN ONLY");
    expect(audit).toContain("2G-67 — Tutor evidenceIntent integrity hardening");
    expect(audit).toContain("**2G-66 PASS**");
    expect(audit).toMatch(/### P0/);
    expect(audit).toContain("client `evidenceIntent`");
    // Exactly one recommended next phase section
    expect(audit.match(/## 20\. ONE recommended next phase/g)?.length).toBe(1);
  });

  it("2. ConceptMastery ordering and Hub truth boundary remain in place", () => {
    const suggest = read("src/lib/learning/orchestrator/suggest.ts");
    expect(suggest).toContain("orderCandidatesByConceptMastery");
    expect(suggest).toContain("conceptMastery.findMany");
    expect(suggest).not.toContain("proficiency");

    const summary = read(
      "src/lib/learning/orchestrator/present-mastery-summary.ts",
    );
    expect(summary).toContain("Never reads TopicMastery");
  });

  it("3. LUCKY handoff only after Adaptive COMPLETE; abandon path has no sync", () => {
    const coordinator = read("src/lib/learning/sequence/coordinator.ts");
    expect(coordinator).toContain("completeAdaptiveSequence");
    expect(coordinator).toContain("syncLuckyRetentionAfterSequenceComplete");

    const abandon = read("app/api/study/adaptive/[runId]/abandon/route.ts");
    expect(abandon).not.toContain("syncLuckyRetentionAfterSequenceComplete");
  });

  it("4. ASSESS does not become Quiz inside diagnosis; soft intent preserved", () => {
    const preference = read("src/lib/learning/orchestrator/intent-preference.ts");
    expect(preference).toMatch(/ASSESS|assess/i);

    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("preferSixWithIntent");
    expect(diagnose).not.toMatch(/diagnosis\s*===\s*[\"']ASSESS[\"']/);
  });

  it("5. Tutor foundation route strips client evidenceIntent (2G-67)", () => {
    const route = read("app/api/study/tutor/route.ts");
    expect(route).toContain('evidenceIntent: "none"');
    expect(route).toContain("evidenceAuthorizedByServer: false");
    expect(route).toContain("clientEvidenceIntentRequest");
    expect(route).not.toMatch(/evidenceIntent:\s*body\.evidenceIntent/);
    expect(audit).toContain("P0");
    expect(audit).toContain("Tutor foundation");
  });

  it("6. CORE Assist adapter forces evidenceIntent none", () => {
    const core = read("src/lib/learning/tutor/core-adapter.ts");
    expect(core).toContain('evidenceIntent: "none"');
  });

  it("7. code-evaluate remains TopicMastery-only (L4 extensibility gap)", () => {
    const codeEval = read("app/api/study/code-evaluate/route.ts");
    expect(codeEval).toContain("updateTopicMastery");
    expect(codeEval).not.toMatch(/recordEvidence|applyEvidenceToMastery/);
    expect(audit).toContain("code-evaluate");
  });
});
