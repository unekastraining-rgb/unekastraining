import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";

import {
  mergeSyllabusExtractions,
  parseSyllabusHeuristic,
} from "./parse-heuristic";
import type { SyllabusExtraction } from "./types";

export type SyllabusParserMode = "heuristic" | "ai" | "hybrid";

const EXTRACTION_PROMPT = `You are an academic syllabus parser. Extract structured course information from the syllabus text below.

Return ONLY valid JSON matching this exact shape (no markdown, no commentary):
{
  "courseName": "string",
  "courseCode": "string or null",
  "instructor": "string or null",
  "semester": "string or null",
  "assignments": [
    {
      "title": "string",
      "dueDate": "ISO 8601 date string or null",
      "description": "string or null"
    }
  ],
  "meetings": [
    {
      "dayOfWeek": 0,
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "location": "string or null",
      "title": "string or null"
    }
  ]
}

Rules:
- Include exams, homework, projects, quizzes, and major deadlines in assignments.
- Include regular class meeting times in meetings when listed (dayOfWeek: 0=Sunday … 6=Saturday).
- Use 24-hour HH:MM for meeting times.
- Use null when a field is not found.
- Normalize due dates to ISO 8601 (YYYY-MM-DD) when possible.
- If only a month/day is given, infer the year from the semester when possible.

Syllabus text:
`;

function parseJsonFromResponse(content: string): SyllabusExtraction {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? content).trim();

  const parsed = JSON.parse(raw) as SyllabusExtraction;

  if (!parsed.courseName || !Array.isArray(parsed.assignments)) {
    throw new Error("AI response did not match the expected syllabus format.");
  }

  return {
    courseName: parsed.courseName,
    courseCode: parsed.courseCode ?? null,
    instructor: parsed.instructor ?? null,
    semester: parsed.semester ?? null,
    assignments: parsed.assignments.map((assignment) => ({
      title: assignment.title,
      dueDate: assignment.dueDate ?? null,
      description: assignment.description ?? null,
    })),
    meetings: (parsed.meetings ?? []).map((meeting) => ({
      dayOfWeek: meeting.dayOfWeek,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: meeting.location ?? null,
      title: meeting.title ?? "Class",
    })),
  };
}

async function parseSyllabusWithAI(text: string): Promise<SyllabusExtraction> {
  const result = await aiService.complete(
    [
      {
        role: "system",
        content:
          "You extract structured academic syllabus data and respond with JSON only.",
      },
      {
        role: "user",
        content: `${EXTRACTION_PROMPT}${text.slice(0, 12000)}`,
      },
    ],
    {
      temperature: 0.1,
      maxTokens: 2048,
      jsonMode: true,
    },
  );

  return parseJsonFromResponse(result.content);
}

export async function parseSyllabusText(
  text: string,
  options?: { fileName?: string; preferAI?: boolean },
): Promise<{ extraction: SyllabusExtraction; parser: SyllabusParserMode }> {
  const heuristic = parseSyllabusHeuristic(text, options?.fileName);

  if (!text.trim()) {
    return { extraction: heuristic, parser: "heuristic" };
  }

  if (!isAIConfigured() || options?.preferAI === false) {
    return { extraction: heuristic, parser: "heuristic" };
  }

  try {
    const aiExtraction = await parseSyllabusWithAI(text);
    return {
      extraction: mergeSyllabusExtractions(heuristic, aiExtraction),
      parser: "hybrid",
    };
  } catch (error) {
    console.warn("AI syllabus parse failed; using heuristic extraction.", error);
    return { extraction: heuristic, parser: "heuristic" };
  }
}
