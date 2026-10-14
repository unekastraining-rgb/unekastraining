import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  resolveHubAdaptivePrimaryCta,
} from "@/lib/learning/orchestrator/hub-adaptive-bridge";
import { HUB_ORCHESTRATOR_EMPTY_COPY } from "@/lib/learning/orchestrator/hub-empty-copy";
import {
  buildOrchestratorMasterySummary,
} from "@/lib/learning/orchestrator/present-mastery-summary";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import {
  TOPIC_PROGRESS_LEARNER_COPY,
  ULE_MASTERY_LEARNER_COPY,
} from "@/lib/learning/mastery/mastery-truth";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

const root = path.resolve(__dirname, "../../..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

function summary(
  partial: Omit<Partial<LearnerConceptMasterySummary>, "facets"> & {
    facets?: Partial<LearnerConceptMasterySummary["facets"]>;
  },
): LearnerConceptMasterySummary {
  return {
    learnerId: "user-1",
    conceptId: "concept-1",
    conceptTitle: "Java Exceptions",
    facets: { ...emptyFacetScores(), ...partial.facets },
    topicMastery: partial.topicMastery ?? null,
    recentMissedCount: 0,
    evidenceSourceCounts: partial.evidenceSourceCounts ?? {
      quiz: 2,
      flashcard: 1,
      study_evaluate: 1,
      other: 0,
    },
    reviewCount: partial.reviewCount ?? 4,
    lastReviewedAt: null,
    nextReviewAt: null,
  };
}

describe("2P-3 Study Hub productization", () => {
  it("TEST A — valid suggestion CTA uses canonical Adaptive start API", () => {
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("/api/study/adaptive/start");
    expect(card).toContain('data-hub-primary-cta="adaptive"');
    expect(card).toContain("resolveHubAdaptivePrimaryCta");
    const start = resolveHubAdaptivePrimaryCta({
      conceptId: "concept_owned",
    });
    expect(start.kind).toBe("start");
    expect(start.kind === "start" && start.label).toMatch(/Start learning/i);
  });

  it("TEST B — active run resolves to Continue learning, not duplicate start", () => {
    const cta = resolveHubAdaptivePrimaryCta({
      conceptId: "concept_owned",
      activeRunId: "run_active",
    });
    expect(cta.kind).toBe("resume");
    if (cta.kind === "resume") {
      expect(cta.href).toBe("/study/adaptive/run_active");
      expect(cta.label).toMatch(/Continue learning/i);
    }
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain('primary.kind === "resume"');
    expect(card).toContain("router.push(primary.href)");
  });

  it("TEST C — no valid suggestion → soft empty, no fabricated recommendation", () => {
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("data-hub-suggestion-empty");
    expect(card).toContain("HUB_ORCHESTRATOR_EMPTY_COPY.noSuggestionTitle");
    expect(card).toContain("HUB_ORCHESTRATOR_EMPTY_COPY.noSuggestionBody");
    expect(card).not.toMatch(/fabricat|fake.?recommend|invent.?diagnos/i);
    expect(HUB_ORCHESTRATOR_EMPTY_COPY.noSuggestionBody).toMatch(
      /Study Haul notices|Your Study Haul|Start Studying|Progress/i,
    );
  });

  it("TEST D — Hub mastery summary reflects ConceptMastery / ULE truth", () => {
    const result = orchestrateFromLearnerState(
      summary({
        facets: { recognize: 0.7, explain: 0.65, apply: 0.2, retain: 0.5 },
      }),
    );
    const mastery = buildOrchestratorMasterySummary(result);
    expect(mastery.source).toBe("ConceptMastery");
    expect(mastery.stateLabel).toMatch(/^Concept mastery:/);
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("ULE_MASTERY_LEARNER_COPY");
    expect(card).toContain("ULE_MASTERY_LEARNER_COPY.shortLabel");
    expect(ULE_MASTERY_LEARNER_COPY.shortLabel).toBe("Concept mastery");
  });

  it("TEST E — TopicMastery progress remains clearly labeled", () => {
    expect(TOPIC_PROGRESS_LEARNER_COPY.shortLabel).toBe("Topic progress");
    const six = read("src/components/study/SixRecommendationsPanel.tsx");
    expect(six).toContain("TOPIC_PROGRESS_LEARNER_COPY.shortLabel");
    expect(six).toContain("data-topic-progress-badge");
    const hub = read("app/study/study-hub-view.tsx");
    expect(hub).toContain("Topic progress focus:");
  });

  it("TEST F — Hub direct SIX / Quiz / Flashcard / activity access remains", () => {
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("data-orchestrator-try-it");
    expect(card).toContain("data-entry-kind=\"direct-activity\"");
    // Activities live in TopicStudyHaul HOW environments (not a front-door inventory)
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    const rooms = read("src/lib/study/resolve-study-room.ts");
    expect(topic).toContain("luckyQuizHref");
    expect(topic).toContain("listSupportedPracticeLandscape");
    expect(rooms).toContain("/flashcards");
    expect(rooms).toContain("/study/lucky");
  });

  it("TEST G — Hub does not write evidence/mastery", () => {
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("Hub does not write evidence, mastery, or re-orchestration");
    expect(card).not.toContain("recordEvidence");
    expect(card).not.toContain("applyEvidenceToMastery");
    expect(card).not.toContain("updateTopicMastery");
    const hub = read("app/study/study-hub-view.tsx");
    expect(hub).not.toContain("recordEvidence");
    expect(hub).not.toContain("applyEvidenceToMastery");
  });

  it("TEST H — Adaptive start failure keeps Hub / direct access usable", () => {
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("data-hub-start-error-fallback");
    expect(card).toContain("HUB_ORCHESTRATOR_EMPTY_COPY.startErrorFallback");
    expect(card).toContain("data-orchestrator-try-it");
    expect(HUB_ORCHESTRATOR_EMPTY_COPY.startErrorFallback).toMatch(
      /Practice|Quiz|Flashcards|Start Studying/i,
    );
  });

  it("TEST I — Study Now → Adaptive remains intact", () => {
    const btn = read("src/components/study/ContinueLearningButton.tsx");
    expect(btn).toContain("/api/study/adaptive/start");
    const runner = read("src/components/study/StudySessionRunner.tsx");
    expect(runner).toContain("ContinueLearningButton");
  });

  it("TEST J — CORE → Adaptive remains intact", () => {
    const panel = read("src/components/core/CoreKnowledgeBridgePanel.tsx");
    expect(panel).toContain("/api/study/adaptive/start");
    expect(panel).toContain("onBeforeLeaveToAdaptive");
  });

  it("TEST K — Assignments direct practice remains intact", () => {
    const assign = read("src/components/hub/AssignmentsTab.tsx");
    expect(assign.length).toBeGreaterThan(50);
    expect(assign).toMatch(/practice|activit|assignment/i);
  });

  it("Hub hierarchy + Learner Model access productized", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(center).toContain("Welcome to Study Haul");
    expect(center).toContain("Start a Study Session");
    expect(topic).toContain("/study/learner-model");
    expect(hub).toContain('id="study-now"');
  });
});
