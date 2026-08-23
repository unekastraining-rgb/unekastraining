import { notFound } from "next/navigation";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { db } from "@/lib/db";
import { parseStudyTopicFromMaterial } from "@/lib/study-topic/parse";
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

  const studyTopic = course.materials
    .map((material) => parseStudyTopicFromMaterial(material.extractedText))
    .find((profile) => profile !== null) ?? null;

  return (
    <>
      <HubBackBar title={course.title} />
      <CourseDetailView
        course={{
          id: course.id,
          title: course.title,
          code: course.code,
          instructor: course.instructor,
          semester: course.semester,
          description: course.description,
          color: course.color,
          gradeLevel: course.gradeLevel,
          subject: course.subject,
          moodleCourseId: course.moodleCourseId,
          quizCount: course._count.quizzes,
          sessionCount: course._count.studySessions,
          assignments: course.assignments.map((assignment) => ({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate?.toISOString() ?? null,
            status: assignment.status,
            kind: assignment.kind,
            grade: assignment.grade,
            maxGrade: assignment.maxGrade,
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
            title: meeting.title,
          })),
          topics: course.topics.map((topic) => {
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
