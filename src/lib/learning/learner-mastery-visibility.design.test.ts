/**
 * Phase 2G-60 — Learner-Facing Mastery Visibility Audit (inspection).
 * Freezes claims from LEARNER_MASTERY_VISIBILITY_AUDIT.md.
 * No production behavior changes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { MASTERY_FACETS } from "@/lib/learning/types";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-60 Learner Mastery Visibility (inspection)", () => {
  it("1. audit artifact recommends Hub soft learning-state line; no production UI", () => {
    const audit = read(
      "src/lib/learning/LEARNER_MASTERY_VISIBILITY_AUDIT.md",
    );
    expect(audit).toContain("No production UI or API implementation");
    expect(audit).toContain(
      "Hub suggestion soft learning-state line",
    );
    expect(audit).toContain("B — SMALL ADDITIVE VISIBILITY BRIDGE");
    expect(audit).toContain("**PASS**");
    expect(audit).toContain("No E");
    expect(audit).not.toMatch(/\bXP\b.*recommend|recommend.*\bXP\b/i);
    expect(audit).toContain("EVIDENCE");
    expect(audit).toContain("MASTERY");
    expect(audit).toContain("RECOMMENDATION");
    expect(audit).toContain("REASON");
    expect(audit).toContain("RETENTION");
  });

  it("2. ConceptMastery facets exist; MasteryTree API remains TopicMastery", () => {
    expect([...MASTERY_FACETS]).toEqual([
      "RECOGNIZE",
      "EXPLAIN",
      "APPLY",
      "SOLVE",
      "PERFORM",
      "RETAIN",
    ]);

    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/model ConceptMastery[\s\S]*recognize/);
    expect(schema).toMatch(/model ConceptMastery[\s\S]*perform/);

    const masteryApi = read("app/api/mastery/route.ts");
    expect(masteryApi).toContain("masteries");
    expect(masteryApi).toContain("proficiency");
    expect(masteryApi).not.toMatch(/conceptMastery|getLearnerConceptMastery/);

    const tree = read("src/components/csl/MasteryTree.tsx");
    expect(tree).toContain("Understand");
    expect(tree).toContain("application");
    expect(tree).toContain("TOPIC_PROGRESS_LEARNER_COPY");
    expect(tree).not.toMatch(/getLearnerConceptMastery|facets\.perform/);
  });

  it("3. Hub suggestion shows ConceptMastery summary line; not TopicMastery", () => {
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("suggestion.reason");
    expect(card).toContain("suggestion.notice");
    expect(card).toContain("data-hub-mastery-summary");
    expect(card).toContain("suggestion.masterySummary");
    expect(card).not.toMatch(/TopicMastery|topicMastery|overallMastery/);

    const present = read("src/lib/learning/orchestrator/present.ts");
    expect(present).toContain("buildOrchestratorMasterySummary");
    expect(present).toContain("masterySummary");
  });

  it("4. Evidence Intelligence exists but is not a learner API payload", () => {
    const types = read("src/lib/learning/evidence/aggregation-types.ts");
    expect(types).toContain("EvidenceSignals");
    expect(types).toContain("facetOutcomes");
    expect(types).toContain("misconceptionSignals");

    const flag = read("src/lib/learning/evidence/intelligence-flag.ts");
    expect(flag).toContain("STUDY_HAUL_EVIDENCE_INTELLIGENCE");

    // No dedicated learner mastery-visibility route in assessment API.
    const assess = read("app/api/study/assessment/route.ts");
    expect(assess).toContain("getLearnerConceptMastery");
    expect(assess).not.toMatch(/facets:|evidenceSignals/);
  });

  it("5. Tutor loads mastery into context; Adaptive shell has no mastery chrome", () => {
    const tutorCtx = read("src/lib/learning/tutor/context.ts");
    expect(tutorCtx).toContain("getLearnerConceptMastery");
    expect(tutorCtx).toContain("masterySummaries");

    const adaptivePage = read("app/study/adaptive/[runId]/page.tsx");
    expect(adaptivePage).not.toMatch(/ConceptMastery|evidenceSignals|facets\./);
  });
});
