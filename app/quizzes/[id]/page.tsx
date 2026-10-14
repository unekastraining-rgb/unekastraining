import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

import { QuizTaker } from "./quiz-taker";

export const dynamic = "force-dynamic";

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);

  return (
    <>
      <HubBackBar title="Take quiz" />
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-stone-500">Loading quiz…</p>
          </div>
        }
      >
        <QuizTaker quizId={id} />
      </Suspense>
    </>
  );
}
