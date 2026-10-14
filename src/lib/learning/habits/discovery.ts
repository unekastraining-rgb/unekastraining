/**
 * Self-report discovery and preliminary hypotheses.
 * Selections are experiences, not learning-style labels or measured performance.
 */

import type { LearningHabitsDocument } from "./document";

export type LearningExperience = {
  id: string;
  title: string;
  detail: string;
  kind: "preference" | "challenge";
  /** What a selection may suggest. Not a diagnosis. */
  maySuggest: string;
};

export const LEARNING_EXPERIENCES: LearningExperience[] = [
  {
    id: "why",
    title: "It clicks when someone explains WHY it works.",
    detail: "I need the reasoning behind the steps, not just instructions to follow.",
    kind: "preference",
    maySuggest: "Explanations that include the reason for each step may be worth trying.",
  },
  {
    id: "examples",
    title: "I need to see several examples first.",
    detail: "Patterns become clearer after I see the idea demonstrated in action.",
    kind: "preference",
    maySuggest: "Worked examples may help you recognize a pattern before you try it alone.",
  },
  {
    id: "doing",
    title: "I learn by doing it myself.",
    detail: "Practice, experimenting, and working through problems help me understand.",
    kind: "preference",
    maySuggest: "Hands-on practice may be a useful early step, still to be checked against results.",
  },
  {
    id: "comparisons",
    title: "Comparisons and real-life examples help me understand.",
    detail: "Connecting an unfamiliar concept to something I already know makes it easier to grasp.",
    kind: "preference",
    maySuggest: "Analogies and familiar situations may make a new idea easier to enter.",
  },
  {
    id: "forget-later",
    title: "I understand it now, but forget it later.",
    detail: "The information makes sense while I am studying, but I struggle to remember it afterward.",
    kind: "challenge",
    maySuggest: "Delayed recall is a possible challenge. It has not been measured yet.",
  },
  {
    id: "familiar-not-new",
    title: "I can solve familiar problems but struggle with new ones.",
    detail: "I can follow a pattern I recognize, but applying the same idea in an unfamiliar situation is harder.",
    kind: "challenge",
    maySuggest: "Transfer to a new situation is a possible challenge worth a direct test.",
  },
  {
    id: "overwhelm",
    title: "Too much information at once overwhelms me.",
    detail: "I understand more when information is broken into manageable pieces.",
    kind: "challenge",
    maySuggest: "Smaller chunks may help. A dense and a chunked version of the same idea can test that.",
  },
  {
    id: "details",
    title: "I need to understand the details before I feel confident.",
    detail: "I want to know what each part means before putting everything together.",
    kind: "preference",
    maySuggest: "Naming each part before combining them may match how you like to start.",
  },
  {
    id: "forget-next-day",
    title: "I understand while practicing but forget the next day.",
    detail: "I need help making what I learn stick beyond the current study session.",
    kind: "challenge",
    maySuggest: "A next-day recall check can show whether practice stuck, or only felt familiar in the moment.",
  },
  {
    id: "explain",
    title: "I have trouble explaining what I understand.",
    detail: "I may recognize the correct answer but struggle to explain the idea in my own words.",
    kind: "challenge",
    maySuggest: "Teach-back may reveal a gap between recognizing an answer and explaining it.",
  },
  {
    id: "symbols-change",
    title: "I get lost when the symbols, wording, or examples change.",
    detail: "A concept may make sense in one format but become harder when presented differently.",
    kind: "challenge",
    maySuggest: "A small, meaningful change in symbols or wording is a useful thing to test.",
  },
  {
    id: "think-time",
    title: "I need time to think through a problem.",
    detail: "I understand better when I can pause, reason through the information, and work at a manageable pace.",
    kind: "preference",
    maySuggest: "Unhurried reasoning may matter more than a faster explanation.",
  },
];

const EXPERIENCE_IDS = new Set(LEARNING_EXPERIENCES.map((item) => item.id));

export function experienceById(id: string): LearningExperience | undefined {
  return LEARNING_EXPERIENCES.find((item) => item.id === id);
}

export function sanitizeExperienceIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => EXPERIENCE_IDS.has(id)))];
}

export type Hypothesis = {
  id: string;
  title: string;
  why: string;
  label: "Early hypothesis" | "Some supporting evidence" | "Needs more testing";
  nextExperimentId: string;
  nextTitle: string;
  nextWhy: string;
};

export type JourneyStage = {
  id: string;
  label: string;
  state: "done" | "current" | "upcoming";
};

export type EvidenceChart = {
  id: string;
  title: string;
  summary: string;
  ready: boolean;
  empty: string;
  rows: Array<{ label: string; filled: number; total: number; detail: string }>;
};

function selected(doc: LearningHabitsDocument): LearningExperience[] {
  return doc.discovery.selectedIds
    .map(experienceById)
    .filter((item): item is LearningExperience => Boolean(item));
}

function scored(doc: LearningHabitsDocument) {
  return doc.assessment.results.filter((row) => row.correct !== null);
}

