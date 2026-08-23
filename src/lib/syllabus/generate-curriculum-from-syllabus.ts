import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { parseAiJson } from "@/lib/ai/parse-json-response";
import { resolvePlanPhases } from "@/lib/grade-school/plan-utils";

import { CORE_PHILOSOPHY } from "./grade-school-prompt";
import type { GeneratedCurriculum } from "./types";

const SYLLABUS_CURRICULUM_PROMPT = `${CORE_PHILOSOPHY}

Create a guided learning plan FROM a real course syllabus (not a generic profile).

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
  "planPhases": [{ "title": "string", "focus": "string", "weekNumber": 1, "priorityTracks": ["string"], "stepIndices": [0,1] }],
  "topics": [{ "name": "string", "description": "string" }],
  "learningSteps": [{ "title": "string", "skillFocus": "string", "skillTrack": "string", "domain": "string", "activityType": "warm-up|teach|practice|check|celebrate", "durationMinutes": 10, "goal": "string", "steps": ["string"], "tryItPrompt": "string|null", "parentTip": "string|null" }],
  "assignments": [],
  "studyTips": ["string"]
}

Rules:
- assignments must be [] (due dates come from LMS sync).
- Base topics and learningSteps on syllabus modules, outcomes, and major themes.
- 5-8 learningSteps, 2-3 skillTracks, 2 planPhases.
- Each step index in exactly one planPhase.stepIndices (0-based).`;

function fallbackCurriculumFromSyllabus(input: {
  courseName: string;
  courseCode?: string | null;
  syllabusText: string;
}): GeneratedCurriculum {
  const lines = input.syllabusText
    .split("\n")
    .map((line) => line.replace(/^[-*#]+\s*/, "").trim())
    .filter((line) => line.length > 4 && line.length < 120);

  const topics = lines.slice(0, 6).map((name) => ({
    name,
    description: `From syllabus: ${name}`,
  }));

  if (topics.length === 0) {
    topics.push(
      { name: "Course overview", description: "Understand goals and expectations" },
      { name: "Weekly modules", description: "Follow the syllabus week by week" },
    );
  }

  const learningSteps = topics.slice(0, 5).map((topic, index) => ({
    title: topic.name,
    skillFocus: topic.name,
    skillTrack: input.courseCode ?? input.courseName,
    domain: "other",
    activityType: (index === 0 ? "warm-up" : index === topics.length - 1 ? "check" : "practice") as
      | "warm-up"
      | "practice"
      | "check",
    durationMinutes: 15,
    goal: `Learn ${topic.name}`,
    steps: [`Review syllabus section: ${topic.name}`, "Take notes in Core", "Quiz yourself"],
    tryItPrompt: `Explain ${topic.name} in your own words.`,
    parentTip: null,
  }));

  return {
    courseName: input.courseName,
    gradeLevel: "Syllabus-based",
    subject: input.courseCode ?? "Course",
    subjects: [input.courseCode ?? input.courseName],
    focusTopic: null,
    strugglingWith: null,
    learnerSummary: `Plan derived from ${input.courseName} syllabus.`,
    summary: `Study plan built from your imported syllabus for ${input.courseName}.`,
    skillTracks: [
      {
        name: input.courseName,
        domain: "other",
        description: "Syllabus-aligned study track",
        priority: "focus",
      },
    ],
    planPhases: resolvePlanPhases(learningSteps, [
      {
        title: "Week 1: Foundations",
        focus: "Orientation and first modules",
        weekNumber: 1,
        priorityTracks: [input.courseName],
        stepIndices: learningSteps.map((_, index) => index).filter((index) => index < 3),
      },
      {
        title: "Week 2: Practice",
        focus: "Apply and check understanding",
        weekNumber: 2,
        priorityTracks: [input.courseName],
        stepIndices: learningSteps.map((_, index) => index).filter((index) => index >= 3),
      },
    ]),
    topics,
    learningSteps,
    assignments: [],
    studyTips: [
      "Sync Moodle before each study week",
      "Use Break this down on tough modules",
      "Review Important Dates from the syllabus",
    ],
    planVersion: 1,
    replanHistory: [],
  };
}

export async function generateCurriculumFromSyllabus(input: {
  syllabusText: string;
  courseName: string;
  courseCode?: string | null;
  gradeLevel?: string | null;
}): Promise<GeneratedCurriculum> {
  const text = input.syllabusText.trim();
  if (!text) {
    return fallbackCurriculumFromSyllabus(input);
  }

  if (!isAIConfigured()) {
    return fallbackCurriculumFromSyllabus(input);
  }

  try {
    const result = await aiService.complete(
      [
        {
          role: "system",
          content: "You build K-8 learning plans from real syllabi. JSON only.",
        },
        {
          role: "user",
          content: `${SYLLABUS_CURRICULUM_PROMPT}

Course: ${input.courseName}
${input.courseCode ? `Code: ${input.courseCode}` : ""}
${input.gradeLevel ? `Grade level hint: ${input.gradeLevel}` : ""}

SYLLABUS:
${text.slice(0, 14000)}`,
        },
      ],
      { temperature: 0.35, maxTokens: 10000, jsonMode: true },
    );

    const parsed = parseAiJson<GeneratedCurriculum>(result.content);
    if (!parsed.courseName || !parsed.topics?.length || !parsed.learningSteps?.length) {
      return fallbackCurriculumFromSyllabus(input);
    }

    const learningSteps = parsed.learningSteps ?? [];
    return {
      ...parsed,
      courseName: parsed.courseName || input.courseName,
      gradeLevel: parsed.gradeLevel || input.gradeLevel || "Syllabus-based",
      subject: parsed.subject || input.courseCode || input.courseName,
      subjects: parsed.subjects ?? [input.courseCode ?? input.courseName],
      skillTracks: parsed.skillTracks ?? [],
      planPhases: resolvePlanPhases(learningSteps, parsed.planPhases ?? []),
      assignments: [],
      studyTips: parsed.studyTips ?? [],
      planVersion: parsed.planVersion ?? 1,
      replanHistory: parsed.replanHistory ?? [],
    };
  } catch (error) {
    console.warn("generateCurriculumFromSyllabus failed:", error);
    return fallbackCurriculumFromSyllabus(input);
  }
}
