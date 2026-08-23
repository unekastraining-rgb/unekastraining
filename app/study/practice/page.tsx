import { HubBackBar } from "@/components/hub/HubBackBar";
import { CodePracticeWorkspace } from "@/components/study/CodePracticeWorkspace";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const user = await getOrCreateDefaultUser();
  const courses = await db.course.findMany({
    where: { userId: user.id },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <>
      <HubBackBar title="Practice" planningActive="study" />
      <CodePracticeWorkspace initialCourses={courses} />
    </>
  );
}
