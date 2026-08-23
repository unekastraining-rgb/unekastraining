import { aiService } from "@/lib/ai";
import { parseAiJson } from "@/lib/ai/parse-json-response";
import { resolvePlanPhases, summarizeTrackProgress } from "@/lib/grade-school/plan-utils";
import { CORE_PHILOSOPHY } from "@/lib/syllabus/grade-school-prompt";

import type { GeneratedCurriculum, ReplanSnapshot, SkillTrack } from "./types";

const REPLAN_PROMPT = `${CORE_PHILOSOPHY}

You are UPDATING an existing growth plan based on the learner's progress.

The parent has been working through guided activities. Some skill tracks are going well; others still need focus.

Your job:
1. Celebrate progress on strong tracks (80%+ activities done).
2. Shift NEW activities toward tracks still in progress or not started.
3. Do NOT repeat activities the learner already completed — create fresh next-step lessons.
4. Keep the same learner profile struggles in mind, but deprioritize mastered areas unless brief review helps.

Return ONLY valid JSON (same shape as a full growth plan):
{
  "courseName": "string — can update title to reflect new focus",
  "gradeLevel": "string",
  "subject": "string",
  "subjects": ["string"],
  "focusTopic": "string or null",
  "strugglingWith": "string — updated focus areas",
  "learnerSummary": "string — what improved and what's next",
  "summary": "string — for parent, explains the replan",
  "skillTracks": [{ "name": "string", "domain": "reading|math|writing|science|foundational|other", "description": "string", "priority": "foundation|focus|stretch" }],
  "planPhases": [{ "title": "string", "focus": "string", "weekNumber": number, "priorityTracks": ["string"], "stepIndices": [0,1,2] }],
  "topics": [{ "name": "string", "description": "string" }],
  "learningSteps": [{ "title": "string", "skillFocus": "string", "skillTrack": "string", "domain": "string", "activityType": "warm-up|teach|practice|check|celebrate", "durationMinutes": 10, "goal": "string", "steps": ["string"], "tryItPrompt": "string|null", "parentTip": "string|null" }],
  "assignments": [],
  "studyTips": ["string"]
}

REPLAN RULES:
- assignments must be [].
- 8-14 NEW learningSteps for the next stretch of growth.
- 2-3 planPhases for the new steps only.
- Each step index in exactly one planPhase (0-based).
- skillTracks should reflect current priorities — drop or shrink mastered tracks, elevate weak ones.`;

function normalizeSkillTracks(tracks: SkillTrack[] | undefined, steps: GeneratedCurriculum["learningSteps"]) {
  if (tracks?.length) return tracks;
  const names = [...new Set(steps.map((s) => s.skillTrack || s.skillFocus).filter(Boolean))];
  return names.map((name) => ({
    name: name as string,
    domain: "other" as const,
    description: `Practice for ${name}`,
    priority: "focus" as const,
  }));
}

function normalizeCurriculum(
  parsed: GeneratedCurriculum,
  previous: GeneratedCurriculum,
  snapshot: ReplanSnapshot,
): GeneratedCurriculum {
  const learningSteps = (parsed.learningSteps ?? []).map((step) => ({
    title: step.title,
    skillFocus: step.skillFocus ?? "",
    skillTrack: step.skillTrack ?? step.skillFocus ?? null,
    domain: step.domain ?? null,
    activityType: step.activityType ?? "practice",
    durationMinutes: step.durationMinutes ?? 10,
    goal: step.goal ?? "",
    steps: step.steps ?? [],
    tryItPrompt: step.tryItPrompt ?? null,
    parentTip: step.parentTip ?? null,
  }));

  if (learningSteps.length < 4) {
    throw new Error("The updated plan needs more activities. Try again.");
  }

  const skillTracks = normalizeSkillTracks(parsed.skillTracks, learningSteps);
  const planPhases = resolvePlanPhases(learningSteps, parsed.planPhases);
  const planVersion = (previous.planVersion ?? 1) + 1;

  return {
    courseName: parsed.courseName || previous.courseName,
    gradeLevel: parsed.gradeLevel || previous.gradeLevel,
    subject: parsed.subject || previous.subject,
    subjects: parsed.subjects ?? previous.subjects ?? [],
    focusTopic: parsed.focusTopic ?? previous.focusTopic,
    strugglingWith: parsed.strugglingWith ?? previous.strugglingWith,
    learnerSummary: parsed.learnerSummary ?? null,
    learnerProfile: previous.learnerProfile ?? null,
    summary: parsed.summary ?? "",
    skillTracks,
    planPhases,
    planVersion,
    replanHistory: [...(previous.replanHistory ?? []), snapshot],
    topics: (parsed.topics ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? "",
    })),
    learningSteps,
    assignments: [],
    studyTips: parsed.studyTips ?? [],
  };
}

