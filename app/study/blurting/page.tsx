import { HubBackBar } from "@/components/hub/HubBackBar";
import { GuidedStudyActivity } from "@/components/study/GuidedStudyActivity";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function BlurtingPage() {
  const user = await getOrCreateDefaultUser();
  const courses = await db.course.findMany({
    where: { userId: user.id },
    select: { id: true, title: true },
  });

  return (
    <>
      <HubBackBar title="Blurting" />
      <GuidedStudyActivity
        mode="blurting"
        title="Blurting"
        subtitle="Write everything you remember without looking at your notes. We'll compare it to your course material and show gaps."
        placeholder="Start writing everything you remember about the topic..."
        initialCourses={courses}
      />
    </>
  );
}
