import { probeById } from "@/lib/learning/habits/catalog";
import { taskTrackComplete, taskTrackStarted } from "@/lib/learning/habits/progression-standard";
import type { ExperimentAttempt, LearningHabitsDocument } from "@/lib/learning/habits/document";
import { recommendProgression, type ProgressionAdvice } from "@/lib/learning/habits/progression";

export type DiagnosticStep = {
  title: string;
  why: string;
  href: string;
};

export type DiagnosticReport = {
  noticing: string;
  strengths: string;
  breakdown: string;
  suggests: string;
  notEstablished: string;
  approach: string;
  check: string;
  /** Short sequence. The first step is the current recommendation. */
  steps: DiagnosticStep[];
  confidence: "repeated" | "emerging" | "revised" | "insufficient";
};


function scored(doc: LearningHabitsDocument): ExperimentAttempt[] {
  return doc.assessment.results
    .filter((attempt) => attempt.correct !== null)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at));
}

function clean(attempts: ExperimentAttempt[]): ExperimentAttempt[] {
  return attempts.filter((attempt) => attempt.instructionalIssue === "none");
}

function label(attempt: ExperimentAttempt): string {
  return probeById(attempt.templateId)?.title ?? attempt.templateId;
}

/**
 * A working hypothesis from recorded attempts. It does not assign a learning
 * style, a permanent ability, or a cause the attempts do not support.
 */
export function buildDiagnosticReport(doc: LearningHabitsDocument): DiagnosticReport | null {
  const attempts = scored(doc);
  if (!attempts.length) return null;
  const usable = clean(attempts);
  const tainted = attempts.filter((attempt) => attempt.instructionalIssue !== "none");
  const next = recommendProgression(doc);
  const strengths = strengthLine(usable);
  const coordination = coordinationFinding(usable);

  if (tainted.length && !usable.some((attempt) => attempt.correct === false)) {
    return {
      noticing: "A miss is on record, and that item was marked as an instructional or task problem.",
      strengths: strengths || "No separate successful attempt is on record yet.",
      breakdown: tainted.map((attempt) => `${label(attempt)} (${attempt.instructionalIssue})`).join("; "),
      suggests: "The confusion may come from the earlier explanation or the task, so it is not treated as evidence that the learner misunderstood the idea.",
      notEstablished: "What the learner can do on a corrected item has not been checked.",
      approach: `${next.title}. ${next.reason}`,
      check: "A later attempt on a corrected item, with the earlier problem no longer in the prompt.",
      steps: [{ title: next.title, why: next.reason, href: next.href }],
      confidence: "insufficient",
    };
  }

  if (coordination) return withNext(coordination, strengths, next);
  const specific = repeatedFocus(usable, ["sequence", "structure", "differentiation"]);
  if (specific) return withNext(specific, strengths, next);
  const reasoning = reasoningFinding(usable);
  if (reasoning) return withNext(reasoning, strengths, next);
  const focused = repeatedFocus(usable, ["precision", "transfer", "concept"]);
  if (focused) return withNext(focused, strengths, next);

  const correct = usable.filter((attempt) => attempt.correct).length;
  const missed = usable.filter((attempt) => !attempt.correct).length;
  const independence = independenceFinding(usable);
  if (independence) return withNext(independence, strengths, next);

  if (missed === 1 && correct >= 1) return null;
  if (!missed) return null;
  if (missed === 1) return null;
  return {
    noticing: "Some attempts were missed. The record does not yet isolate one kind of difficulty.",
    strengths: strengths || "No unaided success is on record yet.",
    breakdown: "The misses are not concentrated on one recorded focus.",
    suggests: "Several explanations remain possible.",
    notEstablished: "Which step inside the task is responsible.",
    approach: `${next.title}. ${next.reason}`,
    check: "A smaller follow-up that changes only one part of the task.",
    steps: [{ title: next.title, why: next.reason, href: next.href }],
    confidence: "insufficient",
  };
}

export function taskActivityComplete(doc: LearningHabitsDocument): boolean {
  return taskTrackComplete(doc, "python") || taskTrackComplete(doc, "math");
}

