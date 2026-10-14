import { MaterialType } from "@/generated/prisma";
import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { parseAiJson } from "@/lib/ai/parse-json-response";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { db } from "@/lib/db";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import { getOrCreateUserPreferences } from "@/lib/preferences";
import { getUserAppSettings } from "@/lib/settings/app-settings";
import { generateCurriculumFromSyllabus } from "@/lib/syllabus/generate-curriculum-from-syllabus";
import { parseSyllabusText } from "@/lib/syllabus/parse";
import { parseStudyTopicFromMaterial } from "@/lib/study-topic/parse";
import type { StudyTopicProfile, StudyTopicSubtopic } from "@/lib/study-topic/types";

export const SYLLABUS_PLAN_MATERIAL_TITLE = "AI learning plan";

const OUTLINE_SECTION =
  /^(chapters?|units?|modules?|topics?|weekly\s+schedule|course\s+outline|schedule)$/i;
const SKIP_SECTION =
  /^(learning\s+outcomes?|course\s+outcomes?|objectives?|policies?|grading|attendance|materials?|module\s+outline)$/i;

function normalizeOutlineTitle(raw: string): string {
  return raw
    .replace(/^week\s+\d+\s*:\s*/i, "")
    .replace(/^module\s+\d+\s*:\s*/i, "")
    .replace(/&amp;/g, "&")
    .trim();
}

function parseOutlineLine(line: string): string | null {
  const bullet = line.match(/^[-*]\s+(.+)/);
  if (bullet?.[1]) return bullet[1].trim();
  const numbered = line.match(/^\d+\.\s+(.+)/);
  if (numbered?.[1]) return numbered[1].trim();
  return null;
}

function pushOutlineTopic(chapters: StudyTopicSubtopic[], rawTitle: string) {
  const title = normalizeOutlineTitle(rawTitle);
  if (!title || title.length < 3 || title.length > 120) return;
  if (SKIP_SECTION.test(title) || OUTLINE_SECTION.test(title)) return;
  if (isMetaSyllabusTopic(title)) return;
  chapters.push({
    name: title.slice(0, 120),
    description: `Study material from your syllabus: ${title}`,
  });
}

/**
 * Pull study topics from syllabus outline bullets (Chapters / Units / Modules).
 * Deterministic cold start — no AI required when the syllabus lists sections.
 */
export function chapterSubtopicsFromText(syllabusText: string): StudyTopicSubtopic[] {
  const lines = syllabusText.split("\n");
  const chapters: StudyTopicSubtopic[] = [];
  let inOutlineSection = false;
  let inModuleOutline = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^module outline$/i.test(trimmed)) {
      inModuleOutline = true;
      continue;
    }

    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      const name = heading[1].replace(/&amp;/g, "&").trim();
      inOutlineSection = OUTLINE_SECTION.test(name);
      inModuleOutline = /^modules?$/i.test(name);
      continue;
    }

    if (!inOutlineSection && !inModuleOutline) continue;

    const parsed = parseOutlineLine(line);
    if (parsed) pushOutlineTopic(chapters, parsed);
  }

  // Flat lists with no ## heading (Canvas module dumps, numbered weeks).
  if (chapters.length === 0) {
    for (const line of lines) {
      const parsed = parseOutlineLine(line);
      if (parsed) pushOutlineTopic(chapters, parsed);
    }
  }

  return chapters.slice(0, 24);
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
  includeOpenAIPro?: boolean;
}): Promise<Pick<StudyTopicProfile, "summary" | "subtopics" | "suggestedTechniques">> {
  // Prefer explicit chapter/unit lists for instant cold start (no AI wait).
  const outlineTopics = chapterSubtopicsFromText(input.syllabusText);
  if (outlineTopics.length >= 3) {
    return {
      summary: `Use your imported syllabus for ${input.courseTitle}${input.courseCode ? ` (${input.courseCode})` : ""} to guide weekly study, assignments, and exam prep.`,
      subtopics: outlineTopics,
      suggestedTechniques: fallbackStudyPlan(input).suggestedTechniques,
    };
  }

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
      {
        temperature: 0.3,
        maxTokens: 4096,
        jsonMode: true,
        includeOpenAIPro: input.includeOpenAIPro,
      },
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

/** Deterministic cold-start topic seed when AI enrich skips or returns zero. */
export async function seedTopicsFromSyllabusOutline(
  courseId: string,
  syllabusText: string,
): Promise<number> {
  const subtopics = chapterSubtopicsFromText(syllabusText);
  if (subtopics.length === 0) return 0;
  return upsertTopics(courseId, subtopics);
}

const GENERIC_FALLBACK_TOPIC_NAMES = [
  "Course outcomes",
  "Readings & modules",
  "Assignments & projects",
  "Exams & quizzes",
  "General",
] as const;

function isUsableStudyTopic(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || /^general$/i.test(trimmed)) return false;
  return !isMetaSyllabusTopic(trimmed);
}

