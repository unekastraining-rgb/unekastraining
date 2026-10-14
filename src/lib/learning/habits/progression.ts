/**
 * Gradual progression advice for Learning & Habits.
 * Reuses the Knowledge Loop action vocabulary and Six technique picker.
 * Does not write mastery or create a second learner model.
 */

import { recommendSixTechnique } from "@/lib/learning/orchestrator/knowledge-loop/six-intelligence";
import type { KnowledgeLearningAction } from "@/lib/learning/orchestrator/knowledge-loop/types";

import { nextProbe, probeById, PROBES, type ProbeStage } from "./catalog";
import { productionFollowUp } from "./progression-standard";
import type { ExperimentAttempt, LearningHabitsDocument, ReasoningQuality } from "./document";

const STAGE_ORDER: ProbeStage[] = [
  "foundation",
  "guided",
  "supported",
  "variation",
  "independent",
  "transfer",
  "recall",
];

export type ProgressionAdvice = {
  stage: ProbeStage | "delayed" | "revisit";
  title: string;
  reason: string;
  href: string;
  label: string;
  confidence: string;
  /** This module never assigns mastery. */
  mastery: false;
  orchestratorAction: KnowledgeLearningAction;
};

export function classifyReasoning(input: {
  explanation: string;
  correct: boolean | null;
  soundPhrases: string[];
  unsoundPhrases: string[];
}): ReasoningQuality {
  if (input.correct === null) return "unknown";
  const text = input.explanation.trim().toLowerCase();
  if (!text) return "unknown";
  const sound = input.soundPhrases.some((phrase) => text.includes(phrase.toLowerCase()));
  const unsound = input.unsoundPhrases.some((phrase) => text.includes(phrase.toLowerCase()));
  if (input.correct) {
    if (unsound) return "contradictory";
    if (sound) return "sound";
    return "insufficient";
  }
  if (sound && !unsound) return "partial";
  return "misconception";
}

function supportOf(row: ExperimentAttempt): ExperimentAttempt["supportLevel"] {
  return row.supportLevel ?? (row.assisted ? "hint" : "none");
}

/** All-correct diagnostic order. Each step moves at most one stage forward. */
export function successfulDiagnosticStages(): ProbeStage[] {
  const stages: ProbeStage[] = [];
  const completed: string[] = [];
  let difficulty = 1;
  let scored = 0;
  for (let guard = 0; guard < PROBES.length + 1; guard += 1) {
    const probe = nextProbe({ completedIds: completed, difficulty });
    if (!probe) break;
    stages.push(probe.stage);
    completed.push(probe.id);
    scored += 1;
    if (scored >= 2) difficulty = Math.min(3, difficulty + 1);
  }
  return stages;
}

export function stageAdvancesGradually(stages: ProbeStage[]): boolean {
  for (let index = 1; index < stages.length; index += 1) {
    const previous = STAGE_ORDER.indexOf(stages[index - 1]!);
    const current = STAGE_ORDER.indexOf(stages[index]!);
    if (current - previous > 1) return false;
  }
  return true;
}

function sixHref(action: KnowledgeLearningAction, incorrect: boolean): { href: string; label: string } {
  const technique = recommendSixTechnique({
    decision: {
      action,
      conceptId: null,
      reasonCode: incorrect ? "recent-incorrect" : action === "teach" ? "new-concept" : "needs-practice",
      reason: "Learning & Habits progression",
      confidence: "low",
      trace: {
        target: "learning-habits",
        focusConceptId: null,
        exposureCount: 1,
        attemptCount: incorrect ? 2 : 1,
        correctCount: incorrect ? 0 : 1,
        incorrectCount: incorrect ? 1 : 0,
        hasPracticeEvidence: false,
        hasCheckEvidence: !incorrect,
        hasRecallEvidence: false,
      },
    },
  });
  return { href: `/study/six/${technique.technique}`, label: "Open Six" };
}

