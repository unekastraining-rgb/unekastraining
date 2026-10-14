import { EcosystemDashboard } from "@/components/csl/EcosystemDashboard";
import { HubBackBar } from "@/components/hub/HubBackBar";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function TelemetryPage() {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);

  return (
    <div className="min-h-screen bg-[#fff8f1] text-stone-900">
      <HubBackBar title="Telemetry" />
      <div className="px-4 py-10 md:px-6">
        <EcosystemDashboard />
      </div>
    </div>
  );
}