function taskActivityStarted(doc: LearningHabitsDocument): boolean {
  const pythonOpen = taskTrackStarted(doc, "python") && !taskTrackComplete(doc, "python");
  const mathOpen = taskTrackStarted(doc, "math") && !taskTrackComplete(doc, "math");
  return pythonOpen || mathOpen;
}

/** Shown on My Results after the lab or the program task is finished. Hidden while the program task is in progress. */
export function reportForResults(doc: LearningHabitsDocument): DiagnosticReport | null {
  if (taskActivityStarted(doc) && !taskActivityComplete(doc)) return null;
  if (doc.assessment.status !== "completed" && !taskActivityComplete(doc)) return null;
  return buildDiagnosticReport(doc);
}

function withNext(
  partial: Omit<DiagnosticReport, "approach" | "strengths" | "steps"> & { strengths?: string; steps?: DiagnosticStep[] },
  strengths: string,
  next: ProgressionAdvice,
): DiagnosticReport {
  const steps = partial.steps?.length
    ? partial.steps
    : [{ title: next.title, why: next.reason, href: next.href }];
  return {
    ...partial,
    strengths: partial.strengths || strengths,
    approach: `${next.title}. ${next.reason}`,
    steps,
  };
}

function strengthLine(attempts: ExperimentAttempt[]): string {
  const wins = attempts.filter((attempt) => attempt.correct && attempt.supportLevel === "none");
  if (!wins.length) {
    const assisted = attempts.filter((attempt) => attempt.correct && attempt.supportLevel !== "none");
    if (!assisted.length) return "";
    return `Correct with support: ${assisted.map(label).join("; ")}. Independent success is not on record for those items.`;
  }
  const produced = wins.filter((attempt) => attempt.performanceKind === "production");
  const recognized = wins.filter((attempt) => attempt.performanceKind === "recognition");
  const parts = [`Correct without a hint: ${wins.map(label).join("; ")}.`];
  if (produced.length) parts.push(`Produced without a hint: ${produced.map(label).join("; ")}.`);
  if (recognized.length && !produced.length) {
    parts.push("Recognition is not independent production.");
  }
  return parts.join(" ");
}

function laterUnaided(attempts: ExperimentAttempt[], focus: string, after: string): ExperimentAttempt[] {
  const cutoff = +new Date(after);
  return attempts.filter(
    (attempt) =>
      attempt.difficultyFocus === focus &&
      attempt.correct === true &&
      attempt.supportLevel === "none" &&
      +new Date(attempt.at) > cutoff,
  );
}

function unaidedFocus(attempts: ExperimentAttempt[], focus: string): boolean {
  return attempts.some(
    (attempt) => attempt.difficultyFocus === focus && attempt.correct === true && attempt.supportLevel === "none",
  );
}

function assemblyStage(attempts: ExperimentAttempt[]): "order" | "place" | "assemble" {
  if (!unaidedFocus(attempts, "sequence")) return "order";
  if (!unaidedFocus(attempts, "structure")) return "place";
  return "assemble";
}

function assemblySteps(attempts: ExperimentAttempt[]): DiagnosticStep[] {
  const sawSequence = attempts.some((attempt) => attempt.difficultyFocus === "sequence");
  const sawStructure = attempts.some((attempt) => attempt.difficultyFocus === "structure");
  const steps: DiagnosticStep[] = [];
  if (!unaidedFocus(attempts, "sequence")) {
    steps.push({
      title: sawSequence ? "Order the steps in plain language" : "Check order on a short program",
      why: sawSequence
        ? "Order was missed. Arrange the steps in plain language, then translate them."
        : "Order has not been checked on its own.",
      href: sawSequence ? "/study/six/chunking" : "/study/learning-habits?section=task",
    });
  }
  if (!unaidedFocus(attempts, "structure")) {
    steps.push({
      title: "Place each part in the structure",
      why: "Checks where a statement belongs.",
      href: sawStructure ? "/study/six/hands-on-practice" : "/study/learning-habits?section=task",
    });
  }
  steps.push({
    title: "Assemble familiar parts",
    why: "Combines known parts after order and placement.",
    href: "/study/six/hands-on-practice",
  });
  return steps;
}