/**
 * Re-seed topics from imported syllabus/module text when a course has none
 * or only thin/meta topics (common after LMS sync on another device or older imports).
 * Returns how many topics were created (0 if already usable enough).
 */
export async function backfillCourseTopicsIfEmpty(courseId: string): Promise<number> {
  const existing = await db.topic.findMany({
    where: { courseId },
    select: { name: true },
    take: 40,
  });
  const usableCount = existing.filter((topic) => isUsableStudyTopic(topic.name)).length;
  // Keep packs cold-startable: backfill when under 3 real content topics.
  if (usableCount >= 3) return 0;

  const material = await db.courseMaterial.findFirst({
    where: {
      courseId,
      OR: [
        { type: MaterialType.SYLLABUS },
        { type: MaterialType.DOCUMENT },
        { type: MaterialType.LECTURE_SLIDES },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: { extractedText: true },
  });
  const text = material?.extractedText?.trim() ?? "";
  if (!text) return 0;

  if (existing.length > 0) {
    await db.topic.deleteMany({
      where: {
        courseId,
        name: { in: [...GENERIC_FALLBACK_TOPIC_NAMES] },
      },
    });
  }

  return seedTopicsFromSyllabusOutline(courseId, text);
}

/** Seed syllabus topics for every course belonging to a user when lists are thin (cold start). */
export async function backfillUserCourseTopicsIfEmpty(userId: string): Promise<void> {
  const courseIds = await db.course.findMany({
    where: { userId },
    select: { id: true },
  });
  await Promise.all(courseIds.map((course) => backfillCourseTopicsIfEmpty(course.id)));
}

export interface EnrichCourseFromSyllabusResult {
  planGenerated: boolean;
  topicsCreated: number;
  mode: "college" | "grade_school";
  parser?: string;
}

async function countNonGeneralTopics(courseId: string): Promise<number> {
  const topics = await db.topic.findMany({
    where: { courseId },
    select: { name: true },
    take: 40,
  });
  return topics.filter((topic) => topic.name.trim() && !/^general$/i.test(topic.name))
    .length;
}

/**
 * When a plan material already exists, avoid re-running AI — but still seed topics
 * if the course has none (Canvas re-sync / cold-start gap).
 */
export function resolveSyllabusEnrichMode(input: {
  force?: boolean;
  hasUsablePlan: boolean;
  nonGeneralTopicCount: number;
}): "full" | "skip" | "topics_from_plan" {
  if (input.force || !input.hasUsablePlan) return "full";
  if (input.nonGeneralTopicCount > 0) return "skip";
  return "topics_from_plan";
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
  const appSettings = await getUserAppSettings(input.userId);

  const existingPlanMaterial = await db.courseMaterial.findFirst({
    where: {
      courseId: input.courseId,
      title: SYLLABUS_PLAN_MATERIAL_TITLE,
    },
  });

  const collegePlan = existingPlanMaterial
    ? parseStudyTopicFromMaterial(existingPlanMaterial.extractedText)
    : null;
  const gradePlan = existingPlanMaterial
    ? parseCurriculumFromMaterial(existingPlanMaterial.extractedText)
    : null;
  const hasUsablePlan = Boolean(collegePlan || gradePlan);
  const nonGeneralTopicCount = await countNonGeneralTopics(input.courseId);
  const mode = resolveSyllabusEnrichMode({
    force: input.force,
    hasUsablePlan,
    nonGeneralTopicCount,
  });

  if (mode === "skip") {
    return {
      planGenerated: false,
      topicsCreated: 0,
      mode: elementaryMode ? "grade_school" : "college",
    };
  }

  if (mode === "topics_from_plan") {
    if (collegePlan?.subtopics?.length) {
      const topicsCreated = await upsertTopics(input.courseId, collegePlan.subtopics);
      return {
        planGenerated: false,
        topicsCreated,
        mode: "college",
      };
    }
    if (gradePlan?.topics?.length) {
      const topicsCreated = await upsertTopics(
        input.courseId,
        gradePlan.topics.map((topic) => ({
          name: topic.name,
          description: topic.description,
        })),
      );
      return {
        planGenerated: false,
        topicsCreated,
        mode: "grade_school",
      };
    }
    // Plan unreadable — fall through to full enrich from syllabus text.
  }

  if (elementaryMode) {
    const curriculum = await generateCurriculumFromSyllabus({
      syllabusText: text,
      courseName: input.courseTitle,
      courseCode: input.courseCode,
      gradeLevel: "Auto",
      includeOpenAIPro: appSettings.aiUseOpenAIPro,
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
    includeOpenAIPro: appSettings.aiUseOpenAIPro,
  });

  const breakdown = await generateCollegeStudyPlanFromSyllabus({
    courseTitle: input.courseTitle,
    courseCode: input.courseCode,
    syllabusText: text,
    includeOpenAIPro: appSettings.aiUseOpenAIPro,
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
