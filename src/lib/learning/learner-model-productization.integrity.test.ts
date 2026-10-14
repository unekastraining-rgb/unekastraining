import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  learnerModelIsColdStart,
  learnerModelVisibilityTruthSummary,
  pickLearnerModelFocusConceptId,
  presentLearnerModelVisibility,
} from "@/lib/learning/mastery/present-learner-model";
import { presentConceptProgress } from "@/lib/learning/mastery/present-concept-progress";
import {
  CANONICAL_ULE_MASTERY_SOURCE,
  TOPIC_PROGRESS_LEARNER_COPY,
  ULE_MASTERY_LEARNER_COPY,
} from "@/lib/learning/mastery/mastery-truth";
import { ORCHESTRATOR_FACET_STRONG } from "@/lib/learning/orchestrator/diagnose";
import { MASTERY_FACETS } from "@/lib/learning/types";

const root = path.resolve(__dirname, "../../..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-4 Learner Model productization", () => {
  it("TEST A — page scopes ConceptMastery to current user", () => {
    const page = read("app/study/learner-model/page.tsx");
    expect(page).toContain("getOrCreateDefaultUser");
    expect(page).toContain("resolveLearnerGrowthContinuityForUser(user.id)");
    expect(page).not.toMatch(/body\.userId|searchParams\.get\([\"']userId/);
    const resolve = read("src/lib/learning/learner-growth/resolve.ts");
    expect(resolve).toContain("where: { userId: uid }");
  });

  it("TEST B — ULE mastery comes from ConceptMastery", () => {
    const view = presentLearnerModelVisibility([
      {
        conceptId: "c1",
        conceptTitle: "Osmosis",
        conceptMastery: {
          recognize: ORCHESTRATOR_FACET_STRONG,
          explain: ORCHESTRATOR_FACET_STRONG,
          apply: ORCHESTRATOR_FACET_STRONG,
          solve: ORCHESTRATOR_FACET_STRONG,
          perform: ORCHESTRATOR_FACET_STRONG,
          retain: ORCHESTRATOR_FACET_STRONG,
          confidence: 0.8,
          reviewCount: 4,
        },
      },
    ]);
    expect(view.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    expect(view.strengths[0]?.progress.source).toBe("ConceptMastery");
  });

  it("TEST C — TopicMastery cannot silently become ConceptMastery", () => {
    const progress = presentConceptProgress({
      conceptId: "c1",
      conceptTitle: "X",
      conceptMastery: null,
      topicMastery: { proficiency: 99 },
    });
    expect(progress.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    expect(progress.status).not.toBe("available");
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("ULE_MASTERY_LEARNER_COPY");
    expect(panel).toContain("TOPIC_PROGRESS_LEARNER_COPY");
    expect(TOPIC_PROGRESS_LEARNER_COPY.shortLabel).toBe("Topic progress");
    expect(ULE_MASTERY_LEARNER_COPY.shortLabel).toBe("Concept mastery");
  });

  it("TEST D — insufficient evidence is not fabricated zero mastery", () => {
    const view = presentLearnerModelVisibility([
      { conceptId: "none", conceptTitle: "Mitosis", conceptMastery: null },
    ]);
    expect(view.insufficientEvidence).toHaveLength(1);
    expect(view.strengths).toHaveLength(0);
    const blob = JSON.stringify(view.insufficientEvidence);
    expect(blob).not.toMatch(/"0%"|score of 0/);
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toMatch(/not a score of 0|Not enough evidence/i);
  });

  it("TEST E — facets RECOGNIZE…RETAIN are represented", () => {
    const progress = presentConceptProgress({
      conceptId: "c1",
      conceptTitle: "X",
      conceptMastery: {
        recognize: 0.5,
        explain: 0.5,
        apply: 0.5,
        solve: 0.5,
        perform: 0.5,
        retain: 0.5,
        confidence: 0.5,
        reviewCount: 3,
      },
    });
    expect(progress.dimensions.map((d) => d.facet).sort()).toEqual(
      [...MASTERY_FACETS].sort(),
    );
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("data-learner-model-facets");
    expect(panel).toContain("learnerLine");
  });

  it("TEST F — consumes existing Orchestrator suggestion (no new engine)", () => {
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("OrchestratorSuggestionCard");
    expect(panel).toContain("data-learner-model-orchestrator");
    expect(panel).not.toContain("orchestrateForConcept");
    expect(panel).not.toContain("diagnose(");
  });

  it("TEST G — Adaptive navigation uses canonical start path", () => {
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("ContinueLearningButton");
    const btn = read("src/components/study/ContinueLearningButton.tsx");
    expect(btn).toContain("/api/study/adaptive/start");
    expect(btn).toContain('data-entry-kind="adaptive-learning"');
  });

  it("TEST H — focus concept prefers needs practice; start path resumes server-side", () => {
    const view = presentLearnerModelVisibility([
      {
        conceptId: "strong",
        conceptTitle: "A",
        conceptMastery: {
          recognize: ORCHESTRATOR_FACET_STRONG,
          explain: ORCHESTRATOR_FACET_STRONG,
          apply: ORCHESTRATOR_FACET_STRONG,
          solve: ORCHESTRATOR_FACET_STRONG,
          perform: ORCHESTRATOR_FACET_STRONG,
          retain: ORCHESTRATOR_FACET_STRONG,
          confidence: 0.8,
          reviewCount: 5,
        },
      },
      {
        conceptId: "weak",
        conceptTitle: "B",
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
    ]);
    expect(pickLearnerModelFocusConceptId(view)).toBe("weak");
    const start = read("app/api/study/adaptive/start/route.ts");
    expect(start).toContain("startOrResumeAdaptiveSequenceForConcept");
  });

  it("TEST I — Learner Model projection does not write evidence/mastery", () => {
    const t = learnerModelVisibilityTruthSummary();
    expect(t.usesConceptMastery).toBe(true);
    expect(t.createsNewLearnerModelTable).toBe(false);
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).not.toContain("recordEvidence");
    expect(panel).not.toContain("applyEvidenceToMastery");
    const page = read("app/study/learner-model/page.tsx");
    expect(page).not.toContain("recordEvidence");
    expect(page).not.toContain("applyEvidenceToMastery");
    expect(page).toMatch(/[Pp]resentation only/);
  });

  it("TEST J — cold start empty state is truthful", () => {
    const empty = presentLearnerModelVisibility([]);
    expect(learnerModelIsColdStart(empty)).toBe(true);
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("data-learner-model-empty");
    expect(panel).toContain("No concept mastery evidence yet");
  });

  it("TEST K — error states without raw server dumps", () => {
    const page = read("app/study/learner-model/page.tsx");
    expect(page).toContain("data-learner-model-error");
    expect(page).toContain("Could not load your learning");
    expect(page).not.toContain("error.message");
    expect(page).not.toContain("stack");
  });

  it("TEST L — semantic sections + navigation preserved", () => {
    const panel = read("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("<h1");
    expect(panel).toContain("<h2");
    expect(panel).toContain("data-learner-model-footer-nav");
    expect(panel).toContain("/study");
    expect(panel).toContain("/core");
    expect(panel).toContain("/quizzes");
    expect(panel).toContain("/flashcards");
  });
});
