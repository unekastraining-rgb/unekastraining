import { MaterialType } from "@/generated/prisma";
import { HubBackBar } from "@/components/hub/HubBackBar";
import { db } from "@/lib/db";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import { getOrCreateUserPreferences } from "@/lib/preferences";
import { getOrCreateDefaultUser } from "@/lib/user";

import { StudyHubView } from "./study-hub-view";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const user = await getOrCreateDefaultUser();
  const [courses, preferences] = await Promise.all([
    db.course.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        gradeLevel: true,
        materials: {
          where: { type: MaterialType.SYLLABUS },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { extractedText: true },
        },
      },
    }),
    getOrCreateUserPreferences(user.id),
  ]);

  const gradeSchoolPlans = courses
    .filter((course) => course.gradeLevel)
    .map((course) => {
      const curriculum = parseCurriculumFromMaterial(
        course.materials[0]?.extractedText,
      );
      if (!curriculum?.learningSteps?.length) return null;
      return {
        courseId: course.id,
        courseTitle: course.title,
        curriculum,
      };
    })
    .filter((plan): plan is NonNullable<typeof plan> => plan !== null);

  return (
    <>
      <HubBackBar title="Study" planningActive="study" />
      <StudyHubView
        courses={courses.map((course) => ({ id: course.id, title: course.title }))}
        elementaryMode={preferences.elementaryMode}
        gradeSchoolPlans={gradeSchoolPlans}
      />
    </>
  );
}
