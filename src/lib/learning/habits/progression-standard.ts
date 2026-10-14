import { probeById } from "@/lib/learning/habits/catalog";
import type { LearningHabitsDocument } from "@/lib/learning/habits/document";

/**
 * Instructional capabilities. An activity uses the subset it can actually observe.
 * Delayed recall stays on the existing retention scheduler.
 */
export const PROGRESSION_CAPABILITIES = [
  "foundation",
  "worked-example",
  "supported",
  "variation",
  "integration",
  "reduced-support",
  "independent",
  "transfer",
  "delayed-recall",
] as const;

export type ProgressionCapability = (typeof PROGRESSION_CAPABILITIES)[number];
export type TaskSubject = "python" | "math";

const PYTHON_TRACK = [
  "py-component",
  "py-order-make",
  "py-place-make",
  "py-build-supported",
  "py-build-independent",
  "py-transfer-make",
] as const;

const MATH_TRACK = [
  "math-op",
  "math-order-make",
  "math-build-supported",
  "math-build-independent",
  "math-transfer-make",
] as const;

export function capabilitiesFor(subject: TaskSubject): ProgressionCapability[] {
  if (subject === "math") {
    return ["foundation", "worked-example", "supported", "integration", "independent", "transfer"];
  }
  return ["foundation", "worked-example", "supported", "integration", "reduced-support", "independent", "transfer"];
}

export function trackIds(subject: TaskSubject): readonly string[] {
  return subject === "math" ? MATH_TRACK : PYTHON_TRACK;
}

function answered(doc: LearningHabitsDocument, id: string): boolean {
  return doc.assessment.results.some((row) => row.templateId === id);
}

function productionRows(doc: LearningHabitsDocument, subject: TaskSubject) {
  return doc.assessment.results.filter((row) => {
    if (row.performanceKind !== "production" || row.instructionalIssue !== "none") return false;
    return probeById(row.templateId)?.subject === subject;
  });
}

export type ProductionFollowUp = {
  probeId: string;
  title: string;
  reason: string;
  href: string;
  label: string;
};

/**
 * The next practice that can record new evidence after a production miss.
 * One unaided success does not finish the skill.
 */
export function productionFollowUp(
  doc: LearningHabitsDocument,
  only?: TaskSubject,
): ProductionFollowUp | null {
  const subjects = only ? [only] : (["python", "math"] as const);
  for (const subject of subjects) {
    const rows = productionRows(doc, subject);
    if (!rows.length) continue;
    const href = `/study/learning-habits?section=task&subject=${subject}`;
    const sequenceMiss = rows.some((row) => row.difficultyFocus === "sequence" && row.correct === false);
    const sequenceUnaided = rows.filter(
      (row) => row.difficultyFocus === "sequence" && row.correct === true && row.supportLevel === "none",
    );
    const sequenceRetry = subject === "python" ? "py-order-supported" : "math-order-supported";
    if (sequenceMiss && sequenceUnaided.length === 0 && !answered(doc, sequenceRetry)) {
      return {
        probeId: sequenceRetry,
        title: "Arrange the steps with the example",
        reason: "The arrangement was missed. The next attempt can open an example. Opening it is recorded. Leaving it closed is not treated as using it.",
        href,
        label: "Continue the task",
      };
    }
    const orderPlainId = subject === "python" ? "py-order-plain" : "math-order-plain";
    if (sequenceMiss && sequenceUnaided.length === 0 && answered(doc, sequenceRetry) && !answered(doc, orderPlainId)) {
      const retry = doc.assessment.results.find((row) => row.templateId === sequenceRetry);
      const usedSupport = retry?.correct === true && retry.supportLevel !== "none";
      return {
        probeId: orderPlainId,
        title: "Arrange the steps without the example",
        reason: usedSupport
          ? "The example was opened and the arrangement was correct. The next check has no example on the page and does not finish the skill."
          : "The last arrangement is saved. The next check has no example on the page.",
        href,
        label: "Continue the task",
      };
    }
    const structureMiss = rows.some((row) => row.difficultyFocus === "structure" && row.correct === false);
    const structureUnaided = rows.filter(
      (row) => row.difficultyFocus === "structure" && row.correct === true && row.supportLevel === "none",
    );
    if (subject === "python" && structureMiss && structureUnaided.length === 0 && !answered(doc, "py-place-supported")) {
      return {
        probeId: "py-place-supported",
        title: "Place the lines with the example",
        reason: "The lines were put in the wrong part. Practice placement with the example before the whole program.",
        href,
        label: "Continue the task",
      };
    }
    const supportedBuild = rows.some(
      (row) => row.difficultyFocus === "coordination" && row.correct === true && row.supportLevel !== "none",
    );
    const independentMiss = rows.some(
      (row) => row.difficultyFocus === "independence" && row.correct === false && row.supportLevel === "none",
    );
    const buildPlainId = subject === "python" ? "py-build-plain" : "math-build-plain";
    if (supportedBuild && independentMiss && !answered(doc, buildPlainId)) {
      return {
        probeId: buildPlainId,
        title: "Try the build without the example",
        reason: "The supported build was correct. The unaided build was not, so the next attempt is another build with no example.",
        href,
        label: "Continue the task",
      };
    }
    if (sequenceMiss && sequenceUnaided.length >= 1) {
      const nextId = trackIds(subject).find((id) => !answered(doc, id));
      const next = nextId ? probeById(nextId) : null;
      if (next) {
        return {
          probeId: next.id,
          title: next.title,
          reason: "One unaided arrangement is recorded. It does not finish the skill. The next check is the following step.",
          href,
          label: "Continue the task",
        };
      }
    }
  }
  return null;
}

export function nextTrackProbe(doc: LearningHabitsDocument, subject: TaskSubject) {
  const follow = productionFollowUp(doc, subject);
  if (follow && !answered(doc, follow.probeId)) {
    return probeById(follow.probeId) ?? null;
  }
  return trackIds(subject).map((id) => probeById(id)).find((probe) => probe && !answered(doc, probe.id)) ?? null;
}

export function taskTrackComplete(doc: LearningHabitsDocument, subject: TaskSubject): boolean {
  const follow = productionFollowUp(doc, subject);
  if (follow) return false;
  return trackIds(subject).every((id) => answered(doc, id));
}

export function taskTrackStarted(doc: LearningHabitsDocument, subject: TaskSubject): boolean {
  return trackIds(subject).some((id) => answered(doc, id));
}
