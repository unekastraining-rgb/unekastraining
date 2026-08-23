import { HubBackBar } from "@/components/hub/HubBackBar";
import {
  LUCKY_STORAGE_KEY,
  StudySessionRunner,
} from "@/components/study/StudySessionRunner";

export const dynamic = "force-dynamic";

export default function LuckySessionPage() {
  return (
    <>
      <HubBackBar title="Lucky Session" planningActive="study" />
      <StudySessionRunner
        config={{
          storageKey: LUCKY_STORAGE_KEY,
          backHref: "/study/lucky",
          backLabel: "Lucky",
          accent: "violet",
          activityType: "LUCKY",
          phaseLabel: "Lucky phase",
          loadFromApi: { url: "/api/study/lucky" },
        }}
      />
    </>
  );
}
