import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

function progressClient() {
  const client = db as typeof db & {
    gradeSchoolStepProgress?: typeof db.gradeSchoolStepProgress;
  };

  if (!client.gradeSchoolStepProgress) {
    console.warn(
      "[grade-school] Prisma client is missing GradeSchoolStepProgress. Run `npx prisma generate && npx prisma db push`, then restart the dev server.",
    );
    return null;
  }

  return client.gradeSchoolStepProgress;
}

export async function getGradeSchoolProgress(courseId?: string) {
  const progressDb = progressClient();
  if (!progressDb) return [];

  const user = await getOrCreateDefaultUser();

  const rows = await progressDb.findMany({
    where: {
      userId: user.id,
      ...(courseId ? { courseId } : {}),
    },
    orderBy: [{ courseId: "asc" }, { stepIndex: "asc" }],
    include: {
      course: { select: { id: true, title: true, subject: true, gradeLevel: true } },
    },
  });

  return rows;
}

export async function markGradeSchoolStepComplete(input: {
  courseId: string;
  stepIndex: number;
  flashcardCount?: number;
}) {
  const progressDb = progressClient();
  if (!progressDb) {
    throw new Error(
      "Progress tracking is not ready yet. Run `npx prisma generate && npx prisma db push`, then restart the server.",
    );
  }

  const user = await getOrCreateDefaultUser();

  const course = await db.course.findFirst({
    where: { id: input.courseId, userId: user.id },
    select: { id: true },
  });
  if (!course) throw new Error("Course not found.");

  return progressDb.upsert({
    where: {
      userId_courseId_stepIndex: {
        userId: user.id,
        courseId: input.courseId,
        stepIndex: input.stepIndex,
      },
    },
    create: {
      userId: user.id,
      courseId: input.courseId,
      stepIndex: input.stepIndex,
      flashcardCount: input.flashcardCount ?? 0,
    },
    update: {
      completedAt: new Date(),
      flashcardCount: input.flashcardCount ?? undefined,
    },
  });
}

export async function clearCourseStepProgress(courseId: string) {
  const progressDb = progressClient();
  if (!progressDb) return;

  const user = await getOrCreateDefaultUser();
  await progressDb.deleteMany({
    where: { courseId, userId: user.id },
  });
}

export function progressByCourse(
  rows: Awaited<ReturnType<typeof getGradeSchoolProgress>>,
) {
  const map = new Map<string, { completedSteps: number[]; flashcards: number }>();

  for (const row of rows) {
    const existing = map.get(row.courseId) ?? { completedSteps: [], flashcards: 0 };
    existing.completedSteps.push(row.stepIndex);
    existing.flashcards += row.flashcardCount;
    map.set(row.courseId, existing);
  }

  return map;
}
