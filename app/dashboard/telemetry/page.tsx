import { EcosystemDashboard } from "@/components/csl/EcosystemDashboard";
import { HubBackBar } from "@/components/hub/HubBackBar";

export const dynamic = "force-dynamic";

export default function TelemetryPage() {
  return (
    <div className="min-h-screen bg-[#fff8f1] text-stone-900">
      <HubBackBar title="Telemetry" />
      <div className="px-4 py-10 md:px-6">
        <EcosystemDashboard />
      </div>
    </div>
  );
}
