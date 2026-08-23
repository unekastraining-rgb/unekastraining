import { aiService } from "@/lib/ai";
import { parseAiJson } from "@/lib/ai/parse-json-response";
import { isComprehensiveProfile, resolvePlanPhases } from "@/lib/grade-school/plan-utils";

import { CORE_PHILOSOPHY } from "./grade-school-prompt";
import type { GeneratedCurriculum, LearnerProfile, SkillTrack } from "./types";

const PHASE_JSON = `"planPhases": [
    {
      "title": "Week 1: Build foundations",
      "focus": "what this phase targets",
      "weekNumber": 1,
      "priorityTracks": ["track names"],
      "stepIndices": [0, 1, 2]
    }
  ]`;

const FOCUSED_PROMPT = `${CORE_PHILOSOPHY}

Create a guided growth plan with browser-based activities.

Return ONLY valid JSON:
{
  "courseName": "string",
  "gradeLevel": "string",
  "subject": "string",
  "subjects": ["string"],
  "focusTopic": "string or null",
  "strugglingWith": "string or null",
  "learnerSummary": "string",
  "summary": "string",
  "skillTracks": [{ "name": "string", "domain": "reading|math|writing|science|foundational|other", "description": "string", "priority": "foundation|focus|stretch" }],
  ${PHASE_JSON},
  "topics": [{ "name": "string", "description": "string" }],
  "learningSteps": [{ "title": "string", "skillFocus": "string", "skillTrack": "string", "domain": "string", "activityType": "warm-up|teach|practice|check|celebrate", "durationMinutes": 10, "goal": "string", "steps": ["string"], "tryItPrompt": "string|null", "parentTip": "string|null" }],
  "assignments": [],
  "studyTips": ["string"]
}

Rules:
- assignments must be [].
- 5-8 learningSteps, 2-4 skillTracks, 2 planPhases (weeks).
- Each step index appears in exactly one planPhase.stepIndices (0-based).
- Phase 1: warm-up + teach. Phase 2: practice + check + celebrate.`;

const COMPREHENSIVE_PROMPT = `${CORE_PHILOSOPHY}

Build a MULTI-SKILL growth plan from a full learner profile — no syllabus.

Parents paste long struggle lists across reading, writing, math, science, and foundational skills.

Return ONLY valid JSON (same fields as focused plan).

COMPREHENSIVE RULES:
- assignments must be [].
- 6-12 skillTracks covering EVERY struggle mentioned.
- 14-20 learningSteps; each major struggle area gets 2+ activities.
- 3-4 planPhases (weeks). Week 1 = foundations, middle weeks = cross-subject practice, final week = check + celebrate.
- Each step index in exactly one planPhase. stepIndices are 0-based positions in learningSteps.
- Rotate domains so the child does not burn out on one subject.
- Use domain "foundational" for phonological awareness, rapid naming, visual-motor, decoding mechanics.`;

function normalizeSkillTracks(tracks: SkillTrack[] | undefined, steps: GeneratedCurriculum["learningSteps"]) {
  if (tracks?.length) return tracks;

  const names = [...new Set(steps.map((step) => step.skillTrack || step.skillFocus).filter(Boolean))];
  return names.map((name) => ({
    name: name as string,
    domain: "other" as const,
    description: `Practice for ${name}`,
    priority: "focus" as const,
  }));
}

function buildLearnerProfile(
  input: {
    gradeLevel: string;
    subjects: string[];
    strugglingWith?: string | null;
    studentName?: string | null;
    strengths?: string | null;
    goals?: string | null;
    parentNotes?: string | null;
  },
  parsed: GeneratedCurriculum,
): LearnerProfile {
  return {
    studentName: input.studentName ?? null,
    gradeLevel: input.gradeLevel,
    subjects: input.subjects,
    strengths: input.strengths ?? null,
    struggles: input.strugglingWith?.trim() || parsed.strugglingWith || "",
    goals: input.goals ?? null,
    parentNotes: input.parentNotes ?? null,
  };
}

