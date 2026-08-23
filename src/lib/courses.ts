import { db } from "@/lib/db";

export function coursePath(courseId: string): string {
  return `/courses/${courseId}`;
}

export async function resolveCourseForUser(
  userId: string,
  options: { courseId?: string; courseTitle?: string },
) {
  if (options.courseId) {
    const course = await db.course.findFirst({
      where: { id: options.courseId, userId },
    });

    if (!course) {
      throw new Error("Course not found. Add a class first or pick a different one.");
    }

    return course;
  }

  const title = options.courseTitle?.trim();

  if (!title) {
    throw new Error(
      "You need at least one class. Add a class name or create a course on the Courses page first.",
    );
  }

  return db.course.create({
    data: {
      title,
      userId,
    },
  });
}
