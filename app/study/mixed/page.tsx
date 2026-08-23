import { HubBackBar } from "@/components/hub/HubBackBar";

import { MixedReviewView } from "./mixed-review-view";

export const dynamic = "force-dynamic";

export default function MixedReviewPage() {
  return (
    <>
      <HubBackBar title="Mixed Review" planningActive="study" />
      <MixedReviewView />
    </>
  );
}
