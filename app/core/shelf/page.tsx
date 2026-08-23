import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { NotebookShelfView } from "@/components/core/NotebookShelfView";
import { CustomizationProvider } from "@/components/customization/CustomizationProvider";

export const dynamic = "force-dynamic";

export default function CoreShelfPage() {
  return (
    <CustomizationProvider>
      <HubBackBar title="Notebook shelf" planningActive="core" />
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading shelf...</div>}>
        <NotebookShelfView />
      </Suspense>
    </CustomizationProvider>
  );
}
