import { HubBackBar } from "@/components/hub/HubBackBar";
import { LuckyRetentionReview } from "@/components/study/LuckyRetentionReview";
import {
  LUCKY_STORAGE_KEY,
  StudySessionRunner,
} from "@/components/study/StudySessionRunner";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function LuckySessionPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const params = await searchParams;
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);
  const courseId = params.courseId?.trim() || undefined;
  const luckyHref = courseId
    ? `/study/lucky?courseId=${encodeURIComponent(courseId)}`
    : "/study/lucky";
  const apiUrl = courseId
    ? `/api/study/lucky?courseId=${encodeURIComponent(courseId)}`
    : "/api/study/lucky";

  return (
    <>
      <HubBackBar title="Lucky Session" planningActive="study" />
      <div className="px-4 pt-4">
        <LuckyRetentionReview />
      </div>
      <StudySessionRunner
        config={{
          storageKey: LUCKY_STORAGE_KEY,
          backHref: luckyHref,
          backLabel: "Lucky",
          accent: "violet",
          activityType: "LUCKY",
          phaseLabel: "Lucky phase",
          loadFromApi: { url: apiUrl },
          courseId,
        }}
      />
    </>
  );
}
