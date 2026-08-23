import { HubBackBar } from "@/components/hub/HubBackBar";

import { LuckyEngineView } from "./lucky-engine-view";

export const dynamic = "force-dynamic";

export default function LuckyPage() {
  return (
    <>
      <HubBackBar title="Lucky" planningActive="study" />
      <LuckyEngineView />
    </>
  );
}