function coordinationFinding(
  attempts: ExperimentAttempt[],
): Omit<DiagnosticReport, "approach" | "strengths"> | null {
  const misses = attempts.filter((attempt) => attempt.difficultyFocus === "coordination" && attempt.correct === false);
  if (!misses.length) return null;
  const parts = attempts.filter(
    (attempt) =>
      attempt.correct === true &&
      attempt.supportLevel === "none" &&
      attempt.difficultyFocus &&
      attempt.difficultyFocus !== "coordination",
  );
  if (!parts.length) return null;
  const recovered = laterUnaided(attempts, "coordination", misses[misses.length - 1]!.at);
  if (recovered.length >= 2) {
    return {
      noticing: "Earlier combined tasks were missed after the separate parts were correct. Two later independent combined attempts were correct.",
      breakdown: `Combined-task misses: ${misses.map(label).join("; ")}.`,
      suggests: "The earlier gap was combining known parts. Two later successes weaken that hypothesis. They do not erase the earlier misses.",
      notEstablished: "Whether the combined task holds on a new example without support.",
      check: "One combined task in a changed situation, without a hint.",
      steps: [],
      confidence: "revised",
    };
  }
  const stage = assemblyStage(attempts);
  const openCause =
    "The record does not yet say whether the problem is the order of the steps, where each part belongs, or keeping several requirements in play at once.";
  return {
    noticing:
      recovered.length === 1
        ? "Separate parts were correct, and the combined task was missed. One later independent success does not close that gap."
        : "Separate parts were correct. The difficulty shows up when those parts are used together.",
    breakdown: `Combined-task misses: ${misses.map(label).join("; ")}. Separate correct parts: ${parts.map(label).join("; ")}.`,
    suggests:
      stage === "assemble"
        ? misses.length >= 2
          ? "Order and placement were each correct without a hint. The repeated miss is on combining them."
          : "Order and placement were each correct without a hint. The remaining miss is on combining them. One miss can still be a slip."
        : misses.length >= 2
          ? `The combined task was missed more than once. ${openCause}`
          : `Separate answers were correct. ${openCause} A targeted assembly task has to come before choosing one explanation.`,
    notEstablished:
      stage === "assemble"
        ? recovered.length
          ? "A second independent combined success."
          : "Whether the same combined miss happens again."
        : stage === "place"
          ? "Where each part belongs. Combining is not the conclusion yet."
          : "Which of order, placement, or coordination fits. Those have not been checked separately.",
    check:
      stage === "assemble"
        ? "Assemble two familiar parts, then add one requirement, without a hint."
        : "The next activity changes only the unchecked step.",
    steps: assemblySteps(attempts),
    confidence: misses.length >= 2 ? "repeated" : "emerging",
  };
}

function reasoningFinding(attempts: ExperimentAttempt[]): Omit<DiagnosticReport, "approach" | "strengths"> | null {
  const contradictory = attempts.filter((attempt) => attempt.reasoningQuality === "contradictory");
  if (contradictory.length) {
    return {
      noticing: "A choice and the written explanation do not agree.",
      breakdown: contradictory.map(label).join("; "),
      suggests: "The matching choice is not treated as understanding when the explanation conflicts with the rule.",
      notEstablished: "Whether a corrected explanation changes the next answer.",
      check: "Explain the same idea again without the conflicting reason.",
      steps: [],
      confidence: contradictory.length >= 2 ? "repeated" : "emerging",
    };
  }
  const partial = attempts.filter((attempt) => attempt.correct === false && attempt.reasoningQuality === "partial");
  if (partial.length) {
    return {
      noticing: "Part of the explanation fits, and the answer was still missed.",
      breakdown: partial.map(label).join("; "),
      suggests: "This fits a missing piece inside a reason that is partly available. It is not a restart of the subject.",
      notEstablished: "Whether the missing piece was a slip or a repeated gap.",
      check: "One more attempt aimed at the missing piece.",
      steps: [],
      confidence: partial.length >= 2 ? "repeated" : "emerging",
    };
  }
  return null;
}

