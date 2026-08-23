import { MaterialType } from "@/generated/prisma";
import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { parseAiJson } from "@/lib/ai/parse-json-response";
import { db } from "@/lib/db";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import { getOrCreateUserPreferences } from "@/lib/preferences";
import { generateCurriculumFromSyllabus } from "@/lib/syllabus/generate-curriculum-from-syllabus";
import { parseSyllabusText } from "@/lib/syllabus/parse";
import { parseStudyTopicFromMaterial } from "@/lib/study-topic/parse";
import type { StudyTopicProfile, StudyTopicSubtopic } from "@/lib/study-topic/types";

export const SYLLABUS_PLAN_MATERIAL_TITLE = "AI learning plan";

function chapterSubtopicsFromText(syllabusText: string): StudyTopicSubtopic[] {
  const lines = syllabusText.split("\n");
  const chapters: StudyTopicSubtopic[] = [];

  for (const line of lines) {
    const bullet = line.match(/^[-*]\s+(.+)/);
    const heading = line.match(/^##\s+(.+)/);
    const title = (bullet?.[1] ?? heading?.[1] ?? "").replace(/&amp;/g, "&").trim();
    if (!title || title.length < 3) continue;
    if (/^chapters?$/i.test(title)) continue;
    chapters.push({
      name: title.slice(0, 120),
      description: `Study material from your syllabus: ${title}`,
    });
  }

  return chapters.slice(0, 10);
}

function fallbackStudyPlan(input: {
  courseTitle: string;
  courseCode?: string | null;
  syllabusText: string;
}): Pick<StudyTopicProfile, "summary" | "subtopics" | "suggestedTechniques"> {
  const fromChapters = chapterSubtopicsFromText(input.syllabusText);
  const subtopics =
    fromChapters.length > 0
      ? fromChapters
      : [
          { name: "Course outcomes", description: "What you should know by the end of the term" },
          { name: "Readings & modules", description: "Weekly content and preparation" },
          { name: "Assignments & projects", description: "Major graded work and deadlines" },
          { name: "Exams & quizzes", description: "Assessment checkpoints" },
        ];

  return {
    summary: `Use your imported syllabus for ${input.courseTitle}${input.courseCode ? ` (${input.courseCode})` : ""} to guide weekly study, assignments, and exam prep.`,
    subtopics,
    suggestedTechniques: [
      "Break down by module/week",
      "Flashcards for terms",
      "Teach-back summaries",
      "Practice quizzes before due dates",
      "Annotate syllabus in Core",
    ],
  };
}

async function generateCollegeStudyPlanFromSyllabus(input: {
  courseTitle: string;
  courseCode?: string | null;
  syllabusText: string;
}): Promise<Pick<StudyTopicProfile, "summary" | "subtopics" | "suggestedTechniques">> {
  if (!isAIConfigured()) {
    return fallbackStudyPlan(input);
  }

  try {
    const result = await aiService.complete(
      [
        {
          role: "system",
          content:
            "You turn college course syllabi into actionable study plans. Respond with JSON only.",
        },
        {
          role: "user",
          content: `Course: ${input.courseTitle}
${input.courseCode ? `Code: ${input.courseCode}` : ""}

SYLLABUS:
${input.syllabusText.slice(0, 14000)}

Return ONLY JSON:
{
  "summary": "2-3 sentences on how to succeed in this course",
  "subtopics": [{ "name": "string", "description": "one sentence" }],
  "suggestedTechniques": ["3-6 short study technique strings"]
}

Rules:
- 5-8 subtopics from syllabus sections (outcomes, modules, grading, policies, major assignments).
- Do not invent assignments with specific dates unless they appear in the syllabus.`,
        },
      ],
      { temperature: 0.3, maxTokens: 4096, jsonMode: true },
    );

    const parsed = parseAiJson<{
      summary: string;
      subtopics: StudyTopicSubtopic[];
      suggestedTechniques: string[];
    }>(result.content);

    if (!parsed.summary || !parsed.subtopics?.length) {
      return fallbackStudyPlan(input);
    }

    return {
      summary: parsed.summary.trim(),
      subtopics: parsed.subtopics.slice(0, 10),
      suggestedTechniques: (parsed.suggestedTechniques ?? []).slice(0, 6),
    };
  } catch (error) {
    console.warn("AI study plan from syllabus failed:", error);
    return fallbackStudyPlan(input);
  }
}

async function upsertTopics(
  courseId: string,
  subtopics: Array<{ name: string; description: string }>,
): Promise<number> {
  let created = 0;

  for (const [index, subtopic] of subtopics.entries()) {
    const existing = await db.topic.findFirst({
      where: { courseId, name: subtopic.name },
    });
    if (existing) continue;

    await db.topic.create({
      data: {
        courseId,
        name: subtopic.name,
        description: subtopic.description,
        sortOrder: index,
      },
    });
    created += 1;
  }

  return created;
}

export interface EnrichCourseFromSyllabusResult {
  planGenerated: boolean;
  topicsCreated: number;
  mode: "college" | "grade_school";
  parser?: string;
}

export async function enrichCourseFromSyllabus(input: {
  userId: string;
  courseId: string;
  syllabusText: string;
  courseTitle: string;
  courseCode?: string | null;
  instructor?: string | null;
  force?: boolean;
}): Promise<EnrichCourseFromSyllabusResult> {
  const text = input.syllabusText.trim();
  if (!text) {
    return { planGenerated: false, topicsCreated: 0, mode: "college" };
  }

  const preferences = await getOrCreateUserPreferences(input.userId);
  const elementaryMode = preferences.elementaryMode;

  const existingPlanMaterial = await db.courseMaterial.findFirst({
    where: {
      courseId: input.courseId,
      title: SYLLABUS_PLAN_MATERIAL_TITLE,
    },
  });

  if (existingPlanMaterial && !input.force) {
    const hasCollegePlan = parseStudyTopicFromMaterial(existingPlanMaterial.extractedText);
    const hasGradePlan = parseCurriculumFromMaterial(existingPlanMaterial.extractedText);
    if (hasCollegePlan || hasGradePlan) {
      return {
        planGenerated: false,
        topicsCreated: 0,
        mode: elementaryMode ? "grade_school" : "college",
      };
    }
  }

  if (elementaryMode) {
    const curriculum = await generateCurriculumFromSyllabus({
      syllabusText: text,
      courseName: input.courseTitle,
      courseCode: input.courseCode,
      gradeLevel: "Auto",
    });

    const planJson = JSON.stringify(curriculum, null, 2);

    if (existingPlanMaterial) {
      await db.courseMaterial.update({
        where: { id: existingPlanMaterial.id },
        data: { extractedText: planJson, type: MaterialType.OTHER },
      });
    } else {
      await db.courseMaterial.create({
        data: {
          courseId: input.courseId,
          title: SYLLABUS_PLAN_MATERIAL_TITLE,
          type: MaterialType.OTHER,
          extractedText: planJson,
          sortOrder: 1,
        },
      });
    }

    await db.course.update({
      where: { id: input.courseId },
      data: {
        title: curriculum.courseName,
        description: curriculum.summary,
        gradeLevel: curriculum.gradeLevel,
        subject: curriculum.subject,
        focusTopic: curriculum.focusTopic ?? curriculum.strugglingWith ?? null,
      },
    });

    const topicsCreated = await upsertTopics(
      input.courseId,
      curriculum.topics.map((topic) => ({
        name: topic.name,
        description: topic.description,
      })),
    );

    return {
      planGenerated: true,
      topicsCreated,
      mode: "grade_school",
      parser: "ai",
    };
  }

  const { extraction, parser } = await parseSyllabusText(text, {
    fileName: input.courseCode ?? input.courseTitle,
  });

  const breakdown = await generateCollegeStudyPlanFromSyllabus({
    courseTitle: input.courseTitle,
    courseCode: input.courseCode,
    syllabusText: text,
  });

  const profile: StudyTopicProfile = {
    kind: "study_topic",
    title: extraction.courseName || input.courseTitle,
    subject: extraction.courseCode ?? input.courseCode ?? null,
    focus: extraction.semester ?? null,
    summary: breakdown.summary,
    subtopics: breakdown.subtopics,
    suggestedTechniques: breakdown.suggestedTechniques,
    createdAt: new Date().toISOString(),
  };

  const planJson = JSON.stringify(profile, null, 2);

  if (existingPlanMaterial) {
    await db.courseMaterial.update({
      where: { id: existingPlanMaterial.id },
      data: { extractedText: planJson, type: MaterialType.OTHER },
    });
  } else {
    await db.courseMaterial.create({
      data: {
        courseId: input.courseId,
        title: SYLLABUS_PLAN_MATERIAL_TITLE,
        type: MaterialType.OTHER,
        extractedText: planJson,
        sortOrder: 1,
      },
    });
  }

  await db.course.update({
    where: { id: input.courseId },
    data: {
      instructor: input.instructor ?? extraction.instructor ?? undefined,
      semester: extraction.semester ?? undefined,
      description: breakdown.summary,
      subject: extraction.courseCode ?? input.courseCode ?? undefined,
    },
  });

  const topicsCreated = await upsertTopics(input.courseId, profile.subtopics);

  return {
    planGenerated: true,
    topicsCreated,
    mode: "college",
    parser,
  };
}
