/**
 * Phase 2G-64 — Orchestrator Candidate Truth Audit (inspection archive).
 * Freezes claims from ORCHESTRATOR_CANDIDATE_TRUTH_AUDIT.md.
 * Live ranking behavior is superseded by 2G-65 (see candidate-ordering.test.ts).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-64 Orchestrator Candidate Truth Audit (inspection archive)", () => {
  const audit = read(
    "src/lib/learning/ORCHESTRATOR_CANDIDATE_TRUTH_AUDIT.md",
  );

  it("1. audit recommended Option B; documented TopicMastery ranking leak", () => {
    expect(audit).toContain("Option B");
    expect(audit).toContain("Topic discovery, Concept ordering");
    expect(audit).toContain("Topic-first with Concept mapping");
    expect(audit).toContain("T3");
    expect(audit).toContain("priority / selection truth leak");
    expect(audit).toContain("INSPECTION / DESIGN ONLY");
    expect(audit).toContain("no production behavior changes");
    expect(audit).toMatch(/Scenario A[\s\S]*\*\*Yes\.\*\*/);
    expect(audit).toMatch(/Scenario E[\s\S]*\*\*No\.\*\*/);
    expect(audit).not.toMatch(/average TopicMastery and ConceptMastery/);
  });

  it("2. Hub entry path documented in audit remains valid", () => {
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    const route = read("app/api/study/orchestrator-suggestion/route.ts");
    const suggest = read("src/lib/learning/orchestrator/suggest.ts");
    expect(card).toContain("/api/study/orchestrator-suggestion");
    expect(route).toContain("getTopOrchestratorSuggestion");
    expect(suggest).toContain("export async function getTopOrchestratorSuggestion");
    expect(suggest).toContain("ensureConceptForTopic");
    expect(suggest).toContain("orchestrateForConcept");
  });
});
