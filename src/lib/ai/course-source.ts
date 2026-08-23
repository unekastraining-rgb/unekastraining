import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";

export async function loadCourseSourceText(
  userId: string,
  courseId: string | null | undefined,
  maxChars = 12000,
): Promise<{ courseTitle: string; text: string } | null> {
  if (!courseId) return null;

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
    },
  });

  if (!course) return null;

  const text =
    course.materials
      .map((material) => material.extractedText?.trim())
      .filter(Boolean)
      .join("\n\n") ||
    `${course.title} ${course.description ?? ""}`.trim();

  return {
    courseTitle: course.title,
    text: text.slice(0, maxChars),
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
): Promise<{ courseTitle: string; text: string } | null> {
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
    text: text.slice(0, maxChars),
  };
}
