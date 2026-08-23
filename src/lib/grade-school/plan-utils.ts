import type { GradeSchoolLearningStep, PlanPhase, SkillTrack } from "@/lib/syllabus/types";

export function parseSubjectsInput(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isComprehensiveProfile(input: {
  strugglingWith?: string | null;
  subjects?: string[];
}): boolean {
  const struggle = input.strugglingWith?.trim() ?? "";
  const subjectCount = input.subjects?.length ?? 0;
  return struggle.length >= 120 || subjectCount > 1 || struggle.split(/[,;\n]/).length >= 4;
}

export function groupStepsByTrack(
  steps: GradeSchoolLearningStep[],
  tracks?: SkillTrack[],
): Array<{ track: string; domain: string; steps: Array<{ step: GradeSchoolLearningStep; index: number }> }> {
  const trackOrder = tracks?.map((track) => track.name) ?? [];
  const groups = new Map<
    string,
    { track: string; domain: string; steps: Array<{ step: GradeSchoolLearningStep; index: number }> }
  >();

  steps.forEach((step, index) => {
    const trackName = step.skillTrack?.trim() || step.skillFocus?.trim() || "General practice";
    const domain =
      step.domain?.trim() ||
      tracks?.find((track) => track.name === trackName)?.domain ||
      "other";

    const existing = groups.get(trackName) ?? { track: trackName, domain, steps: [] };
    existing.steps.push({ step, index });
    groups.set(trackName, existing);
  });

  const ordered = [...groups.values()].sort((a, b) => {
    const aIndex = trackOrder.indexOf(a.track);
    const bIndex = trackOrder.indexOf(b.track);
    if (aIndex === -1 && bIndex === -1) return a.track.localeCompare(b.track);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return ordered;
}

export function domainEmoji(domain: string): string {
  switch (domain) {
    case "reading":
      return "📖";
    case "math":
      return "🔢";
    case "writing":
      return "✍️";
    case "science":
      return "🔬";
    case "foundational":
      return "🧠";
    default:
      return "🌟";
  }
}

/** Use AI phases when present; otherwise split steps into weekly chunks. */
export function resolvePlanPhases(
  steps: GradeSchoolLearningStep[],
  phases?: PlanPhase[],
): PlanPhase[] {
  if (phases?.length) {
    return phases
      .map((phase, index) => ({
        title: phase.title || `Week ${phase.weekNumber || index + 1}`,
        focus: phase.focus || "",
        weekNumber: phase.weekNumber || index + 1,
        priorityTracks: phase.priorityTracks ?? [],
        stepIndices: (phase.stepIndices ?? []).filter(
          (i) => i >= 0 && i < steps.length,
        ),
      }))
      .filter((phase) => phase.stepIndices.length > 0);
  }

  if (steps.length === 0) return [];

  const weekCount = steps.length >= 12 ? 4 : steps.length >= 8 ? 3 : 2;
  const chunkSize = Math.ceil(steps.length / weekCount);
  const result: PlanPhase[] = [];

  for (let week = 0; week < weekCount; week++) {
    const start = week * chunkSize;
    const end = Math.min(steps.length, start + chunkSize);
    if (start >= end) break;

    const indices = Array.from({ length: end - start }, (_, i) => start + i);
    const tracks = [
      ...new Set(
        indices
          .map((i) => steps[i]?.skillTrack || steps[i]?.skillFocus)
          .filter(Boolean),
      ),
    ] as string[];

    result.push({
      title:
        week === 0
          ? "Phase 1: Build foundations"
          : week === weekCount - 1
            ? `Phase ${week + 1}: Celebrate growth`
            : `Phase ${week + 1}: Practice & connect`,
      focus:
        week === 0
          ? "Warm-up and core skills"
          : week === weekCount - 1
            ? "Review, check understanding, celebrate wins"
            : "Apply skills across subjects",
      weekNumber: week + 1,
      priorityTracks: tracks.slice(0, 4),
      stepIndices: indices,
    });
  }

  return result;
}

export function phaseProgress(
  phase: PlanPhase,
  completedSteps: number[],
): { done: number; total: number; pct: number } {
  const total = phase.stepIndices.length;
  const done = phase.stepIndices.filter((i) => completedSteps.includes(i)).length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export interface TrackProgressSummary {
  track: string;
  domain: string;
  done: number;
  total: number;
  pct: number;
  status: "not_started" | "in_progress" | "strong";
}

/** How each skill track is progressing based on completed lesson indices. */
export function summarizeTrackProgress(
  steps: GradeSchoolLearningStep[],
  completedSteps: number[],
  tracks?: SkillTrack[],
): TrackProgressSummary[] {
  const byTrack = new Map<string, { domain: string; indices: number[] }>();

  steps.forEach((step, index) => {
    const track = step.skillTrack?.trim() || step.skillFocus?.trim() || "General practice";
    const domain =
      step.domain?.trim() ||
      tracks?.find((t) => t.name === track)?.domain ||
      "other";
    const existing = byTrack.get(track) ?? { domain, indices: [] };
    existing.indices.push(index);
    byTrack.set(track, existing);
  });

  return [...byTrack.entries()]
    .map(([track, data]) => {
      const total = data.indices.length;
      const done = data.indices.filter((i) => completedSteps.includes(i)).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const status: TrackProgressSummary["status"] =
        pct >= 80 ? "strong" : pct > 0 ? "in_progress" : "not_started";
      return { track, domain: data.domain, done, total, pct, status };
    })
    .sort((a, b) => a.pct - b.pct);
}
