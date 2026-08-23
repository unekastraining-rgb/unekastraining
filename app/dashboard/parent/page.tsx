import Link from "next/link";
import { MaterialType } from "@/generated/prisma";
import { StudyActivityType } from "@/generated/prisma";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { ParentDashboard } from "@/components/grade-school/ParentDashboard";
import type { HubGradeSchoolPlan } from "@/components/hub/types";
import { progressByCourse } from "@/lib/grade-school/progress";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import { getGradeSchoolProgress } from "@/lib/grade-school/progress";
import { getOrCreateUserPreferences } from "@/lib/preferences";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const user = await getOrCreateDefaultUser();
  const preferences = await getOrCreateUserPreferences(user.id);

  if (!preferences.elementaryMode) {
    return (
      <>
        <HubBackBar title="Parent dashboard" />
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          <p className="text-stone-600">
            Turn on{" "}
            <Link href="/dashboard" className="font-semibold text-teal-700 underline">
              Grade school planner
            </Link>{" "}
            in Settings to use the parent dashboard.
          </p>
        </div>
      </>
    );
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [courses, progressRows, weekSessions] = await Promise.all([
    db.course.findMany({
      where: { userId: user.id, gradeLevel: { not: null } },
      orderBy: { createdAt: "desc" },
      include: {
        materials: {
          where: { type: MaterialType.SYLLABUS },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { extractedText: true },
        },
      },
    }),
    getGradeSchoolProgress(),
    db.studySession
      .findMany({
        where: {
          userId: user.id,
          activityType: StudyActivityType.GRADE_SCHOOL,
          startedAt: { gte: weekAgo },
        },
        select: { durationSeconds: true },
      })
      .catch(() => []),
  ]);

  const plans: HubGradeSchoolPlan[] = courses
    .map((course) => {
      const curriculum = parseCurriculumFromMaterial(
        course.materials[0]?.extractedText,
      );
      if (!curriculum?.learningSteps?.length) return null;
      return {
        courseId: course.id,
        courseTitle: course.title,
        courseColor: course.color,
        curriculum,
      };
    })
    .filter((plan): plan is HubGradeSchoolPlan => plan !== null);

  const byCourseMap = progressByCourse(progressRows);
  const progressByCourseData = Object.fromEntries(byCourseMap);

  const totalMinutesThisWeek = Math.round(
    weekSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60,
  );

  return (
    <>
      <HubBackBar title="Parent dashboard" />
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <ParentDashboard
          data={{ plans, progressByCourse: progressByCourseData, totalMinutesThisWeek }}
        />
      </div>
    </>
  );
}
