/**
 * 2P-18 — Writing → Adaptive Universal Activity Integration tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ADAPTIVE_READY_ACTIVITY_KEYS,
  PRODUCT_READY_NOT_ADAPTIVE_KEYS,
} from "@/lib/learning/decision-loop";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
  listStructuredChallenges,
} from "@/lib/learning/activities/structured/service";
import {
  WRITING_ADAPTIVE_SEED_ACTIVITIES,
  assertWritingRevisionGate,
  evaluateWritingWork,
  extractWritingSubmissionFields,
  getWritingAdaptiveMeta,
  inferWritingLifecyclePhase,
  isWritingAdaptiveReadyContent,
  listWritingDomainsCovered,
  separateAiAssistanceFromEvidence,
  stripWritingCompletionForgery,
  writingAdaptiveContractTruthSummary,
  writingAiAssistanceBoundaryTruthSummary,
  writingArtifactIntegrityOk,
  writingInteractionIsNotCompletion,
  writingRevisionTruthSummary,
  buildWritingLearnerArtifact,
} from "@/lib/learning/activities/writing";
import {
  getActivityAdaptiveCompletionContract,
  isAdaptiveReadyActivityAdapterKey,
  isSupportedUniversalActivityIntervention,
} from "@/lib/learning/sequence/activity-adaptive-completion";
import { getActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";
import { assessAdaptiveReadyCatalogItem } from "@/lib/learning/content-production/adaptive-ready-contract";
import { CONTENT_PROGRESSION_CATALOG } from "@/lib/learning/content-progression/catalog";

describe("2P-18 Writing Adaptive contract", () => {
  it("marks writing Adaptive-ready with EXPLAIN facet and writing_challenge_submit", () => {
    expect(isAdaptiveReadyActivityAdapterKey("writing")).toBe(true);
    expect(isSupportedUniversalActivityIntervention("writing")).toBe(true);
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("writing");
    expect(PRODUCT_READY_NOT_ADAPTIVE_KEYS).not.toContain("writing");
    const contract = getActivityAdaptiveCompletionContract("writing")!;
    expect(contract.sourceRefKinds).toContain("writing_challenge_submit");
    expect(contract.requiredSkillFacets).toContain("EXPLAIN");
    expect(contract.acceptOutcomes).toEqual(
      expect.arrayContaining(["SUCCESS", "PARTIAL", "FAIL"]),
    );
    expect(
      getActivityInterventionCapability("writing")?.adaptiveBindIntegrated,
    ).toBe(true);
  });

  it("separates interaction from completion", () => {
    expect(
      writingInteractionIsNotCompletion(
        inferWritingLifecyclePhase({
          launched: true,
          beganTyping: true,
          hasDraft: true,
          evaluated: false,
          hasRevision: false,
          requiresRevision: false,
          finalSubmitted: false,
          evidenceRecorded: false,
          adaptiveBound: false,
        }),
      ),
    ).toBe(true);
    const summary = writingAdaptiveContractTruthSummary();
    expect(summary.activityLaunchedIsNotCompletion).toBe(true);
    expect(summary.noWritingMasterySystem).toBe(true);
    expect(summary.noAiDetector).toBe(true);
  });
});

describe("2P-18 Writing catalog", () => {
  it("ships 7–12 Adaptive-ready writing activities covering A–G types", () => {
    const seeds = WRITING_ADAPTIVE_SEED_ACTIVITIES;
    expect(seeds.length).toBeGreaterThanOrEqual(7);
    expect(seeds.length).toBeLessThanOrEqual(12);
    const types = new Set(seeds.map((s) => s.writingType));
    for (const t of [
      "thesis",
      "evidence_paragraph",
      "source_analysis",
      "paraphrasing",
      "argument_structure",
      "revision",
      "citation",
    ] as const) {
      expect(types.has(t)).toBe(true);
    }
    const listed = listStructuredChallenges("writing");
    expect(listed.length).toBeGreaterThanOrEqual(10);
  });

  it("covers multiple domains without subject writing engines", () => {
    const domains = listWritingDomainsCovered();
    expect(domains).toEqual(
      expect.arrayContaining([
        "history",
        "business",
        "science",
        "english",
        "computer-science",
      ]),
    );
    const src = readFileSync(
      path.join(process.cwd(), "src/lib/learning/activities/writing/catalog.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/if\s*\(.*nursing.*\)\s*\{[\s\S]*NursingWriting/);
    expect(src).not.toMatch(/HistoryWritingEngine|NursingWritingEngine/);
  });

  it("each seed has progression + Adaptive-ready assessment", () => {
    for (const seed of WRITING_ADAPTIVE_SEED_ACTIVITIES) {
      expect(isWritingAdaptiveReadyContent(seed.id)).toBe(true);
      const assessment = assessAdaptiveReadyCatalogItem({
        activityKind: "writing",
        contentId: seed.id,
      });
      expect(assessment.mechanismAdaptiveReady).toBe(true);
      expect(assessment.contractComplete).toBe(true);
      expect(assessment.progressionPresent).toBe(true);
      expect(assessment.adaptiveReadySeed).toBe(true);
    }
  });
});

describe("2P-18 artifact / revision / evaluation", () => {
  it("keeps draft/final separation and learner-authored integrity", () => {
    const fields = extractWritingSubmissionFields({
      draft: "Draft claim about transit.",
      revision: "Revised thesis: cities should prioritize transit because emissions fall.",
      aiAssistance: "AI would write a perfect essay here.",
    });
    expect(fields.finalText).toContain("Revised thesis");
    expect(fields.aiAssistance).toContain("AI would");
    const artifact = buildWritingLearnerArtifact({
      prompt: "Write a thesis",
      fields,
      evaluation: { outcome: "SUCCESS", score: 1 },
    });
    expect(artifact.learnerAuthored).toBe(true);
    expect(artifact.finalSubmission).not.toBe(artifact.aiAssistance);
    expect(writingArtifactIntegrityOk(artifact).ok).toBe(true);
  });

  it("does not promote AI assistance to evidence text", () => {
    const sep = separateAiAssistanceFromEvidence({
      learnerText: "",
      aiAssistance: "Fully AI-written paragraph about HTTPS.",
    });
    expect(sep.evidenceText).toBe("");
    expect(writingAiAssistanceBoundaryTruthSummary().noAiDetector).toBe(true);
  });

  it("enforces revision when required; client flags cannot bypass", () => {
    const activity = WRITING_ADAPTIVE_SEED_ACTIVITIES.find(
      (a) => a.id === "write-revision-unclear-thesis",
    )!;
    expect(activity.requiresRevision).toBe(true);
    expect(
      assertWritingRevisionGate({
        activity,
        fields: {
          finalText: activity.starterDraft!,
          draft: activity.starterDraft!,
          revision: null,
          aiAssistance: null,
        },
      }).ok,
    ).toBe(false);

    const work = {
      draft: activity.starterDraft!,
      revision: activity.starterDraft!,
      completed: true,
      skipRevision: true,
    };
    const rejected = stripWritingCompletionForgery(work);
    expect(rejected).toEqual(
      expect.arrayContaining(["completed", "skipRevision"]),
    );
    expect(work).not.toHaveProperty("completed");

    const fail = evaluateWritingWork({
      challengeId: activity.id,
      criteria: activity.criteria,
      skillFacet: activity.skillFacet,
      minChars: activity.minChars,
      objective: activity.objective,
      work: {
        draft: activity.starterDraft!,
        revision: activity.starterDraft!,
      },
    });
    expect(fail.evaluation.outcome).toBe("FAIL");
    expect(fail.evaluation.details.error).toBe("revision_unchanged");

    const pass = evaluateWritingWork({
      challengeId: activity.id,
      criteria: activity.criteria,
      skillFacet: activity.skillFacet,
      minChars: activity.minChars,
      objective: activity.objective,
      work: {
        draft: activity.starterDraft!,
        revision:
          "Social media should reduce teen sleep quality because late-night scrolling increases anxiety and shortens rest.",
      },
    });
    expect(pass.evaluation.outcome).toBe("SUCCESS");
    expect(writingRevisionTruthSummary().requiredRevisionCannotBeClientBypassed).toBe(
      true,
    );
  });

  it("failed rubric evaluation still returns criterion evidence details", () => {
    const c = getStructuredChallenge("write-thesis-climate-policy")!;
    const fail = evaluateStructuredChallenge(
      c,
      "I like cities a lot and think they are nice places to live for many reasons overall.",
    );
    expect(fail.outcome).toBe("FAIL");
    expect(fail.details.perCriterion).toBeTruthy();
    expect(fail.skillFacet).toBe("EXPLAIN");
  });

  it("documents why non-revision activities skip revision", () => {
    const meta = getWritingAdaptiveMeta("write-thesis-climate-policy")!;
    expect(meta.requiresRevision).toBe(false);
    expect(meta.revisionNotRequiredReason).toMatch(/revision/i);
  });
});

describe("2P-18 Adaptive binding / evidence path integrity", () => {
  it("source files keep Adaptive gate separate from evidence writers", () => {
    const root = process.cwd();
    const completion = readFileSync(
      path.join(
        root,
        "src/lib/learning/sequence/activity-adaptive-completion.ts",
      ),
      "utf8",
    );
    expect(completion).toContain('adapterKey: "writing"');
    expect(completion).not.toMatch(/learningAttempt\.create|conceptMastery/);
    const writingEval = readFileSync(
      path.join(root, "src/lib/learning/activities/writing/evaluate.ts"),
      "utf8",
    );
    expect(writingEval).not.toMatch(/WritingMastery|WritingEvidence|WritingOrchestrator/);
  });

  it("progression variation exists for writing thesis concept", () => {
    const thesis = CONTENT_PROGRESSION_CATALOG.filter(
      (e) => e.conceptKey === "academic-thesis" && e.activityKind === "writing",
    );
    expect(thesis.length).toBeGreaterThanOrEqual(2);
    const variants = new Set(thesis.map((e) => e.contextVariant));
    expect(variants.size).toBeGreaterThanOrEqual(2);
  });

  it("scaffolding uses universal scaffold kinds", () => {
    const thesis = WRITING_ADAPTIVE_SEED_ACTIVITIES.find(
      (a) => a.id === "write-thesis-climate-policy",
    )!;
    expect(thesis.scaffolds?.[0]?.doesNotRevealAnswer).toBe(true);
    expect(thesis.scaffoldingLevel).toBe("beginner");
    const challenge = WRITING_ADAPTIVE_SEED_ACTIVITIES.find(
      (a) => a.id === "write-revision-unclear-thesis",
    )!;
    expect(challenge.scaffoldingLevel).toBe("challenge");
  });
});