function independenceFinding(attempts: ExperimentAttempt[]): Omit<DiagnosticReport, "approach" | "strengths"> | null {
  const missed = attempts.some((attempt) => attempt.correct === false);
  if (missed) return null;
  const assisted = attempts.filter((attempt) => attempt.correct && attempt.supportLevel !== "none");
  const unaided = attempts.some((attempt) => attempt.correct && attempt.supportLevel === "none");
  if (!assisted.length || unaided) return null;
  return {
    noticing: "The recorded successes used a hint or a worked example.",
    breakdown: `Correct with support: ${assisted.map(label).join("; ")}.`,
    suggests: "Support dependence is possible. Independent performance is not on record.",
    notEstablished: "The same items without a hint.",
    check: "One later attempt with no hint and no worked example.",
    steps: [],
    confidence: "emerging",
  };
}

function repeatedFocus(
  attempts: ExperimentAttempt[],
  order: readonly ("sequence" | "structure" | "differentiation" | "precision" | "transfer" | "concept")[],
): Omit<DiagnosticReport, "approach" | "strengths"> | null {
  for (const focus of order) {
    const misses = attempts.filter((attempt) => attempt.difficultyFocus === focus && attempt.correct === false);
    const hits = attempts.filter((attempt) => attempt.difficultyFocus === focus && attempt.correct === true);
    if (!misses.length) continue;
    if (hits.length && misses.length === 1) {
      return {
        noticing: `The ${focus} attempts disagree: some were correct and one was not.`,
        breakdown: `Miss: ${misses.map(label).join("; ")}. Correct on the same focus: ${hits.map(label).join("; ")}.`,
        suggests: "Competing evidence. A difficulty is not identified from one miss beside a success.",
        notEstablished: "Which of the two results repeats.",
        check: "One more item with the same focus, without adding a new difficulty.",
        steps: [],
        confidence: "insufficient",
      };
    }
    const recovered = laterUnaided(attempts, focus, misses[misses.length - 1]!.at);
    if (recovered.length >= 2) {
      return {
        noticing: `Earlier ${focus} attempts were missed. Two later independent attempts on that focus were correct.`,
        breakdown: `Earlier misses remain: ${misses.map(label).join("; ")}.`,
        suggests: "The hypothesis is weaker. It is not marked resolved.",
        notEstablished: "Whether it holds without support on a changed example.",
        check: "Leave this focus and move one step forward.",
        steps: [],
        confidence: "revised",
      };
    }
    if (focus === "transfer" && !attempts.some((attempt) => attempt.presentation === "familiar" && attempt.correct)) {
      continue;
    }
    if (
      misses.length < 2 &&
      focus !== "transfer" &&
      focus !== "sequence" &&
      focus !== "structure" &&
      focus !== "differentiation"
    ) {
      continue;
    }
    return {
      noticing:
        focus === "transfer"
          ? "A familiar case and a changed case do not tell the same story."
          : misses.length >= 2
            ? `More than one ${focus} attempt was missed.`
            : `One ${focus} attempt was missed. That is an early hypothesis, not a settled difficulty.`,
      breakdown: misses.map(label).join("; "),
      suggests: suggestionFor(focus),
      notEstablished: "Other focuses that were not in these attempts.",
      check: "The next activity should change this step only.",
      steps: [],
      confidence: misses.length >= 2 ? "repeated" : "emerging",
    };
  }
  return null;
}

function suggestionFor(focus: string): string {
  switch (focus) {
    case "sequence":
      return "The pattern fits trouble with order. It does not show that each separate step is unknown.";
    case "structure":
      return "The pattern fits trouble with where a part belongs. It does not show that the part itself is unknown.";
    case "differentiation":
      return "The pattern fits confusion between two ideas that do different jobs.";
    case "precision":
      return "The pattern fits a missed condition or detail inside an approach that is otherwise available.";
    case "transfer":
      return "Success on a familiar case does not establish the same idea in a changed case.";
    default:
      return "The misses cluster on the idea itself. A more specific step has not been isolated.";
  }
}
