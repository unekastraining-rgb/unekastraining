import { HubBackBar } from "@/components/hub/HubBackBar";
import { HubSubpageShell } from "@/components/hub/HubSubpageShell";
import { TheHaulWorkspace } from "@/components/haul/TheHaulWorkspace";

export const dynamic = "force-dynamic";

export default function TheHaulPage() {
  return (
    <HubSubpageShell>
      <HubBackBar title="The Haul" planningActive="hub" />
      <TheHaulWorkspace />
    </HubSubpageShell>
  );
}
