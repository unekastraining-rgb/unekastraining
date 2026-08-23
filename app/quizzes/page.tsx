import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

import { QuizzesView } from "./quizzes-view";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const user = await getOrCreateDefaultUser();
  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <>
      <HubBackBar title="Quizzes" />
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading quizzes...</div>}>
        <QuizzesView initialCourses={courses} />
      </Suspense>
    </>
  );
}
