import { MaterialType } from "@/generated/prisma";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import {
  formatPackedCoverage,
  packBalancedStudySource,
  type PackedStudySource,
} from "@/lib/core/pack-study-source";
import { buildTopicsSourceBlock } from "@/lib/quizzes/from-topics";
import { backfillCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";

function hasUsableTopics(
  topics: Array<{ name: string }>,
): boolean {
  return topics.some((topic) => topic.name.trim() && !/^general$/i.test(topic.name));
}

export async function loadCourseSourceText(
  userId: string,
  courseId: string | null | undefined,
  maxChars = 12000,
): Promise<{ courseTitle: string; text: string; coldStart?: boolean } | null> {
  if (!courseId) return null;

  await backfillCourseTopicsIfEmpty(courseId);

  const course = await db.course.findFirst({
    where: { id: courseId, userId },
    include: {
      materials: {
        where: {
          OR: [
            { type: MaterialType.SYLLABUS },
            { type: MaterialType.LECTURE_SLIDES },
            { type: MaterialType.TEXTBOOK },
            { type: MaterialType.DOCUMENT },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      },
      topics: {
        orderBy: { createdAt: "asc" },
        take: 30,
        select: { name: true, description: true },
      },
    },
  });

  if (!course) return null;

  const courseTitle = readableCourseTitle(course.title, course.code);
  const materialText = course.materials
    .map((material) => material.extractedText?.trim())
    .filter(Boolean)
    .join("\n\n");

  const topicsBlock = buildTopicsSourceBlock(courseTitle, course.topics, {
    courseDescription: course.description,
  });
  const usableTopics = hasUsableTopics(course.topics);

  // Prefer uploaded reading; otherwise cold-start from syllabus topics / course outline.
  if (materialText.trim().length >= 200) {
    const packed = packBalancedStudySource(materialText, maxChars);
    const withTopics = usableTopics
      ? `${packed.text}\n\n${topicsBlock}`
      : packed.text;
    return {
      courseTitle,
      text: withTopics.slice(0, maxChars),
      coldStart: false,
    };
  }

  // When LMS modules seeded topics, never invent “typical college coverage”.
  if (usableTopics) {
    const coldText = [
      topicsBlock,
      course.description?.trim()
        ? `\nCourse description:\n${course.description.trim().slice(0, 1200)}`
        : "",
      materialText.trim()
        ? `\nPartial materials:\n${materialText.trim().slice(0, 2000)}`
        : "",
    ]
      .join("")
      .trim();

    return {
      courseTitle,
      text: coldText.slice(0, maxChars),
      coldStart: true,
    };
  }

  const coldText = [
    topicsBlock,
    course.description?.trim()
      ? `\nCourse description:\n${course.description.trim().slice(0, 1200)}`
      : "",
    materialText.trim()
      ? `\nPartial materials:\n${materialText.trim().slice(0, 2000)}`
      : "",
  ]
    .join("")
    .trim();

  if (!coldText) {
    return {
      courseTitle,
      text: `Course: ${courseTitle}\nMode: cold start — build a chapter-style study pack from typical college coverage for this course title.`,
      coldStart: true,
    };
  }

  return {
    courseTitle,
    text: coldText.slice(0, maxChars),
    coldStart: true,
  };
}

export async function loadAllCoursesSourceText(
  userId: string,
  maxChars = 10000,
): Promise<string> {
  const courses = await db.course.findMany({
    where: { userId },
    include: {
      materials: {
        where: {
          OR: [
            { type: MaterialType.SYLLABUS },
            { type: MaterialType.LECTURE_SLIDES },
            { type: MaterialType.TEXTBOOK },
            { type: MaterialType.DOCUMENT },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 2,
      },
    },
    take: 6,
  });

  const blocks = courses.map((course) => {
    const text =
      course.materials
        .map((material) => material.extractedText?.trim())
        .filter(Boolean)
        .join("\n") || course.description || "";
    return `## ${course.title}\n${text}`;
  });

  return blocks.join("\n\n").slice(0, maxChars);
}

export async function loadMaterialSourceText(
  userId: string,
  materialId: string,
  maxChars = 12000,
): Promise<{ courseTitle: string; text: string; materialTitle: string } | null> {
  const material = await db.courseMaterial.findFirst({
    where: { id: materialId, course: { userId } },
    include: { course: { select: { title: true } } },
  });

  if (!material) return null;

  const text =
    material.extractedText?.trim() ||
    `${material.title} ${material.type}`.trim();

  return {
    courseTitle: material.course.title,
    materialTitle: material.title,
    text: text.slice(0, maxChars),
  };
}

/**
 * Chapter-study source: primary reading + syllabus / related course materials
 * so learning objectives and textbook titles from the syllabus are visible to the model.
 * Does not fetch external textbooks (copyright); only uploaded course materials.
 */
export async function loadChapterStudySourceText(
  userId: string,
  materialId: string,
  maxChars = 32000,
): Promise<{
  courseTitle: string;
  text: string;
  materialTitle: string;
  coverage?: PackedStudySource;
} | null> {
  const material = await db.courseMaterial.findFirst({
    where: { id: materialId, course: { userId } },
    include: {
      course: {
        select: {
          title: true,
          description: true,
          materials: {
            where: {
              id: { not: materialId },
              OR: [
                { type: MaterialType.SYLLABUS },
                { type: MaterialType.TEXTBOOK },
                { type: MaterialType.LECTURE_SLIDES },
                { type: MaterialType.DOCUMENT },
              ],
            },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
              id: true,
              title: true,
              type: true,
              extractedText: true,
            },
          },
        },
      },
    },
  });

  if (!material) return null;

  const primary =
    material.extractedText?.trim() ||
    `${material.title} ${material.type}`.trim();

  const syllabusBudget = Math.min(3500, Math.floor(maxChars * 0.12));
  const relatedBudget = Math.min(2500, Math.floor(maxChars * 0.08));
  const primaryBudget = Math.max(12000, maxChars - syllabusBudget - relatedBudget - 300);
  const packedPrimary = packBalancedStudySource(primary, primaryBudget);

  const related = [...material.course.materials].sort((a, b) => {
    const rank = (type: MaterialType) =>
      type === MaterialType.SYLLABUS
        ? 0
        : type === MaterialType.TEXTBOOK
          ? 1
          : type === MaterialType.LECTURE_SLIDES
            ? 2
            : 3;
    return rank(a.type) - rank(b.type);
  });

  const syllabusParts = related
    .filter((item) => item.type === MaterialType.SYLLABUS)
    .map((item) => item.extractedText?.trim())
    .filter(Boolean) as string[];

  const relatedParts = related
    .filter((item) => item.type !== MaterialType.SYLLABUS)
    .map((item) => {
      const body = item.extractedText?.trim();
      if (!body) return null;
      return `### ${item.title} (${item.type})\n${body}`;
    })
    .filter(Boolean) as string[];

  const blocks: string[] = [];
  if (syllabusParts.length > 0) {
    blocks.push(
      `## COURSE SYLLABUS (ORGANIZATIONAL ONLY — learning objectives, schedule, textbook title; NOT lesson prose)\n${syllabusParts
        .join("\n\n")
        .slice(0, syllabusBudget)}`,
    );
  } else if (material.course.description?.trim()) {
    blocks.push(`## COURSE DESCRIPTION\n${material.course.description.trim().slice(0, 1500)}`);
  }

  blocks.push(
    `## PRIMARY READING / MATERIAL: ${material.title}\n${packedPrimary.text}`,
  );

  if (relatedParts.length > 0) {
    blocks.push(
      `## RELATED COURSE MATERIALS\n${relatedParts.join("\n\n").slice(0, relatedBudget)}`,
    );
  }

  blocks.unshift(
    `## SOURCE COVERAGE\n${formatPackedCoverage(packedPrimary)}`,
  );

  let text = blocks.join("\n\n");
  if (text.length > maxChars) {
    const withoutRelated = blocks.filter((block) => !block.startsWith("## RELATED COURSE MATERIALS"));
    text = withoutRelated.join("\n\n");
  }

  return {
    courseTitle: material.course.title,
    materialTitle: material.title,
    text,
    coverage: packedPrimary,
  };
}
