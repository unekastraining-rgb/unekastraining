import { HubBackBar } from "@/components/hub/HubBackBar";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

import { LuckyEngineView } from "./lucky-engine-view";

export const dynamic = "force-dynamic";

export default async function LuckyPage() {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);

  return (
    <>
      <HubBackBar title="Lucky" planningActive="study" />
      <LuckyEngineView />
    </>
  );
}
