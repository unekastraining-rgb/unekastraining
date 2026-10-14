import { HubBackBar } from "@/components/hub/HubBackBar";
import { CapabilityCatalogView } from "@/components/study/CapabilityCatalogView";
import {
  buildPracticeItemHref,
  listSupportedPracticeLandscape,
  orderPracticeForContext,
} from "@/lib/study/practice-landscape";

export const dynamic = "force-dynamic";

/**
 * Bundle K — Practice destination.
 * Uses listSupportedPracticeLandscape — no second practice catalog.
 */
export default async function PracticeHubPage({
  searchParams,
}: {
  searchParams: Promise<{
    courseId?: string;
    topic?: string;
    conceptId?: string;
    materialId?: string;
  }>;
}) {
  const query = await searchParams;
  const all = listSupportedPracticeLandscape();
  const { suggested, more } = orderPracticeForContext(
    all,
    query.topic ?? null,
  );
  const ordered = [...suggested, ...more];
  const ctx = {
    courseId: query.courseId ?? null,
    topic: query.topic ?? null,
    conceptId: query.conceptId ?? null,
    materialId: query.materialId ?? null,
  };

  const items = ordered.map((item) => ({
    id: item.id,
    title: item.learnerTitle,
    description: item.description,
    href: buildPracticeItemHref(item, ctx),
    meta: suggested.some((s) => s.id === item.id) ? "Suggested" : "Also available",
  }));

  return (
    <>
      <HubBackBar title="Practice" planningActive="study" />
      <CapabilityCatalogView
        eyebrow="Study tools"
        title="Practice"
        description="Choose how you want to practice. Each option opens the same activity used by Adaptive Learning."
        items={items}
      />
    </>
  );
}
