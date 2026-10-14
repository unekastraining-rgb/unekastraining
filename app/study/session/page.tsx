import { HubBackBar } from "@/components/hub/HubBackBar";
import { StudySessionRunner } from "@/components/study/StudySessionRunner";
import type { StudyMinutes } from "@/lib/csl/study-now";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

const VALID = [5, 10, 20, 30, 45, 60] as const;

export default async function StudySessionPage({
  searchParams,
}: {
  searchParams: Promise<{ minutes?: string; courseId?: string }>;
}) {
  const params = await searchParams;
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);
  const raw = Number(params.minutes ?? 30);
  const minutes = (VALID.includes(raw as (typeof VALID)[number])
    ? raw
    : 30) as StudyMinutes;
  const courseId = params.courseId?.trim() || undefined;

  return (
    <>
      <HubBackBar title="Study Session" planningActive="study" />
      <StudySessionRunner
        config={{
          storageKey: "study-now-session",
          backHref: "/study",
          backLabel: "Study Hub",
          accent: "orange",
          activityType: "GENERAL",
          initialMinutes: minutes,
          courseId,
        }}
      />
    </>
  );
}
