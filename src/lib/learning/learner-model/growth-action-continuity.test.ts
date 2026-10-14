import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  GROWTH_NO_SEQUENCE_FALLBACK_HREF,
  GROWTH_SECTION_ACTION_POLICY,
  growthActionContinuityTruthSummary,
  indexActiveRunIdByConcept,
  resolveGrowthAdaptivePrimaryCta,
  resolveGrowthSixFallback,
} from "@/lib/learning/learner-model/growth-action-continuity";
import { presentGrowthCenter } from "@/lib/learning/learner-model/present-growth-center";
import { presentLearnerModelVisibility } from "@/lib/learning/mastery/present-learner-model";
import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";
import { ORCHESTRATOR_FACET_STRONG } from "@/lib/learning/orchestrator/diagnose";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-22 Learner Growth → Learning Action Continuity", () => {
  it("1. no active Adaptive run → Start learning", () => {
    const cta = resolveGrowthAdaptivePrimaryCta({
      conceptId: "c-java",
      activeRunId: null,
    });
    expect(cta).toEqual({
      kind: "start",
      conceptId: "c-java",
      label: "Start learning",
    });
  });

  it("2. active Adaptive run → Continue learning (resume href)", () => {
    const cta = resolveGrowthAdaptivePrimaryCta({
      conceptId: "c-sql",
      activeRunId: "run-active-1",
    });
    expect(cta).toEqual({
      kind: "resume",
      runId: "run-active-1",
      label: "Continue learning",
      href: "/study/adaptive/run-active-1",
    });
  });

  it("3–4. completed/abandoned runs are not indexed → no auto-restart / no resurrect", () => {
    // Caller only indexes ACTIVE runs from listActiveAdaptiveSequenceRuns.
    const byConcept = indexActiveRunIdByConcept([
      { id: "run-active", conceptId: "c1" },
    ]);
    expect(byConcept.c1).toBe("run-active");
    // Completed/abandoned never passed in → Start learning (fresh legal start).
    expect(
      resolveGrowthAdaptivePrimaryCta({
        conceptId: "c1",
        activeRunId: byConcept["completed-missing"],
      }).kind,
    ).toBe("start");
    expect(
      resolveGrowthAdaptivePrimaryCta({
        conceptId: "c-abandoned",
        activeRunId: null,
      }).kind,
    ).toBe("start");
  });

  it("5. no intervention / no concept → safe none + Study Hub fallback constant", () => {
    expect(resolveGrowthAdaptivePrimaryCta({}).kind).toBe("none");
    expect(GROWTH_NO_SEQUENCE_FALLBACK_HREF).toBe("/study");
    const btn = read("src/components/study/ContinueLearningButton.tsx");
    expect(btn).toContain("data-growth-adaptive-fallback");
    expect(btn).toContain('data-growth-fallback="study-hub"');
  });

  it("6. What Needs Practice uses existing Adaptive ContinueLearningButton", () => {
    expect(GROWTH_SECTION_ACTION_POLICY.needsPractice).toBe(
      "adaptive_via_continue_learning_button",
    );
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain('sectionId="practice"');
    expect(panel).toContain("continueOnItems");
    expect(panel).toContain("ContinueLearningButton");
    expect(panel).not.toContain("orchestrateForConcept");
  });

  it("7. Developing is not treated as failure", () => {
    expect(GROWTH_SECTION_ACTION_POLICY.developing).toContain("not_failure");
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toMatch(/still building, not a failure/i);
    expect(panel).not.toMatch(/You failed|you are weak/i);
  });

  it("8. Not Enough Evidence does not fabricate mastery", () => {
    const growth = presentGrowthCenter({
      visibility: presentLearnerModelVisibility([
        { conceptId: "physics-force", conceptTitle: "Force", conceptMastery: null },
      ]),
    });
    expect(growth.visibility.insufficientEvidence).toHaveLength(1);
    expect(growth.visibility.strengths).toHaveLength(0);
    expect(JSON.stringify(growth)).not.toMatch(/0%|fabricat/i);
    expect(GROWTH_SECTION_ACTION_POLICY.insufficientEvidence).toContain(
      "informational",
    );
  });

  it("9. Recently Practiced uses LearningAttempt only (policy + page)", () => {
    expect(GROWTH_SECTION_ACTION_POLICY.recentlyPracticed).toBe(
      "informational_learning_attempt_only",
    );
    const page = read("app/study/learner-model/page.tsx");
    expect(page).toContain("resolveLearnerGrowthContinuityForUser");
    expect(page).not.toMatch(/recordEvidence|applyEvidenceToMastery/);
    const resolve = read("src/lib/learning/learner-growth/resolve.ts");
    expect(resolve).toContain("learningAttempt");
  });

  it("10. concept detail facets only from presentConceptProgress (no synthetic scores)", () => {
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("not_yet_evidenced");
    expect(panel).toContain("learnerLine");
    expect(panel).not.toMatch(/Math\.random|fakeScore|synthetic/);
  });

  it("11. learning-space context: Growth does not invent new context fields", () => {
    const continuity = read(
      "src/lib/learning/learner-model/growth-action-continuity.ts",
    );
    expect(continuity).not.toMatch(/learningSpaceId:\s*["']/);
    expect(continuity).toContain("resolveHubAdaptivePrimaryCta");
  });

  it("12. ownership: start API ignores client learnerId; page scopes by session user", () => {
    const start = read("app/api/study/adaptive/start/route.ts");
    expect(start).toContain("getOrCreateDefaultUser");
    expect(start).toMatch(/ignore.*userId|void body\?\.userId/i);
    const page = read("app/study/learner-model/page.tsx");
    expect(page).toContain("resolveLearnerGrowthContinuityForUser(user.id)");
    expect(page).not.toMatch(/body\.userId|searchParams\.get\([\"']userId/);
    const resolve = read("src/lib/learning/learner-growth/resolve.ts");
    expect(resolve).toContain("where: { userId: uid }");
    expect(resolve).toContain("listActiveAdaptiveSequenceRuns(uid)");
  });

  it("13. universal-domain: no subject branching in continuity helper", () => {
    const domains = [
      "Java",
      "Nursing",
      "Finance",
      "Networking",
      "Writing",
      "Automotive",
    ];
    for (const title of domains) {
      const cta = resolveGrowthAdaptivePrimaryCta({
        conceptId: `id-${title}`,
        activeRunId: null,
      });
      expect(cta.kind).toBe("start");
      if (cta.kind === "start") expect(cta.label).toBe("Start learning");
    }
    const src = read(
      "src/lib/learning/learner-model/growth-action-continuity.ts",
    );
    expect(src).not.toMatch(/if \(.*Java|NursingTeaching|domain ===/);
    expect(growthActionContinuityTruthSummary().createsGrowthEngine).toBe(false);
    expect(growthActionContinuityTruthSummary().inventsSixInterventions).toBe(
      false,
    );
  });

  it("SIX fallback only when Orchestrator already provided href+label", () => {
    expect(
      resolveGrowthSixFallback({ href: "/study/six/feynman", actionLabel: "Try it" }),
    ).toEqual({ href: "/study/six/feynman", label: "Try it" });
    expect(resolveGrowthSixFallback({ href: "/study/six/feynman" })).toBeNull();
  });

  it("page wires ACTIVE run index into Growth Center panel", () => {
    const page = read("app/study/learner-model/page.tsx");
    expect(page).toContain("activeRunByConceptId={continuity.activeRunByConceptId}");
    expect(page).toContain("resolveLearnerGrowthContinuityForUser");
    const resolve = read("src/lib/learning/learner-growth/resolve.ts");
    expect(resolve).toContain("indexActiveRunIdByConcept");
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("resolveGrowthAdaptivePrimaryCta");
    expect(panel).toContain("activeRunId");
    const btn = read("src/components/study/ContinueLearningButton.tsx");
    expect(btn).toContain('data-entry-kind="adaptive-learning"');
    expect(btn).toContain("resolveGrowthAdaptivePrimaryCta");
  });

  it("What I know remains informational (no auto-launch CTAs)", () => {
    expect(GROWTH_SECTION_ACTION_POLICY.whatIKnow).toBe(
      "informational_no_auto_launch",
    );
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    // Know section exists without continueOnItems on that call
    expect(panel).toMatch(/sectionId="know"[\s\S]*?items=\{visibility\.strengths\}/);
    expect(panel).not.toMatch(
      /sectionId="know"[\s\S]*?continueOnItems[\s\S]*?sectionId="developing"/,
    );
  });

  it("mastery source remains ConceptMastery across domains", () => {
    const growth = presentGrowthCenter({
      visibility: presentLearnerModelVisibility([
        {
          conceptId: "hist-1",
          conceptTitle: "Cold War",
          conceptMastery: {
            recognize: ORCHESTRATOR_FACET_STRONG,
            explain: ORCHESTRATOR_FACET_STRONG,
            apply: ORCHESTRATOR_FACET_STRONG,
            solve: ORCHESTRATOR_FACET_STRONG,
            perform: ORCHESTRATOR_FACET_STRONG,
            retain: ORCHESTRATOR_FACET_STRONG,
            confidence: 0.7,
            reviewCount: 3,
          },
        },
      ]),
    });
    expect(growth.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
  });
});