function advice(
  partial: Omit<ProgressionAdvice, "mastery" | "confidence"> & { confidence?: string },
): ProgressionAdvice {
  return {
    mastery: false,
    confidence: partial.confidence ?? "One observation is not a conclusion.",
    stage: partial.stage,
    title: partial.title,
    reason: partial.reason,
    href: partial.href,
    label: partial.label,
    orchestratorAction: partial.orchestratorAction,
  };
}

function unaidedCorrectOnConcept(doc: LearningHabitsDocument, conceptLabel: string): boolean {
  return doc.assessment.results.some((row) => {
    if (row.correct !== true || supportOf(row) !== "none") return false;
    return probeById(row.templateId)?.conceptLabel === conceptLabel;
  });
}

function probeAttempts(doc: LearningHabitsDocument): ExperimentAttempt[] {
  return doc.assessment.results
    .filter((attempt) => attempt.correct !== null)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at));
}

function focusStillOpen(attempts: ExperimentAttempt[], focus: ExperimentAttempt["difficultyFocus"]): boolean {
  const misses = attempts.filter((attempt) => attempt.difficultyFocus === focus && attempt.correct === false);
  if (!misses.length) return false;
  const last = misses[misses.length - 1]!;
  const later = attempts.filter(
    (attempt) =>
      attempt.difficultyFocus === focus &&
      attempt.correct === true &&
      supportOf(attempt) === "none" &&
      +new Date(attempt.at) > +new Date(last.at),
  );
  return later.length < 2;
}

/**
 * Sequence, structure, differentiation, coordination, and instructional-error
 * cases. Other probes keep the existing progression order.
 */
function focusedDifficultyPlan(doc: LearningHabitsDocument): ProgressionAdvice | null {
  const attempts = probeAttempts(doc);
  const clean = attempts.filter((attempt) => attempt.instructionalIssue === "none");
  const taintedMisses = attempts.filter(
    (attempt) => attempt.correct === false && attempt.instructionalIssue !== "none",
  );
  if (taintedMisses.length > 0 && !clean.some((attempt) => attempt.correct === false)) {
    return advice({
      stage: "revisit",
      title: "Correct the earlier explanation",
      reason: "A recorded task or explanation was inconsistent. That miss is not treated as a learner difficulty.",
      href: "/study/six/detailed-explanation",
      label: "Open Six",
      confidence: "The instructional problem is recorded. Understanding is not established from that item.",
      orchestratorAction: "reteach",
    });
  }
  const misses = (focus: ExperimentAttempt["difficultyFocus"]) =>
    clean.filter((attempt) => attempt.correct === false && attempt.difficultyFocus === focus);
  if (
    focusStillOpen(clean, "coordination") &&
    clean.some(
      (attempt) =>
        attempt.correct === true &&
        supportOf(attempt) === "none" &&
        attempt.difficultyFocus &&
        attempt.difficultyFocus !== "coordination",
    )
  ) {
    const sequenceOk = clean.some(
      (attempt) => attempt.difficultyFocus === "sequence" && attempt.correct === true && supportOf(attempt) === "none",
    );
    const structureOk = clean.some(
      (attempt) => attempt.difficultyFocus === "structure" && attempt.correct === true && supportOf(attempt) === "none",
    );
    if (!sequenceOk) {
      const sawSequence = clean.some((attempt) => attempt.difficultyFocus === "sequence");
      if (!sawSequence) {
        return advice({
          stage: "guided",
          title: "Check order on a short program",
          reason: "Separate parts were correct and a combined task was missed. A short program task checks order before placement or combining.",
          href: "/study/learning-habits?section=task",
          label: "Open the program task",
          confidence: "The combined miss is recorded. Order, placement, and coordination are still open.",
          orchestratorAction: "teach",
        });
      }
      const link = sixHref("teach", false);
      return advice({
        stage: "guided",
        title: "Order the steps in plain language",
        reason: "The program task missed the order. Arrange the steps in plain language, then translate them.",
        href: link.href,
        label: link.label,
        confidence: "The combined miss is recorded. Order, placement, and coordination are still open.",
        orchestratorAction: "teach",
      });
    }
    if (!structureOk) {
      const sawStructure = clean.some((attempt) => attempt.difficultyFocus === "structure");
      return advice({
        stage: "guided",
        title: "Place each part in the structure",
        reason: sawStructure
          ? "Order was correct. The miss is where a statement belongs, so practice placement before the whole program."
          : "Order was correct without a hint. The program task next asks where a statement belongs.",
        href: sawStructure ? "/study/six/hands-on-practice" : "/study/learning-habits?section=task",
        label: sawStructure ? "Open Six" : "Open the program task",
        orchestratorAction: "practice",
      });
    }
    return advice({
      stage: "revisit",
      title: "Assemble familiar parts",
      reason: "Order and placement were each correct without a hint. The remaining miss is on combining them.",
      href: "/study/six/hands-on-practice",
      label: "Open Six",
      confidence:
        misses("coordination").length >= 2
          ? "Repeated on the combined task. One later success would not close it."
          : "One combined-task miss. Another observation can change this.",
      orchestratorAction: "practice",
    });
  }
  if (focusStillOpen(clean, "sequence")) {
    const link = sixHref("teach", false);
    return advice({
      stage: "guided",
      title: "Order the steps in plain language",
      reason: "The recorded miss is about order. Arrange the steps before the full task.",
      href: link.href,
      label: link.label,
      orchestratorAction: "teach",
    });
  }
  if (focusStillOpen(clean, "structure")) {
    return advice({
      stage: "guided",
      title: "Place each part in the structure",
      reason: "The recorded miss is about where a statement belongs, not whether the statement is known.",
      href: "/study/six/hands-on-practice",
      label: "Open Six",
      orchestratorAction: "practice",
    });
  }
  if (focusStillOpen(clean, "differentiation")) {
    return advice({
      stage: "guided",
      title: "Contrast the two ideas",
      reason: "The recorded miss fits two ideas being used for each other's job.",
      href: "/study/six/detailed-explanation",
      label: "Open Six",
      orchestratorAction: "reteach",
    });
  }
  return null;
}

