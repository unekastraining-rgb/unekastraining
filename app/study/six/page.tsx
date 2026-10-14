import { HubBackBar } from "@/components/hub/HubBackBar";
import { CapabilityCatalogView } from "@/components/study/CapabilityCatalogView";
import { SIX_ACTIVITIES } from "@/lib/csl/six";
import { sixGuideHref } from "@/lib/csl/six-guides";

export const dynamic = "force-dynamic";

/**
 * Bundle K — Six techniques catalog.
 * Direct selection still uses existing /study/six/[component] evidence path.
 */
export default async function SixCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    courseId?: string;
    topic?: string;
    materialId?: string;
  }>;
}) {
  const query = await searchParams;
  const items = SIX_ACTIVITIES.map((activity, index) => ({
    id: activity.id,
    title: `${index + 1}. ${activity.title}`,
    description: `${activity.description} Best when: ${activity.whenToUse}.`,
    href: sixGuideHref(activity.id, {
      courseId: query.courseId,
      topicName: query.topic,
      materialId: query.materialId,
    }),
    meta: "Guided session",
  }));

  return (
    <>
      <HubBackBar title="Six Techniques" planningActive="study" />
      <CapabilityCatalogView
        eyebrow="Study tools"
        title="Six Techniques"
        description="Pick a method to practice. Your session still records learning evidence — choosing manually does not skip tracking."
        items={items}
      />
    </>
  );
}
