/**
 * 2P-47 — Universal creation & artifact learning depth.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  artifactVsEvidenceTruthSummary,
  presentationDemonstrationHonesty,
  interpretCreationEvidenceNote,
  creationActivityTruthSummary,
  separateAiAssistanceFromEvidence,
  isCreationActivityKind,
} from "@/lib/learning/creation";
import { evaluateStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { rankActivityInterventionCandidates } from "@/lib/learning/orchestrator/activity-intervention-ranking";
import { getActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";
import { getActivityAdaptiveCompletionContract } from "@/lib/learning/sequence/activity-adaptive-completion";
import { presentLearnerGrowthContinuity } from "@/lib/learning/learner-growth";
import { presentGrowthCenter } from "@/lib/learning/learner-model/present-growth-center";
import { presentLearnerModelVisibility } from "@/lib/learning/mastery/present-learner-model";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("2P-47 artifact vs evidence", () => {
  it("truth: draft/AI/open are not mastery; no creation engines", () => {
    const t = artifactVsEvidenceTruthSummary();
    expect(t.openIsNotEvidence).toBe(true);
    expect(t.aiSuggestionIsNotLearnerEvidence).toBe(true);
    expect(t.saveDraftIsNotMastery).toBe(true);
    expect(t.artifactCompletionEqualsMastery).toBe(false);
    expect(t.inventsWritingEngine).toBe(false);
    expect(t.inventsProjectEngine).toBe(false);
    expect(t.inventsPresentationEngine).toBe(false);
    expect(t.inventsCreationGap).toBe(false);
    expect(creationActivityTruthSummary().luckyUnchanged).toBe(true);
  });

  it("AI-only text is not learner evidence", () => {
    const sep = separateAiAssistanceFromEvidence({
      learnerText: "",
      aiAssistance: "Fully AI-authored essay about HTTPS.",
    });
    expect(sep.evidenceText).toBe("");
    expect(sep.aiAssistance).toContain("AI-authored");
  });

  it("learner text remains evidence when AI help is separate", () => {
    const sep = separateAiAssistanceFromEvidence({
      learnerText: "HTTPS encrypts the channel between client and server.",
      aiAssistance: "AI brainstorm notes",
    });
    expect(sep.evidenceText).toContain("HTTPS");
    expect(sep.evidenceText).not.toContain("brainstorm");
  });
});

describe("2P-47 writing / project / presentation", () => {
  it("creation kinds are recognized", () => {
    expect(isCreationActivityKind("writing")).toBe(true);
    expect(isCreationActivityKind("project")).toBe(true);
    expect(isCreationActivityKind("presentation")).toBe(true);
    expect(isCreationActivityKind("coding")).toBe(false);
  });

  it("project AI-only submit path yields empty artifact after strip", () => {
    const challenge = getStructuredChallenge("project-study-plan");
    expect(challenge?.kind).toBe("project");
    // Empty learner text after strip → rubric FAIL, still evaluation details.
    const evaluation = evaluateStructuredChallenge(challenge!, "");
    expect(evaluation.outcome).toBe("FAIL");
  });

  it("presentation honesty: outline ≠ speaking evidence claim", () => {
    const h = presentationDemonstrationHonesty();
    expect(h.outlineTextIsNotSpeakingEvidence).toBe(true);
    expect(h.noSpeechQualityScoring).toBe(true);
    const primary = getStructuredChallenge("presentation-primary-source-talk");
    expect(primary?.asPerform).toBe(false);
    expect(primary?.skillFacet).toBe("EXPLAIN");
  });

  it("Adaptive writing accepts EXPLAIN/APPLY/SOLVE/RETAIN", () => {
    const contract = getActivityAdaptiveCompletionContract("writing");
    expect(contract?.requiredSkillFacets).toEqual(
      expect.arrayContaining(["EXPLAIN", "APPLY", "SOLVE", "RETAIN"]),
    );
    const presentation = getActivityAdaptiveCompletionContract("presentation");
    expect(presentation?.requiredSkillFacets).toContain("EXPLAIN");
    expect(presentation?.requiredSkillFacets).toContain("PERFORM");
  });
});

describe("2P-47 Orchestrator soft creation prefer", () => {
  it("preferCreationProducers ranks writing/project ahead when tied", () => {
    const writing = getActivityInterventionCapability("writing");
    const coding = getActivityInterventionCapability("coding");
    expect(writing).toBeTruthy();
    expect(coding).toBeTruthy();
    const equalCompat = {
      status: "MATCH" as const,
      strength: 1 as const,
      matchedTokens: ["x"],
      reason: "title_topic_cue_match",
    };
    const ranked = rankActivityInterventionCandidates(
      [
        { capability: coding!, compatibility: equalCompat },
        { capability: writing!, compatibility: equalCompat },
      ],
      { preferCreationProducers: true },
    );
    expect(ranked[0]?.capability.adapterKey).toBe("writing");
  });

  it("diagnose wires preferCreationProducers; no CREATION_GAP", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("preferCreationProducers");
    expect(diagnose).not.toContain("CREATION_GAP");
    expect(
      read("src/lib/learning/orchestrator/activity-intervention-ranking.ts"),
    ).toContain("softPrefersCreationProducers");
  });
});

describe("2P-47 Growth + wiring", () => {
  it("creation evidence notes are truthful", () => {
    expect(
      interpretCreationEvidenceNote({
        sourceKind: "writing_challenge_submit",
        outcome: "SUCCESS",
      }),
    ).toMatch(/written explanation/i);
    expect(
      interpretCreationEvidenceNote({
        sourceKind: "writing_challenge_submit",
        outcome: "SUCCESS",
        requiresRevision: true,
      }),
    ).toMatch(/revised/i);
    expect(
      interpretCreationEvidenceNote({
        sourceKind: "presentation_challenge_submit",
        outcome: "SUCCESS",
      }),
    ).toMatch(/not a scored speech/i);
  });

  it("Growth continuity can surface creation note without forever mastery", () => {
    const visibility = presentLearnerModelVisibility([
      {
        conceptId: "c-write",
        conceptTitle: "Argument writing",
        recentlyUpdated: true,
        conceptMastery: {
          recognize: 0.4,
          explain: 0.55,
          apply: 0.4,
          solve: 0.3,
          perform: 0.3,
          retain: 0.3,
          confidence: 0.4,
          reviewCount: 2,
        },
      },
    ]);
    const growth = presentGrowthCenter({ visibility });
    const continuity = presentLearnerGrowthContinuity({
      growth,
      creationContinuityNote:
        "You demonstrated this skill through a written explanation.",
    });
    expect(
      continuity.continuityNotes.some((n) => /written explanation/i.test(n)),
    ).toBe(true);
    expect(JSON.stringify(continuity)).not.toMatch(/forever|mastered everywhere/i);
  });

  it("ActivityWorkspace shows rubric feedback; structured submit strips AI", () => {
    const ui = read("src/components/study/ActivityWorkspace.tsx");
    expect(ui).toContain("data-activity-rubric-feedback");
    expect(ui).toContain("data-activity-revision-guidance");
    expect(ui).toContain("X-Idempotency-Key");
    const service = read(
      "src/lib/learning/activities/structured/service.ts",
    );
    expect(service).toContain("separateAiAssistanceFromEvidence");
    expect(service).toContain("presentationHonesty");
  });

  it("LUCKY unchanged — no WritingRetention", () => {
    expect(read("src/lib/learning/retention/review.ts")).not.toContain(
      "WritingRetention",
    );
    expect(read("src/lib/learning/retention/review.ts")).not.toContain(
      "ProjectRetention",
    );
  });
});
