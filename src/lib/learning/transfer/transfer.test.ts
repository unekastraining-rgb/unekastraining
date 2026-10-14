/**
 * 2P-46 — Transfer & generalization (context identity + mixed-context evidence).
 * No TransferEngine / TRANSFER_GAP / seventh facet.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  parseAttemptContextIdentity,
  extractRecentContextVariants,
  extractRecentContentKeys,
  resolveTransferSelectionHints,
  transferContextIdentityTruthSummary,
  interpretMixedContextEvidence,
  mixedContextEvidenceTruthSummary,
} from "@/lib/learning/transfer";
import { resolveLearningExperience } from "@/lib/learning/experience";
import { selectProgressionContent } from "@/lib/learning/content-progression";
import { presentLearnerGrowthContinuity } from "@/lib/learning/learner-growth";
import { presentGrowthCenter } from "@/lib/learning/learner-model/present-growth-center";
import { presentLearnerModelVisibility } from "@/lib/learning/mastery/present-learner-model";
import { classifyEvidenceSufficiency } from "@/lib/learning/evidence/evidence-sufficiency";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function ref(partial: Record<string, unknown>): string {
  return JSON.stringify(partial);
}

describe("2P-46 context identity", () => {
  it("same concept + different contextVariant is distinct", () => {
    const a = parseAttemptContextIdentity(
      ref({
        kind: "math_workspace",
        contentId: "math-linear-basic",
        contentKey: "math-ws-linear-basic",
        contextVariant: "2x+4=10",
      }),
    );
    const b = parseAttemptContextIdentity(
      ref({
        kind: "math_workspace",
        contentId: "math-linear-subtract",
        contentKey: "math-ws-linear-subtract",
        contextVariant: "3x-7=11",
      }),
    );
    expect(a.contextVariant).not.toBe(b.contextVariant);
    expect(a.contentKey).not.toBe(b.contentKey);
  });

  it("unrelated concepts are not treated as transfer via empty identity", () => {
    const empty = parseAttemptContextIdentity("{not-json");
    expect(empty.contextVariant).toBeNull();
    expect(empty.contentKey).toBeNull();
  });

  it("truth summary forbids TransferEngine / TRANSFER_GAP / seventh facet", () => {
    const t = transferContextIdentityTruthSummary();
    expect(t.inventsTransferEngine).toBe(false);
    expect(t.inventsTransferGap).toBe(false);
    expect(t.inventsSeventhFacet).toBe(false);
    expect(t.conceptEqualsActivitySurface).toBe(false);
  });
});

describe("2P-46 selection hints", () => {
  it("soft-avoids recent contextVariant and content keys deterministically", () => {
    const attempts = [
      {
        sourceRefJson: ref({
          contextVariant: "2x+4=10",
          contentKey: "math-ws-linear-basic",
          contentId: "math-linear-basic",
        }),
        outcome: "SUCCESS",
      },
      {
        sourceRefJson: ref({
          contextVariant: "3x-7=11",
          contentKey: "math-ws-linear-subtract",
          contentId: "math-linear-subtract",
        }),
        outcome: "FAIL",
      },
    ];
    const hints = resolveTransferSelectionHints(attempts);
    expect(hints.avoidContextVariant).toBe("2x+4=10");
    expect(hints.excludeContentKeys).toContain("math-ws-linear-basic");
    expect(hints.excludeContentKeys).toContain("math-linear-basic");
    expect(hints.hasMultiContextEvidence).toBe(true);
    expect(resolveTransferSelectionHints(attempts)).toEqual(hints);
    expect(extractRecentContextVariants(attempts)).toEqual([
      "2x+4=10",
      "3x-7=11",
    ]);
    expect(extractRecentContentKeys(attempts).length).toBeGreaterThan(0);
  });

  it("resolveLearningExperience prefers alternate context when avoid is set", () => {
    const first = resolveLearningExperience({
      conceptId: "c1",
      conceptTitle: "Linear equation solving",
      activityKind: "math",
    });
    expect(first.recommendedContentId).toBeTruthy();
    const second = resolveLearningExperience({
      conceptId: "c1",
      conceptTitle: "Linear equation solving",
      activityKind: "math",
      avoidContextVariant: "2x+4=10 workspace",
      excludeContentKeys: ["math-ws-linear-basic", "math-linear-basic"],
    });
    expect(second.recommendedContentId).toBeTruthy();
    expect(second.recommendedContentId).not.toBe(first.recommendedContentId);
  });

  it("selectProgressionContent soft-falls back when only one context exists", () => {
    const only = selectProgressionContent({
      conceptKey: "linear-equation-solving",
      eligibleActivityKinds: ["math"],
      excludeContentKeys: [
        "math-ws-linear-basic",
        "math-ws-linear-subtract",
        "math-ws-linear-distribute",
        "math-ws-linear-both-sides",
        "math-ws-linear-retain",
      ],
      avoidContextVariant: "2x+4=10 workspace",
    });
    // Soft fallback restores pool — still ok with a candidate.
    expect(only.ok).toBe(true);
  });
});

describe("2P-46 mixed-context evidence", () => {
  it("single context success → limited transfer reading", () => {
    const reading = interpretMixedContextEvidence([
      {
        outcome: "SUCCESS",
        sourceRefJson: ref({ contextVariant: "A", contentKey: "k-a" }),
      },
    ]);
    expect(reading.reading).toBe("single_context_success");
    expect(reading.learnerSafeLine).toMatch(/one context/i);
  });

  it("success A / success B → cross_context_success", () => {
    const reading = interpretMixedContextEvidence([
      {
        outcome: "SUCCESS",
        sourceRefJson: ref({ contextVariant: "B", contentKey: "k-b" }),
      },
      {
        outcome: "SUCCESS",
        sourceRefJson: ref({ contextVariant: "A", contentKey: "k-a" }),
      },
    ]);
    expect(reading.reading).toBe("cross_context_success");
  });

  it("success A / fail B → success_then_transfer_fail", () => {
    const reading = interpretMixedContextEvidence([
      {
        outcome: "FAIL",
        sourceRefJson: ref({ contextVariant: "B", contentKey: "k-b" }),
      },
      {
        outcome: "SUCCESS",
        sourceRefJson: ref({ contextVariant: "A", contentKey: "k-a" }),
      },
    ]);
    expect(reading.reading).toBe("success_then_transfer_fail");
    expect(reading.learnerSafeLine).toMatch(/another/i);
  });

  it("fail A / success B → transfer_recovery", () => {
    const reading = interpretMixedContextEvidence([
      {
        outcome: "SUCCESS",
        sourceRefJson: ref({ contextVariant: "B", contentKey: "k-b" }),
      },
      {
        outcome: "FAIL",
        sourceRefJson: ref({ contextVariant: "A", contentKey: "k-a" }),
      },
    ]);
    expect(reading.reading).toBe("transfer_recovery");
  });

  it("repeated fail across contexts → cautious reading", () => {
    const reading = interpretMixedContextEvidence([
      {
        outcome: "FAIL",
        sourceRefJson: ref({ contextVariant: "C", contentKey: "k-c" }),
      },
      {
        outcome: "FAIL",
        sourceRefJson: ref({ contextVariant: "B", contentKey: "k-b" }),
      },
      {
        outcome: "SUCCESS",
        sourceRefJson: ref({ contextVariant: "A", contentKey: "k-a" }),
      },
    ]);
    expect(["success_then_transfer_fail", "cross_context_struggle"]).toContain(
      reading.reading,
    );
  });

  it("does not rewrite mastery; uses LearningAttempt fields only", () => {
    expect(mixedContextEvidenceTruthSummary().rewritesConceptMastery).toBe(
      false,
    );
    expect(mixedContextEvidenceTruthSummary().inventsTransferGap).toBe(false);
  });
});

describe("2P-46 evidence sufficiency still applies", () => {
  it("one successful attempt remains thin — not rich mastery", () => {
    const level = classifyEvidenceSufficiency({
      reviewCount: 1,
      evidenceEvents: 1,
      sourceKinds: 1,
    });
    expect(level).toBe("thin");
    expect(level).not.toBe("rich");
  });
});

describe("2P-46 Growth continuity wording", () => {
  it("can surface a transfer note without claiming mastery everywhere", () => {
    const visibility = presentLearnerModelVisibility([
      {
        conceptId: "c-transfer",
        conceptTitle: "Linear equation solving",
        recentlyUpdated: true,
        conceptMastery: {
          recognize: 0.5,
          explain: 0.5,
          apply: 0.55,
          solve: 0.55,
          perform: 0.4,
          retain: 0.3,
          confidence: 0.45,
          reviewCount: 2,
        },
      },
    ]);
    const growth = presentGrowthCenter({ visibility });
    const continuity = presentLearnerGrowthContinuity({
      growth,
      transferContinuityNote:
        "You demonstrated this in one context. Practicing in a different setting can deepen transfer when another example is available.",
    });
    expect(continuity.continuityNotes.some((n) => /one context/i.test(n))).toBe(
      true,
    );
    expect(JSON.stringify(continuity)).not.toMatch(
      /mastered everywhere|permanently mastered/i,
    );
  });
});

describe("2P-46 orchestrator / architecture wiring", () => {
  it("keeps APPLICATION_GAP / INSUFFICIENT_EVIDENCE; no TRANSFER_GAP", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("APPLICATION_GAP");
    expect(diagnose).toContain("INSUFFICIENT_EVIDENCE");
    expect(diagnose).not.toContain("TRANSFER_GAP");
    expect(read("src/lib/learning/transfer/index.ts")).not.toContain(
      "TransferEngine",
    );
  });

  it("activities GET resolves transfer hints from LearningAttempt", () => {
    const route = read("app/api/study/activities/[kind]/route.ts");
    expect(route).toContain("resolveTransferSelectionHints");
    expect(route).toContain("avoidContextVariant");
    expect(route).toMatch(/checkStep|diagnostic/);
  });

  it("LUCKY retention architecture unchanged (no TransferRetention)", () => {
    const lucky = read("src/lib/learning/retention/review.ts");
    expect(lucky).not.toContain("TransferRetention");
    expect(lucky).not.toContain("GeneralizationRetention");
  });

  it("math/networking/language sourceRefs carry contentKey + contextVariant", () => {
    expect(read("src/lib/learning/activities/math/service.ts")).toContain(
      "contentKey: challenge.contentKey",
    );
    expect(read("src/lib/learning/activities/networking/service.ts")).toContain(
      "contentKey: challenge.contentKey",
    );
    expect(read("src/lib/learning/activities/language/service.ts")).toContain(
      "contentKey: challenge.contentKey",
    );
  });
});