function countPresentation(doc: LearningHabitsDocument, presentation: string) {
  const rows = scored(doc).filter((row) => row.presentation === presentation);
  return {
    total: rows.length,
    filled: rows.filter((row) => row.correct).length,
  };
}

export function buildHypotheses(doc: LearningHabitsDocument): Hypothesis[] {
  const ids = new Set(doc.discovery.selectedIds);
  const out: Hypothesis[] = [];
  function label(relevant: number): Hypothesis["label"] {
    if (relevant <= 0) return "Early hypothesis";
    if (relevant < 3) return "Needs more testing";
    return "Some supporting evidence";
  }

  const transferChecks =
    countPresentation(doc, "familiar").total + countPresentation(doc, "novel").total;
  const chunkChecks =
    countPresentation(doc, "chunked").total + countPresentation(doc, "dense").total;
  const recallChecks = scored(doc).filter((row) => row.performanceKind === "recall").length;

  if (ids.has("examples") && ids.has("familiar-not-new")) {
    out.push({
      id: "examples-transfer",
      title: "Worked examples may help you recognize a pattern",
      why: "You selected both “I need to see several examples first” and “I can solve familiar problems but struggle with new ones.” This may indicate that worked examples help you recognize patterns, but transferring those patterns to unfamiliar problems deserves further investigation.",
      label: label(transferChecks),
      nextExperimentId: "worked-vs-independent",
      nextTitle: "Worked examples, then a new problem",
      nextWhy: "This checks whether a familiar pattern still works when the situation changes.",
    });
  }
  if (ids.has("overwhelm")) {
    out.push({
      id: "chunking",
      title: "Smaller pieces may be easier to hold",
      why: "You reported that too much information at once is overwhelming. That is a preference to test, not proof that chunking works better for you.",
      label: label(chunkChecks),
      nextExperimentId: "chunk-vs-dense",
      nextTitle: "Chunked explanation versus one dense explanation",
      nextWhy: "Both versions teach the same idea so the comparison stays about the amount shown at once.",
    });
  }
  if (ids.has("forget-later") || ids.has("forget-next-day")) {
    out.push({
      id: "delay",
      title: "Understanding in the moment may not mean you will recall it later",
      why: "You described remembering during study and losing it afterward. A skipped or future review stays unknown until you actually try to recall it.",
      label: label(recallChecks),
      nextExperimentId: "delayed-review",
      nextTitle: "Recall after a delay",
      nextWhy: "This separates “I understood it then” from “I can retrieve it later.”",
    });
  }
  if (ids.has("why")) {
    out.push({
      id: "reasoning",
      title: "The reason for a step may matter as much as the step",
      why: "You said it clicks when someone explains why it works. We can compare a bare procedure with an explanation of the purpose of each step.",
      label: label(scored(doc).filter((row) => row.factor === "understanding").length),
      nextExperimentId: "worked-vs-independent",
      nextTitle: "Explain why, then try it",
      nextWhy: "The goal is to see whether reasoning helps you solve a problem, not only follow one.",
    });
  }
  if (ids.has("symbols-change") || ids.has("details")) {
    out.push({
      id: "details",
      title: "A change in symbols or wording may be the hard part",
      why: "You reported sensitivity to details or to a change in how the idea is written. That points to a detail check, not a label about how you learn in every subject.",
      label: label(scored(doc).filter((row) => row.factor === "detail").length),
      nextExperimentId: "chunk-vs-dense",
      nextTitle: "Same rule, one meaningful change",
      nextWhy: "The change has to matter to the concept. It is not a trick question.",
    });
  }
  if (out.length === 0 && ids.size > 0) {
    const first = selected(doc)[0];
    out.push({
      id: "open",
      title: "A starting point from what you noticed",
      why: first
        ? `You selected “${first.title}” ${first.maySuggest}`
        : "You shared a note. We will treat it as something to investigate, not as a measured result.",
      label: "Early hypothesis",
      nextExperimentId: "chunk-vs-dense",
      nextTitle: "Start with one short comparison",
      nextWhy: "One activity gives a first observation. It does not settle how you learn.",
    });
  }
  return out.slice(0, 4);
}

export function journeyStages(doc: LearningHabitsDocument): JourneyStage[] {
  const discovered = doc.discovery.analyzedAt != null || doc.discovery.selectedIds.length > 0;
  const hypothesized = doc.discovery.analyzedAt != null;
  const experimented =
    doc.experiments.some((item) => item.status !== "suggested") ||
    doc.assessment.results.length > 0;
  const observed = scored(doc).length > 0;
  const compared = new Set(scored(doc).map((row) => row.factor)).size > 1;
  const refined = observed && doc.discovery.analyzedAt != null && compared;
  const applied = doc.settings.tutorPersonalization && refined;
  const flags = [discovered, hypothesized, experimented, observed, compared, refined, applied];
  const labels = ["Discover", "Hypothesize", "Experiment", "Observe", "Compare", "Refine", "Apply"];
  const ids = ["discover", "hypothesize", "experiment", "observe", "compare", "refine", "apply"];
  const current = flags.findIndex((flag) => !flag);
  return labels.map((label, index) => ({
    id: ids[index]!,
    label,
    state: flags[index] ? "done" : index === current ? "current" : "upcoming",
  }));
}

