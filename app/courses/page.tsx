import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

import { CoursesView } from "./courses-view";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const user = await getOrCreateDefaultUser();

  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { assignments: true, materials: true },
      },
    },
  });

  return <CoursesView initialCourses={courses} />;
}
