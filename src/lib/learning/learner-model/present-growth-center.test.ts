import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  growthCenterTruthSummary,
  presentGrowthCenter,
} from "@/lib/learning/learner-model/present-growth-center";
import {
  formatEvidenceWhenLabel,
  presentRecentEvidenceTimeline,
  recentEvidenceTruthSummary,
} from "@/lib/learning/learner-model/present-recent-evidence";
import { presentLearnerModelVisibility } from "@/lib/learning/mastery/present-learner-model";
import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";
import { ORCHESTRATOR_FACET_STRONG } from "@/lib/learning/orchestrator/diagnose";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-21 Learner Growth Center", () => {
  it("source of truth: ConceptMastery for mastery buckets", () => {
    const visibility = presentLearnerModelVisibility([
      {
        conceptId: "java-inheritance",
        conceptTitle: "Java Inheritance",
        recentlyUpdated: true,
        conceptMastery: {
          recognize: ORCHESTRATOR_FACET_STRONG,
          explain: ORCHESTRATOR_FACET_STRONG,
          apply: ORCHESTRATOR_FACET_STRONG,
          solve: ORCHESTRATOR_FACET_STRONG,
          perform: ORCHESTRATOR_FACET_STRONG,
          retain: ORCHESTRATOR_FACET_STRONG,
          confidence: 0.7,
          reviewCount: 4,
        },
      },
      {
        conceptId: "nursing-vitals",
        conceptTitle: "Vital Signs",
        conceptMastery: {
          recognize: 0.5,
          explain: 0.5,
          apply: 0.5,
          solve: 0.5,
          perform: 0.5,
          retain: 0.5,
          confidence: 0.4,
          reviewCount: 2,
        },
      },
      {
        conceptId: "finance-npv",
        conceptTitle: "NPV",
        conceptMastery: {
          recognize: 0.2,
          explain: 0.2,
          apply: 0.2,
          solve: 0.1,
          perform: 0.1,
          retain: 0.2,
          confidence: 0.2,
          reviewCount: 3,
        },
      },
      {
        conceptId: "history-cold-war",
        conceptTitle: "Cold War",
        conceptMastery: null,
      },
    ]);

    const growth = presentGrowthCenter({ visibility });
    expect(growth.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    expect(growth.visibility.strengths.some((s) => s.conceptId === "java-inheritance")).toBe(
      true,
    );
    expect(growth.visibility.developing.some((s) => s.conceptId === "nursing-vitals")).toBe(
      true,
    );
    expect(
      growth.visibility.needsMorePractice.some((s) => s.conceptId === "finance-npv"),
    ).toBe(true);
    expect(
      growth.visibility.insufficientEvidence.some(
        (s) => s.conceptId === "history-cold-war",
      ),
    ).toBe(true);
    expect(growth.focusConceptId).toBe("finance-npv");
  });

  it("evidence timeline uses LearningAttempt fields only (no payloads)", () => {
    const now = new Date("2026-09-21T12:00:00.000Z");
    const timeline = presentRecentEvidenceTimeline(
      [
        {
          conceptId: "c1",
          conceptTitle: "SQL JOINs",
          skillFacet: "APPLY",
          outcome: "SUCCESS",
          createdAt: now,
        },
        {
          conceptId: "c2",
          conceptTitle: "Ohm's Law",
          skillFacet: "EXPLAIN",
          outcome: "PARTIAL",
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      ],
      { now },
    );
    expect(timeline[0]?.whenLabel).toBe("Today");
    expect(timeline[0]?.actionLabel).toBe("Applied");
    expect(timeline[0]?.outcomeLabel).toBe("Success");
    expect(timeline[1]?.whenLabel).toBe("Yesterday");
    expect(timeline[1]?.actionLabel).toBe("Explained");
    const blob = JSON.stringify(timeline);
    expect(blob).not.toMatch(/evidencePayload|misconception|score/);
    expect(formatEvidenceWhenLabel(now, now)).toBe("Today");
  });

  it("cold start and developing snapshots without fake %", () => {
    const cold = presentGrowthCenter({
      visibility: presentLearnerModelVisibility([]),
    });
    expect(cold.coldStart).toBe(true);
    expect(cold.snapshot.kind).toBe("cold_start");
    expect(JSON.stringify(cold)).not.toMatch(/%|87\.|learner score/i);

    const growing = presentGrowthCenter({
      visibility: presentLearnerModelVisibility([
        {
          conceptId: "math-limits",
          conceptTitle: "Limits",
          conceptMastery: {
            recognize: 0.5,
            explain: 0.5,
            apply: 0.5,
            solve: 0.5,
            perform: 0.5,
            retain: 0.5,
            confidence: 0.4,
            reviewCount: 2,
          },
        },
      ]),
    });
    expect(growing.snapshot.kind).toBe("developing");
  });

  it("domain-neutral: same projector for many subject titles", () => {
    const domains = [
      "Java Generics",
      "Subnet Masking",
      "Balance Sheet",
      "Automotive Brakes",
      "Essay Thesis",
      "Lab Titration",
    ];
    const visibility = presentLearnerModelVisibility(
      domains.map((title, i) => ({
        conceptId: `d-${i}`,
        conceptTitle: title,
        conceptMastery: {
          recognize: ORCHESTRATOR_FACET_STRONG,
          explain: ORCHESTRATOR_FACET_STRONG,
          apply: ORCHESTRATOR_FACET_STRONG,
          solve: ORCHESTRATOR_FACET_STRONG,
          perform: ORCHESTRATOR_FACET_STRONG,
          retain: ORCHESTRATOR_FACET_STRONG,
          confidence: 0.6,
          reviewCount: 2,
        },
      })),
    );
    const growth = presentGrowthCenter({ visibility });
    expect(growth.visibility.strengths).toHaveLength(domains.length);
    expect(growth.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
  });

  it("separation: Growth Center does not diagnose or recommend", () => {
    const t = growthCenterTruthSummary();
    expect(t.createsGrowthEngine).toBe(false);
    expect(t.computesRecommendations).toBe(false);
    expect(t.computesAdaptiveSequences).toBe(false);
    expect(t.usesTopicMasteryAsUle).toBe(false);
    expect(recentEvidenceTruthSummary().treatsPageViewsAsEvidence).toBe(false);

    const projector = read(
      "src/lib/learning/learner-model/present-growth-center.ts",
    );
    expect(projector).not.toMatch(/orchestrateForConcept|diagnose\(/);
    expect(projector).not.toMatch(/startAdaptiveSequence|startOrResumeAdaptive/);
    expect(projector).not.toMatch(/class GrowthEngine|new ProgressEngine|GrowthMastery\b/);
    expect(projector).not.toMatch(/db\.topicMastery|from TopicMastery/);

    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("OrchestratorSuggestionCard");
    expect(panel).toContain("ContinueLearningButton");
    expect(panel).not.toContain("orchestrateForConcept");
    expect(panel).not.toContain("recordEvidence");
    expect(panel).not.toContain("applyEvidenceToMastery");
  });

  it("page authorizes via current user and Adaptive CTA path exists", () => {
    const page = read("app/study/learner-model/page.tsx");
    expect(page).toContain("resolveLearnerGrowthContinuityForUser(user.id)");
    expect(page).toContain("getOrCreateDefaultUser");
    expect(page).not.toMatch(/body\.userId|searchParams\.get\([\"']userId/);
    const resolve = read("src/lib/learning/learner-growth/resolve.ts");
    expect(resolve).toContain("where: { userId: uid }");
    expect(resolve).toContain("presentGrowthCenter");
    expect(resolve).toContain("learningAttempt");

    const btn = read("src/components/study/ContinueLearningButton.tsx");
    expect(btn).toContain("/api/study/adaptive/start");

    const alias = read("app/study/learner/page.tsx");
    expect(alias).toContain('redirect("/study/learner-model")');
  });

  it("accessibility: semantic headings and status attributes", () => {
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("<h1");
    expect(panel).toContain("aria-labelledby");
    expect(panel).toContain("aria-label");
    expect(panel).toContain("Learning snapshot");
    expect(panel).toContain("What I know");
    expect(panel).toContain("What I'm developing");
    expect(panel).toContain("What needs practice");
    expect(panel).toContain("Not enough evidence yet");
    expect(panel).toContain("Recently practiced");
    expect(panel).toContain("Why Study Haul recommends this");
    expect(panel).toContain("Next step");
    expect(panel).toContain("min-h-11");
    expect(panel).toContain("touch-manipulation");
  });
});
