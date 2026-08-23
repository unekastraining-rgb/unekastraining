import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

import { FlashcardsView } from "./flashcards-view";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const user = await getOrCreateDefaultUser();
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
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <>
      <HubBackBar title="Flashcards" />
      <Suspense fallback={<div className="px-6 py-10 text-sm text-stone-500">Loading flashcards…</div>}>
        <FlashcardsView initialCards={cards} initialCourses={courses} />
      </Suspense>
    </>
  );
}