function parseJsonFromResponse(
  content: string,
  comprehensive: boolean,
  profileInput: Parameters<typeof buildLearnerProfile>[0],
): GeneratedCurriculum {
  let parsed: GeneratedCurriculum;
  try {
    parsed = parseAiJson<GeneratedCurriculum>(
      content,
      "We couldn't read the learning plan from the AI. Please try generating again.",
    );
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("We couldn't read the learning plan from the AI. Please try generating again.");
  }

  if (!parsed.courseName || !Array.isArray(parsed.topics)) {
    throw new Error("The AI response did not match the expected curriculum format.");
  }

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

  const minSteps = comprehensive ? 10 : 3;
  if (learningSteps.length < minSteps) {
    throw new Error(
      comprehensive
        ? "The plan didn't include enough activities for all those skill areas. Try again."
        : "The AI didn't return enough guided activities. Please try again.",
    );
  }

  const subjects =
    parsed.subjects?.filter(Boolean) ??
    parsed.subject
      ?.split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean) ??
    [];

  const skillTracks = normalizeSkillTracks(parsed.skillTracks, learningSteps);
  const planPhases = resolvePlanPhases(learningSteps, parsed.planPhases);
  const learnerProfile = buildLearnerProfile(profileInput, parsed);

  return {
    courseName: parsed.courseName,
    gradeLevel: parsed.gradeLevel,
    subject: parsed.subject,
    subjects,
    focusTopic: parsed.focusTopic ?? null,
    strugglingWith: parsed.strugglingWith ?? learnerProfile.struggles,
    learnerSummary: parsed.learnerSummary ?? null,
    learnerProfile,
    summary: parsed.summary ?? "",
    skillTracks,
    planPhases,
    topics: parsed.topics.map((topic) => ({
      name: topic.name,
      description: topic.description ?? "",
    })),
    learningSteps,
    assignments: [],
    studyTips: parsed.studyTips ?? [],
  };
}

export async function generateCurriculum(input: {
  gradeLevel: string;
  subject: string;
  subjects?: string[];
  focusTopic?: string | null;
  strugglingWith?: string | null;
  studentName?: string | null;
  strengths?: string | null;
  goals?: string | null;
  parentNotes?: string | null;
}): Promise<GeneratedCurriculum> {
  const subjects =
    input.subjects?.filter(Boolean) ??
    input.subject
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean);

  const comprehensive = isComprehensiveProfile({
    strugglingWith: input.strugglingWith,
    subjects,
  });

  const userPrompt = [
    `Grade level: ${input.gradeLevel}`,
    subjects.length > 1 ? `Subjects: ${subjects.join(", ")}` : `Subject: ${subjects[0] ?? input.subject}`,
    input.studentName ? `Learner name: ${input.studentName}` : "",
    input.strengths ? `Strengths:\n${input.strengths}` : "",
    input.strugglingWith
      ? `Struggles / full learner profile (address ALL):\n${input.strugglingWith}`
      : "Struggles: general confidence across subjects",
    input.goals ? `Goals:\n${input.goals}` : "",
    input.parentNotes ? `Parent notes:\n${input.parentNotes}` : "",
    input.focusTopic ? `Optional focus topic: ${input.focusTopic}` : "",
    comprehensive ? "Plan type: COMPREHENSIVE multi-week growth plan" : "Plan type: focused growth plan",
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await aiService.complete(
    [
      {
        role: "system",
        content: comprehensive
          ? "You design holistic K-8 growth plans from learner profiles only — never from syllabi. JSON only."
          : "You design learner-profile growth plans for K-8. JSON only.",
      },
      { role: "user", content: `${comprehensive ? COMPREHENSIVE_PROMPT : FOCUSED_PROMPT}\n\n${userPrompt}` },
    ],
    {
      temperature: 0.35,
      maxTokens: comprehensive ? 12000 : 8192,
      jsonMode: true,
    },
  );

  return parseJsonFromResponse(result.content, comprehensive, {
    gradeLevel: input.gradeLevel,
    subjects,
    strugglingWith: input.strugglingWith,
    studentName: input.studentName,
    strengths: input.strengths,
    goals: input.goals,
    parentNotes: input.parentNotes,
  });
}