export async function replanCurriculum(input: {
  curriculum: GeneratedCurriculum;
  completedSteps: number[];
  parentNotes?: string | null;
}): Promise<GeneratedCurriculum> {
  const { curriculum, completedSteps } = input;
  const trackSummary = summarizeTrackProgress(
    curriculum.learningSteps,
    completedSteps,
    curriculum.skillTracks,
  );

  const completedActivities = completedSteps
    .map((index) => {
      const step = curriculum.learningSteps[index];
      if (!step) return null;
      return `- ${step.title} (${step.skillTrack ?? step.skillFocus})`;
    })
    .filter(Boolean)
    .join("\n");

  const trackReport = trackSummary
    .map(
      (t) =>
        `- ${t.track} [${t.domain}]: ${t.done}/${t.total} done (${t.pct}%) — ${t.status}`,
    )
    .join("\n");

  const strongTracks = trackSummary.filter((t) => t.status === "strong").map((t) => t.track);
  const focusTracks = trackSummary
    .filter((t) => t.status !== "strong")
    .map((t) => t.track);

  const userPrompt = [
    `Current plan: ${curriculum.courseName} (version ${curriculum.planVersion ?? 1})`,
    curriculum.learnerProfile
      ? `Learner profile:\n${JSON.stringify(curriculum.learnerProfile, null, 2)}`
      : `Original struggles:\n${curriculum.strugglingWith ?? "general"}`,
    curriculum.learnerSummary ? `Learner summary: ${curriculum.learnerSummary}` : "",
    `\nCompleted activities (${completedSteps.length}):\n${completedActivities || "(none yet)"}`,
    `\nSkill track progress:\n${trackReport}`,
    strongTracks.length ? `\nGoing well (consider less focus): ${strongTracks.join(", ")}` : "",
    focusTracks.length ? `\nNeeds more focus: ${focusTracks.join(", ")}` : "",
    input.parentNotes ? `\nParent notes for replan:\n${input.parentNotes}` : "",
    "\nGenerate the NEXT phase of the growth plan with fresh activities.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await aiService.complete(
    [
      {
        role: "system",
        content:
          "You adapt K-8 growth plans based on progress. Shift focus to what still needs growth. JSON only.",
      },
      { role: "user", content: `${REPLAN_PROMPT}\n\n${userPrompt}` },
    ],
    { temperature: 0.35, maxTokens: 10000, jsonMode: true },
  );

  const parsed = parseAiJson<GeneratedCurriculum>(
    result.content,
    "We couldn't read the updated plan. Please try again.",
  );

  const snapshot: ReplanSnapshot = {
    replannedAt: new Date().toISOString(),
    summary:
      parsed.summary?.slice(0, 200) ||
      `Replanned after ${completedSteps.length} completed activities.`,
    completedStepCount: completedSteps.length,
    completedTracks: strongTracks,
    parentNotes: input.parentNotes ?? null,
  };

  return normalizeCurriculum(parsed, curriculum, snapshot);
}
