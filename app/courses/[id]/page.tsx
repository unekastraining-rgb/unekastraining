import { notFound } from "next/navigation";

import { HubBackBar } from "@/components/hub/HubBackBar";
import {
  readableCourseCode,
  readableCourseName,
  readableMeetingTitle,
} from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { enrichAssignmentsWithConceptLinks } from "@/lib/learning/school-lms";
import { parseStudyTopicFromMaterial } from "@/lib/study-topic/parse";
import { backfillCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

import { CourseDetailView } from "./course-detail-view";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getOrCreateDefaultUser();
  const { id } = await params;

  const course = await db.course.findFirst({
    where: { id, userId: user.id },
    include: {
      assignments: { orderBy: { dueDate: "asc" } },
      materials: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      meetings: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
      topics: {
        orderBy: { name: "asc" },
        include: {
          masteries: {
            where: { userId: user.id },
            take: 1,
          },
        },
      },
      _count: { select: { quizzes: true, studySessions: true } },
    },
  });

  if (!course) {
    notFound();
  }

  await backfillCourseTopicsIfEmpty(course.id);

  const refreshedTopics = await db.topic.findMany({
    where: { courseId: course.id },
    orderBy: { name: "asc" },
    include: {
      masteries: {
        where: { userId: user.id },
        take: 1,
      },
    },
  });

  const studyTopic = course.materials
    .map((material) => parseStudyTopicFromMaterial(material.extractedText))
    .find((profile) => profile !== null) ?? null;

  // 2P-49 — soft assignment → concept enrichment (same bridge as Hub).
  const topicsForBridge = refreshedTopics
    .filter((t) => t.conceptId)
    .map((t) => ({
      id: t.id,
      name: t.name,
      courseId: course.id,
      conceptId: t.conceptId,
    }));
  const enrichedAssignments = enrichAssignmentsWithConceptLinks(
    course.assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.toISOString() ?? null,
      status: assignment.status,
      kind: assignment.kind,
      grade: assignment.grade,
      maxGrade: assignment.maxGrade,
      courseId: course.id,
    })),
    topicsForBridge,
  );

  return (
    <>
      <HubBackBar title={readableCourseName(course)} />
      <CourseDetailView
        course={{
          id: course.id,
          title: readableCourseName(course),
          code: readableCourseCode(course),
          instructor: course.instructor,
          semester: course.semester,
          description: course.description,
          color: course.color,
          gradeLevel: course.gradeLevel,
          subject: course.subject,
          moodleCourseId: course.moodleCourseId,
          courseInfoJson: course.courseInfoJson,
          quizCount: course._count.quizzes,
          sessionCount: course._count.studySessions,
          assignments: enrichedAssignments.map((assignment) => ({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            status: assignment.status,
            kind: assignment.kind,
            grade: assignment.grade,
            maxGrade: assignment.maxGrade,
            conceptId: assignment.conceptId,
            alignmentState: assignment.alignmentState,
          })),
          materials: course.materials.map((material) => ({
            id: material.id,
            title: material.title,
            type: material.type,
          })),
          meetings: course.meetings.map((meeting) => ({
            id: meeting.id,
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            location: meeting.location,
            title: readableMeetingTitle(meeting.title, course),
          })),
          topics: refreshedTopics.map((topic) => {
            const mastery = topic.masteries[0];
            return {
              id: topic.id,
              name: topic.name,
              proficiency: mastery?.proficiency ?? null,
            };
          }),
        }}
        studyTopic={studyTopic}
      />
    </>
  );
}
