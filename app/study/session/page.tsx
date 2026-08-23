import { HubBackBar } from "@/components/hub/HubBackBar";
import { StudySessionRunner } from "@/components/study/StudySessionRunner";
import type { StudyMinutes } from "@/lib/csl/study-now";

export const dynamic = "force-dynamic";

const VALID = [5, 10, 20, 30, 45, 60] as const;

export default async function StudySessionPage({
  searchParams,
}: {
  searchParams: Promise<{ minutes?: string }>;
}) {
  const params = await searchParams;
  const raw = Number(params.minutes ?? 30);
  const minutes = (VALID.includes(raw as (typeof VALID)[number])
    ? raw
    : 30) as StudyMinutes;

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
        }}
      />
    </>
  );
}
