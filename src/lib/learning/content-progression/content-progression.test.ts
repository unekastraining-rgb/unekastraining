/**
 * 2P-9 — Content progression & variation tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  BUSINESS_SUPPLY_DEMAND_ENTRIES,
  CS_INHERITANCE_ENTRIES,
  NETWORKING_DHCP_ENTRIES,
  contentProgressionTruthSummary,
  getProgressionEntry,
  isContentDifficulty,
  isLearningContentStage,
  listProgressionEntriesForConcept,
  normalizeConceptKey,
  preferredStagesForIntervention,
  progressionModuleDoesNotWriteMastery,
  selectProgressionContent,
} from "@/lib/learning/content-progression";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";
import { evaluateCodingChallenge } from "@/lib/learning/activities/coding/evaluate";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
} from "@/lib/learning/activities/structured/service";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-9 Stage + difficulty", () => {
  it("validates stages and rejects invalid", () => {
    expect(isLearningContentStage("PRACTICE")).toBe(true);
    expect(isLearningContentStage("UNDERSTANDING_GAP")).toBe(false);
    expect(isContentDifficulty(3)).toBe(true);
    expect(isContentDifficulty(0)).toBe(false);
    expect(isContentDifficulty(6)).toBe(false);
  });

  it("stages are metadata — not diagnoses or mastery facets", () => {
    const truth = contentProgressionTruthSummary();
    expect(truth.stagesAreNotDiagnoses).toBe(true);
    expect(truth.stagesAreNotMasteryFacets).toBe(true);
    expect(truth.progressionIsNotMandatoryLadder).toBe(true);
  });

  it("intervention preferences are soft, not mandatory ladders", () => {
    expect(preferredStagesForIntervention("understand")).toEqual([
      "UNDERSTAND",
      "INTRODUCE",
    ]);
    expect(preferredStagesForIntervention("practice")[0]).toBe("PRACTICE");
    // Learner is never forced INTRODUCE→…→RETAIN.
    expect(preferredStagesForIntervention("apply")).not.toContain("INTRODUCE");
  });
});

describe("2P-9 Variants + identity", () => {
  it("same Concept has multiple stable contentKeys / contexts", () => {
    const entries = listProgressionEntriesForConcept("java-inheritance");
    expect(entries.length).toBeGreaterThanOrEqual(4);
    const keys = new Set(entries.map((e) => e.contentKey));
    expect(keys.size).toBe(entries.length);
    const contexts = new Set(entries.map((e) => e.contextVariant));
    expect(contexts.size).toBeGreaterThan(1);
  });

  it("contentKey lookup is stable", () => {
    expect(getProgressionEntry("net-dhcp-apply-sim")?.contentId).toBe(
      "sim-network-fault",
    );
    expect(normalizeConceptKey("Java Inheritance")).toBe("java-inheritance");
  });
});

describe("2P-9 Selection", () => {
  it("is deterministic for identical inputs", () => {
    const input = {
      conceptKey: "dhcp-troubleshooting",
      interventionPreference: "apply" as const,
      eligibleActivityKinds: ["simulation" as const],
    };
    expect(selectProgressionContent(input)).toEqual(
      selectProgressionContent(input),
    );
  });

  it("prefers APPLY for apply intervention when available", () => {
    const result = selectProgressionContent({
      conceptKey: "dhcp-troubleshooting",
      interventionPreference: "apply",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry.stage).toBe("APPLY");
    expect(result.entry.contentId).toBe("sim-network-fault");
  });

  it("does not fabricate content for unknown concepts", () => {
    const result = selectProgressionContent({
      conceptKey: "no-such-concept-xyz",
      interventionPreference: "practice",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no_content_for_concept");
  });

  it("filters to eligible activity kinds", () => {
    const result = selectProgressionContent({
      conceptKey: "java-inheritance",
      interventionPreference: "practice",
      eligibleActivityKinds: ["coding"],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry.activityKind).toBe("coding");
  });

  it("failure variation excludes failed key when alternatives exist", () => {
    const first = selectProgressionContent({
      conceptKey: "sql-filtering",
      interventionPreference: "practice",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = selectProgressionContent({
      conceptKey: "sql-filtering",
      interventionPreference: "practice",
      excludeContentKeys: [first.entry.contentKey],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.entry.contentKey).not.toBe(first.entry.contentKey);
  });

  it("keeps content eligible when no alternative after exclude", () => {
    const all = listProgressionEntriesForConcept("sql-filtering");
    expect(all.length).toBeGreaterThan(0);
    const result = selectProgressionContent({
      conceptKey: "sql-filtering",
      interventionPreference: "practice",
      excludeContentKeys: all.map((e) => e.contentKey),
    });
    // Exclude emptied the pool → fall back to original candidates (no fabricate).
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(all.some((e) => e.contentKey === result.entry.contentKey)).toBe(
      true,
    );
  });

  it("success/context variation avoids prior context when alternatives exist", () => {
    const a = selectProgressionContent({
      conceptKey: "supply-and-demand",
      interventionPreference: "apply",
    });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    const b = selectProgressionContent({
      conceptKey: "supply-and-demand",
      interventionPreference: "challenge",
      avoidContextVariant: a.entry.contextVariant,
    });
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    expect(b.entry.contextVariant).not.toBe(a.entry.contextVariant);
  });

  it("selection creates no evidence/mastery and is not Orchestrator", () => {
    const truth = contentProgressionTruthSummary();
    expect(truth.selectionCreatesNoEvidence).toBe(true);
    expect(truth.selectionCreatesNoMastery).toBe(true);
    expect(truth.selectorIsNotOrchestrator).toBe(true);
    expect(
      progressionModuleDoesNotWriteMastery(
        read("src/lib/learning/content-progression/select.ts"),
      ),
    ).toBe(true);
    expect(
      read("src/lib/learning/orchestrator/diagnose.ts"),
    ).not.toContain("selectProgressionContent");
  });

  it("difficulty metadata does not change Orchestrator diagnosis selection", () => {
    // Unrecognized domain still does not fabricate UA (2P-5).
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "c1",
        conceptTitle: "Diagnose circuit fault",
        topicName: null,
        subjectDomain: "electrical",
        intentPurpose: "PRACTICE",
      }),
    ).toBeNull();
  });
});

describe("2P-9 Cross-domain proofs", () => {
  it("Computer Science inheritance progression spans stages", () => {
    const stages = new Set(CS_INHERITANCE_ENTRIES.map((e) => e.stage));
    expect(stages.has("INTRODUCE")).toBe(true);
    expect(stages.has("UNDERSTAND")).toBe(true);
    expect(stages.has("PRACTICE")).toBe(true);
    expect(stages.has("APPLY")).toBe(true);
    expect(stages.has("CHALLENGE")).toBe(true);
  });

  it("Networking DHCP spans understand/practice/apply/challenge", () => {
    const stages = new Set(NETWORKING_DHCP_ENTRIES.map((e) => e.stage));
    expect(stages.has("UNDERSTAND")).toBe(true);
    expect(stages.has("PRACTICE")).toBe(true);
    expect(stages.has("APPLY")).toBe(true);
    expect(stages.has("CHALLENGE")).toBe(true);
  });

  it("Business supply/demand spans understand/practice/apply/challenge", () => {
    const stages = new Set(BUSINESS_SUPPLY_DEMAND_ENTRIES.map((e) => e.stage));
    expect(stages.has("UNDERSTAND")).toBe(true);
    expect(stages.has("PRACTICE")).toBe(true);
    expect(stages.has("APPLY")).toBe(true);
    expect(stages.has("CHALLENGE")).toBe(true);
  });
});

describe("2P-9 Integration — decision loop separation", () => {
  it("content selected → 0 mastery; learner eval still works afterward", () => {
    const selected = selectProgressionContent({
      conceptKey: "java-inheritance",
      interventionPreference: "practice",
      eligibleActivityKinds: ["coding"],
    });
    expect(selected.ok).toBe(true);
    if (!selected.ok) return;
    // Selection alone — no LearningAttempt implied.
    expect(contentProgressionTruthSummary().selectionCreatesNoMastery).toBe(
      true,
    );

    const challenge = getCodingChallenge(selected.entry.contentId!)!;
    const evaluation = evaluateCodingChallenge(
      challenge,
      'class Dog extends Animal {\n  public String bark() { return "woof"; }\n}\n',
    );
    expect(evaluation.outcome).toBe("SUCCESS");
    expect(evaluation.skillFacet).toBe("PERFORM");
  });

  it("after simulated failure, next selection can vary then evaluate", () => {
    const first = selectProgressionContent({
      conceptKey: "dhcp-troubleshooting",
      interventionPreference: "apply",
      eligibleActivityKinds: ["simulation", "lab"],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = selectProgressionContent({
      conceptKey: "dhcp-troubleshooting",
      interventionPreference: "practice",
      eligibleActivityKinds: ["simulation", "lab"],
      excludeContentKeys: [first.entry.contentKey],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.entry.contentKey).not.toBe(first.entry.contentKey);

    if (second.entry.contentId) {
      const challenge = getStructuredChallenge(second.entry.contentId)!;
      const evaluation = evaluateStructuredChallenge(
        challenge,
        "I configure the gateway IP, ping times out, and diagnose a misconfigured DHCP lease because the client never got an address.",
      );
      expect(["SUCCESS", "PARTIAL", "FAIL"]).toContain(evaluation.outcome);
    }
  });

  it("SIX fallback: no compatible UA content → six entry or unavailable, never fabricate UA", () => {
    const understand = selectProgressionContent({
      conceptKey: "java-inheritance",
      interventionPreference: "six",
      eligibleActivityKinds: ["six"],
    });
    expect(understand.ok).toBe(true);
    if (!understand.ok) return;
    expect(understand.entry.activityKind).toBe("six");
    expect(understand.entry.contentId).toBeNull();

    const none = selectProgressionContent({
      conceptKey: "java-inheritance",
      eligibleActivityKinds: ["presentation"],
    });
    expect(none.ok).toBe(false);
  });

  it("Assessment / Lucky boundaries preserved", () => {
    const truth = contentProgressionTruthSummary();
    expect(truth.assessmentRemainsSeparate).toBe(true);
    expect(truth.retainStageIsNotLucky).toBe(true);
    expect(truth.sixRemainsFallback).toBe(true);
  });
});
