import { MaterialType, AssignmentStatus } from "@/generated/prisma";
import { HubBackBar } from "@/components/hub/HubBackBar";
import { HubSubpageShell } from "@/components/hub/HubSubpageShell";
import { db } from "@/lib/db";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import { withReadableCourse } from "@/lib/courses/display-name";
import {
  resolveLearnerGrowthContinuityForUser,
  type LearnerGrowthHubTeaser,
} from "@/lib/learning/learner-growth";
import { enrichAssignmentsWithConceptLinks } from "@/lib/learning/school-lms";
import { getOrCreateUserPreferences } from "@/lib/preferences";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { pickColdStartTopic } from "@/lib/study/cold-start-topic";
import { resolveCourseLearningBucket } from "@/lib/study/course-learning-bucket";
import { getOrCreateDefaultUser } from "@/lib/user";

import { StudyHubView } from "./study-hub-view";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const user = await getOrCreateDefaultUser();

  await backfillUserCourseTopicsIfEmpty(user.id);

  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [courses, preferences, upcomingAssignments, assignmentTopics] =
    await Promise.all([
      db.course.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          code: true,
          gradeLevel: true,
          semester: true,
          moodleCourseId: true,
          courseInfoSyncedAt: true,
          materials: {
            where: { type: MaterialType.SYLLABUS },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { extractedText: true },
          },
          topics: {
            orderBy: { sortOrder: "asc" },
            take: 24,
            select: { name: true },
          },
          _count: { select: { assignments: true } },
        },
      }),
      getOrCreateUserPreferences(user.id),
      // 2P-49 — school deadlines for Study Hub strip (logistics, not recommender).
      db.assignment.findMany({
        where: {
          course: { userId: user.id },
          status: {
            notIn: [AssignmentStatus.SUBMITTED, AssignmentStatus.GRADED],
          },
          OR: [
            { dueDate: null },
            { dueDate: { gte: now, lte: twoWeeks } },
            { dueDate: { lt: now } },
          ],
        },
        include: {
          course: { select: { id: true, title: true, code: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 6,
      }),
      db.topic.findMany({
        where: { course: { userId: user.id }, conceptId: { not: null } },
        select: { id: true, name: true, courseId: true, conceptId: true },
      }),
    ]);

  // 2P-43 — Hub continuity teaser from same Growth Center resolve (owned learner only).
  let growthContinuityTeaser: LearnerGrowthHubTeaser | null = null;
  try {
    const continuity = await resolveLearnerGrowthContinuityForUser(user.id);
    growthContinuityTeaser = continuity.hubTeaser;
  } catch {
    growthContinuityTeaser = null;
  }

  const gradeSchoolPlans = courses
    .filter((course) => course.gradeLevel)
    .map((course) => {
      const curriculum = parseCurriculumFromMaterial(
        course.materials[0]?.extractedText,
      );
      if (!curriculum?.learningSteps?.length) return null;
      return {
        courseId: course.id,
        courseTitle: withReadableCourse(course).title,
        curriculum,
      };
    })
    .filter((plan): plan is NonNullable<typeof plan> => plan !== null);

  const upcomingSchoolWork = enrichAssignmentsWithConceptLinks(
    upcomingAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate?.toISOString() ?? null,
      courseId: a.courseId,
      courseTitle: withReadableCourse(a.course).title,
      status: a.status,
    })),
    assignmentTopics.map((t) => ({
      id: t.id,
      name: t.name,
      courseId: t.courseId,
      conceptId: t.conceptId,
    })),
  );

  return (
    <HubSubpageShell>
      <HubBackBar title="Study" planningActive="study" />
      <StudyHubView
        courses={courses.map((course) => ({
          id: course.id,
          title: withReadableCourse(course).title,
          focusTopic: pickColdStartTopic(course.topics),
          topics: course.topics
            .map((topic) => topic.name)
            .filter((name) => !isMetaSyllabusTopic(name)),
          learningBucket: resolveCourseLearningBucket({
            moodleCourseId: course.moodleCourseId,
            courseInfoSyncedAt: course.courseInfoSyncedAt,
            semester: course.semester,
            code: course.code,
            assignmentCount: course._count.assignments,
          }),
        }))}
        elementaryMode={preferences.elementaryMode}
        gradeSchoolPlans={gradeSchoolPlans}
        growthContinuityTeaser={growthContinuityTeaser}
        upcomingSchoolWork={upcomingSchoolWork}
      />
    </HubSubpageShell>
  );
}
