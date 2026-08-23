"use client";

import { CoreToolbarShell } from "@/components/core/toolbar/CoreToolbarShell";
import { ElementsPanel } from "@/components/core/ElementsPanel";
import type { ElementDefinition } from "@/lib/core/elements/catalog";

export function CoreToolbarElementsPanel({
  onInsert,
  onClose,
}: {
  onInsert: (element: ElementDefinition) => void;
  onClose: () => void;
}) {
  return (
    <CoreToolbarShell title="Elements" onClose={onClose} align="left">
      <ElementsPanel
        compact
        onInsert={(element) => {
          onInsert(element);
          onClose();
        }}
      />
    </CoreToolbarShell>
  );
}
