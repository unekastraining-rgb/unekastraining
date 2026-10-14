import { HubBackBar } from "@/components/hub/HubBackBar";
import { InteractiveChooserView } from "@/components/study/InteractiveChooserView";

export const dynamic = "force-dynamic";

/**
 * Bundle K — Interactive activity chooser (“Choose how you want to practice”).
 * Uses KL-backed interactive forms only.
 */
export default async function InteractiveChooserPage({
  searchParams,
}: {
  searchParams: Promise<{
    conceptId?: string;
    klConceptId?: string;
    courseId?: string;
    topic?: string;
  }>;
}) {
  const query = await searchParams;
  return (
    <>
      <HubBackBar title="Choose practice" planningActive="study" />
      <InteractiveChooserView
        klConceptId={query.klConceptId ?? query.conceptId ?? null}
        courseId={query.courseId ?? null}
        topic={query.topic ?? null}
      />
    </>
  );
}
