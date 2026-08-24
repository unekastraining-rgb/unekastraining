import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { parseAiJson } from "@/lib/ai/parse-json-response";

import { portalToContextText } from "./portal-context";

export interface CollegeLearningPlanWeek {
  weekNumber: number;
  title: string;
  dateRange?: string;
  tasks: string[];
}

export interface CollegeLearningPlan {
  summary: string;
  weeks: CollegeLearningPlanWeek[];
  generatedAt: string;
  offline?: boolean;
}

const PLAN_PROMPT = `You build practical week-by-week study plans from imported college course data.

Return ONLY valid JSON:
{
  "summary": "1-2 sentence overview",
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week 1: Module 1 foundations",
      "dateRange": "Aug 25 – Aug 31",
      "tasks": ["Review Topic A", "Read Chapter 1", "Complete Assignment 1"]
    }
  ]
}

Rules:
- Use ONLY facts from the provided course data (syllabus, schedule, assignments, dates, grading).
- Do NOT invent assignments, exam dates, textbooks, policies, or deadlines.
- If information is missing, omit that task or note "Not provided in syllabus" in summary only.
- Align weeks to actual course term dates and module schedule when available.
- 4-12 weeks depending on term length; each week 3-6 concrete tasks.
- Tasks should be actionable study steps (read, review, complete, prepare, attend).`;

function fallbackPlan(courseName: string, context: string): CollegeLearningPlan {
  const moduleLines = context
    .split("\n")
    .filter((line) => /\bmodule\s+\d+/i.test(line) && line.trim().startsWith("-"))
    .slice(0, 8);

  const weeks: CollegeLearningPlanWeek[] = moduleLines.length
    ? moduleLines.map((line, index) => ({
        weekNumber: index + 1,
        title: line.replace(/^-\s*/, "").trim(),
        tasks: ["Review module objectives from syllabus", "Complete listed readings", "Finish module assignments"],
      }))
    : [
        {
          weekNumber: 1,
          title: "Week 1",
          tasks: [
            "Review course syllabus and important dates",
            "Check this week's objectives in the course dashboard",
            "Complete any assignments due this week",
          ],
        },
      ];

  return {
    summary: `Study plan outline for ${courseName} based on imported syllabus data. Generate with AI for a fuller week-by-week plan.`,
    weeks,
    generatedAt: new Date().toISOString(),
    offline: true,
  };
}

export async function generateCollegeLearningPlan(input: {
  courseName: string;
  courseInfoJson: string | null | undefined;
}): Promise<CollegeLearningPlan> {
  const context = portalToContextText(input.courseInfoJson, 14_000);
  if (!context) {
    return {
      summary: "No imported course data yet. Sync Moodle course info first.",
      weeks: [],
      generatedAt: new Date().toISOString(),
      offline: true,
    };
  }

  if (!isAIConfigured()) {
    return fallbackPlan(input.courseName, context);
  }

  try {
    const result = await aiService.complete(
      [
        {
          role: "system",
          content:
            "You create college study plans from real syllabus data. Never invent missing course facts. JSON only.",
        },
        {
          role: "user",
          content: `${PLAN_PROMPT}

Course: ${input.courseName}

IMPORTED COURSE DATA:
${context}`,
        },
      ],
      { temperature: 0.3, maxTokens: 8000, jsonMode: true },
    );

    const parsed = parseAiJson<CollegeLearningPlan>(result.content);
    if (!parsed.weeks?.length) {
      return fallbackPlan(input.courseName, context);
    }

    return {
      summary: parsed.summary ?? `Learning plan for ${input.courseName}`,
      weeks: parsed.weeks.map((week, index) => ({
        weekNumber: week.weekNumber ?? index + 1,
        title: week.title ?? `Week ${index + 1}`,
        dateRange: week.dateRange,
        tasks: week.tasks?.filter(Boolean) ?? [],
      })),
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("generateCollegeLearningPlan failed:", error);
    return fallbackPlan(input.courseName, context);
  }
}
