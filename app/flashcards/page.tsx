import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { withReadableCourse } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

import { FlashcardsView } from "./flashcards-view";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);
  const now = new Date();

  const [cards, courses] = await Promise.all([
    db.flashcard.findMany({
      where: {
        userId: user.id,
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
      },
      include: {
        topic: {
          select: { id: true, name: true, courseId: true },
        },
      },
      orderBy: { nextReviewAt: "asc" },
      take: 50,
    }),
    db.course.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        code: true,
        materials: {
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, type: true },
          take: 40,
        },
        topics: {
          orderBy: { sortOrder: "asc" },
          take: 24,
          select: { name: true },
        },
      },
    }),
  ]);

  return (
    <>
      <HubBackBar title="Flashcards" />
      <Suspense fallback={<div className="px-6 py-10 text-sm text-stone-500">Loading flashcards…</div>}>
        <FlashcardsView
          initialCards={cards}
          initialCourses={courses.map((course) => ({
            ...withReadableCourse(course),
            topics: course.topics
              .map((topic) => topic.name)
              .filter((name) => !isMetaSyllabusTopic(name)),
          }))}
        />
      </Suspense>
    </>
  );
}
