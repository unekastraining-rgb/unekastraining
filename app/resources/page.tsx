import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { CustomizationProvider } from "@/components/customization/CustomizationProvider";
import { getResourcesLibrarySettings } from "@/lib/resources/library-settings";
import { serializeResource } from "@/lib/resources/serialize";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

import { ResourcesView } from "./resources-view";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const user = await getOrCreateDefaultUser();

  const [resources, librarySettings] = await Promise.all([
    db.resource.findMany({
      where: { userId: user.id },
      orderBy: { title: "asc" },
    }),
    getResourcesLibrarySettings(user.id),
  ]);

  return (
    <CustomizationProvider>
      <HubBackBar title="Resources" planningActive="resources" />
      <Suspense
        fallback={
          <div className="px-6 py-10 text-sm text-stone-500">Loading resources…</div>
        }
      >
        <ResourcesView
          initialResources={resources.map(serializeResource)}
          initialSettings={librarySettings}
          aiAvailable={isAIConfigured()}
        />
      </Suspense>
    </CustomizationProvider>
  );
}