export function recommendProgression(doc: LearningHabitsDocument): ProgressionAdvice {
  const scored = doc.assessment.results.filter((row) => row.correct !== null);
  const follow = productionFollowUp(doc);
  if (follow) {
    return advice({
      stage: "guided",
      title: follow.title,
      reason: follow.reason,
      href: follow.href,
      label: follow.label,
      orchestratorAction: "practice",
    });
  }

  const focused = focusedDifficultyPlan(doc);
  if (focused) return focused;

  if (scored.length === 0) {
    const link = sixHref("teach", false);
    return advice({
      stage: "foundation",
      title: "Start with one concept",
      reason: "Teach what the idea means before combining it with a new situation. One later answer will not settle this.",
      href: link.href,
      label: link.label,
      orchestratorAction: "teach",
    });
  }

  const prerequisite = scored.find((row) => {
    const probe = probeById(row.templateId);
    if (!probe || row.correct !== false) return false;
    if (probe.stage !== "foundation" && probe.stage !== "guided") return false;
    return !unaidedCorrectOnConcept(doc, probe.conceptLabel);
  });
  if (prerequisite) {
    const probe = probeById(prerequisite.templateId);
    const link = sixHref("teach", false);
    return advice({
      stage: "revisit",
      title: "Teach the foundation first",
      reason: `${probe?.conceptLabel ?? "This idea"} is still a gap. Start with a short explanation before advanced practice. Earlier attempts stay on the record.`,
      href: link.href,
      label: link.label,
      orchestratorAction: "teach",
    });
  }

  const contradictory = scored.find((row) => row.reasoningQuality === "contradictory");
  if (contradictory) {
    return advice({
      stage: "independent",
      title: "The choice and the explanation disagree",
      reason: "A correct choice with an explanation that conflicts with the rule is a misconception to address, not proof the idea is understood.",
      href: "/study/six/feynman",
      label: "Explain it",
      orchestratorAction: "reteach",
    });
  }

  const partial = scored.find((row) => row.correct === false && row.reasoningQuality === "partial");
  if (partial) {
    return advice({
      stage: "guided",
      title: "Keep the useful part of the reasoning",
      reason: "Part of the explanation still fits the rule. The next step is the missing piece, not a restart of the subject.",
      href: "/study/six/detailed-explanation",
      label: "Explain the missing step",
      orchestratorAction: "reteach",
    });
  }

  const familiar = scored.some((row) => row.presentation === "familiar" && row.correct);
  const novelMiss = scored.some((row) => row.presentation === "novel" && row.correct === false);
  if (familiar && novelMiss) {
    return advice({
      stage: "transfer",
      title: "Connect the familiar case to the new one",
      reason: "Familiar success and a miss on a new situation stay separate. Show how the same principle applies in the new context.",
      href: "/study/practice-hub",
      label: "Practice",
      orchestratorAction: "practice",
    });
  }

  const unknownReasoning = scored.find((row) => {
    const probe = probeById(row.templateId);
    if (!probe?.explanationPrompt) return false;
    return row.reasoningQuality === "unknown" || row.reasoningQuality === "insufficient";
  });
  if (unknownReasoning) {
    return advice({
      stage: "independent",
      title: "Check the reason, not only the choice",
      reason: "A matching or missed choice without a sound explanation is not treated as understanding.",
      href: "/study/six/feynman",
      label: "Explain it",
      orchestratorAction: "practice",
    });
  }

  const detailMiss = scored.find((row) => row.factor === "detail" && row.correct === false);
  if (detailMiss) {
    return advice({
      stage: "variation",
      title: "Practice the detail that changed",
      reason: "The miss is about one meaningful detail. That does not require reteaching every earlier idea.",
      href: "/study/six/hands-on-practice",
      label: "Practice the detail",
      orchestratorAction: "practice",
    });
  }

  const supported = scored.filter((row) => supportOf(row) !== "none" && row.correct);
  const independent = scored.filter((row) => supportOf(row) === "none" && row.correct);
  if (supported.length > 0 && independent.length === 0) {
    return advice({
      stage: "independent",
      title: "Try the next check without a hint",
      reason: "A hint-assisted success is progress. It is not independent performance.",
      href: "/study/learning-habits?section=lab",
      label: "Return to the lab",
      orchestratorAction: "practice",
    });
  }

  const stages = new Set(
    independent.map((row) => probeById(row.templateId)?.stage).filter((stage): stage is ProbeStage => Boolean(stage)),
  );
  if (stages.size >= 2) {
    const link = sixHref("practice", false);
    return advice({
      stage: "transfer",
      title: "Increase one step, not several at once",
      reason: "Unaided success on more than one step supports a slightly harder task. It is not a permanent label.",
      href: link.href,
      label: link.label,
      confidence: "Preliminary. Another observation can still change it.",
      orchestratorAction: "practice",
    });
  }

  const delayed = doc.reviews.some((row) => row.countsAsDelayed && row.status === "completed");
  if (!delayed) {
    return advice({
      stage: "delayed",
      title: "Delayed retention is not measured yet",
      reason: "Same-session recall is not a later review. Waiting or skipping stays unmeasured, not failed.",
      href: "/study/lucky",
      label: "Open Lucky",
      orchestratorAction: "recall",
    });
  }

  return advice({
    stage: "guided",
    title: "Gather another observation",
    reason: "One check is not enough to move on. Another targeted activity comes before any stronger claim.",
    href: "/study/learning-habits?section=lab",
    label: "Return to the lab",
    orchestratorAction: "practice",
  });
}
