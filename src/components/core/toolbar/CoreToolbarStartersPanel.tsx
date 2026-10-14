"use client";

import { CanvasStartersPanel } from "@/components/core/CanvasStartersPanel";
import { CoreToolbarShell } from "@/components/core/toolbar/CoreToolbarShell";

export function CoreToolbarStartersPanel({
  onApply,
  onClose,
}: {
  onApply: (starterIds: string[]) => void;
  onClose: () => void;
}) {
  return (
    <CoreToolbarShell title="Starters" onClose={onClose} className="w-[min(22rem,calc(100vw-2rem))]">
      <CanvasStartersPanel
        title="Quick layouts"
        description="Grids, timelines, whiteboards — tap Apply to add to this page."
        touchFriendly
        onApply={(ids) => {
          onApply(ids);
          onClose();
        }}
      />
    </CoreToolbarShell>
  );
}