export function evidenceCharts(doc: LearningHabitsDocument): EvidenceChart[] {
  const attempts = doc.assessment.results;
  const timelineReady = attempts.length > 0;
  const byPresentation = new Map<string, { filled: number; total: number }>();
  for (const row of scored(doc)) {
    const current = byPresentation.get(row.presentation) ?? { filled: 0, total: 0 };
    current.total += 1;
    if (row.correct) current.filled += 1;
    byPresentation.set(row.presentation, current);
  }
  const familiar = countPresentation(doc, "familiar");
  const novel = countPresentation(doc, "novel");
  const delayed = doc.reviews.filter((row) => row.countsAsDelayed && row.status === "completed" && row.outcome != null);
  const immediate = scored(doc);
  return [
    {
      id: "timeline",
      title: "Evidence timeline",
      summary: timelineReady
        ? `${attempts.length} recorded probe${attempts.length === 1 ? "" : "s"}. Skipped items stay unknown.`
        : "No probes recorded yet.",
      ready: timelineReady,
      empty: "The timeline appears after you complete or skip a learning probe.",
      rows: attempts.slice(-6).map((row) => ({
        label: row.presentation,
        filled: row.correct ? 1 : 0,
        total: row.correct === null ? 0 : 1,
        detail:
          row.correct === null
            ? `${row.at} · skipped · unknown`
            : `${row.at} · ${row.correct ? "met the check" : "missed the check"} · ${row.performanceKind}`,
      })),
    },
    {
      id: "approaches",
      title: "Checked approaches",
      summary:
        byPresentation.size >= 2
          ? "Correct checks out of scored attempts for each presentation. This is not a learning-style score."
          : "Need scored attempts in at least two presentations.",
      ready: byPresentation.size >= 2,
      empty: "A comparison appears after two different presentations have a scored result.",
      rows: [...byPresentation.entries()].map(([label, row]) => ({
        label,
        filled: row.filled,
        total: row.total,
        detail: `${row.filled} of ${row.total} scored checks`,
      })),
    },
    {
      id: "transfer",
      title: "Familiar problem versus a new one",
      summary:
        familiar.total > 0 && novel.total > 0
          ? "Same idea of transfer: a familiar application compared with a new scenario."
          : "Both a familiar task and a new scenario need a scored result.",
      ready: familiar.total > 0 && novel.total > 0,
      empty: "This comparison stays hidden until both a familiar task and a new scenario are scored.",
      rows: [
        { label: "Familiar", filled: familiar.filled, total: familiar.total, detail: "Pattern you have seen" },
        { label: "New scenario", filled: novel.filled, total: novel.total, detail: "Same idea, different situation" },
      ],
    },
    {
      id: "delay",
      title: "In the moment versus a later review",
      summary:
        delayed.length > 0 && immediate.length > 0
          ? "Only a review completed after it was scheduled counts as delayed recall."
          : "No completed delayed review yet. A recall challenge in the same sitting is not a retention pattern.",
      ready: delayed.length > 0 && immediate.length > 0,
      empty: "A later review has to be completed before this view can say anything about retention.",
      rows: [
        {
          label: "Same sitting",
          filled: immediate.filter((row) => row.correct).length,
          total: immediate.length,
          detail: "Not a retention claim",
        },
        {
          label: "Later review",
          filled: delayed.filter((row) => row.outcome === "SUCCESS").length,
          total: delayed.length,
          detail: "Completed after it was scheduled",
        },
      ],
    },
  ];
}

export function primaryExperiment(doc: LearningHabitsDocument) {
  const recallDone = scored(doc).some((row) => row.performanceKind === "recall");
  const transferDone =
    countPresentation(doc, "familiar").total > 0 && countPresentation(doc, "novel").total > 0;
  const chunkDone =
    countPresentation(doc, "chunked").total > 0 && countPresentation(doc, "dense").total > 0;
  const reasoningDone = scored(doc).some((row) => row.factor === "understanding");
  const detailDone = scored(doc).some((row) => row.factor === "detail");
  const hypothesis = buildHypotheses(doc).find((item) => {
    if (item.id === "delay" && recallDone) return false;
    if (item.id === "examples-transfer" && transferDone) return false;
    if (item.id === "chunking" && chunkDone) return false;
    if (item.id === "reasoning" && reasoningDone) return false;
    if (item.id === "details" && detailDone) return false;
    return true;
  });
  if (!hypothesis) return null;
  return {
    templateId: hypothesis.nextExperimentId,
    title: hypothesis.nextTitle,
    why: hypothesis.nextWhy,
    hypothesis: hypothesis.title,
  };
}
