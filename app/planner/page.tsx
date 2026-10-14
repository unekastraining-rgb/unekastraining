import { HubBackBar } from "@/components/hub/HubBackBar";
import { PlannerDestination } from "@/components/planner/PlannerDestination";
import { CustomizationProvider } from "@/components/customization/CustomizationProvider";

export const dynamic = "force-dynamic";

/**
 * Bundle K — Real Planner destination (no longer redirects to dashboard).
 * Uses existing /api/planner + schedule proposals infrastructure.
 */
export default function PlannerRoutePage() {
  return (
    <CustomizationProvider>
      <HubBackBar title="Planner" planningActive="hub" />
      <PlannerDestination />
    </CustomizationProvider>
  );
}
