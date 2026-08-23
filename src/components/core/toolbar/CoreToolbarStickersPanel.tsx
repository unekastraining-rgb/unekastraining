"use client";

import { CoreToolbarShell } from "@/components/core/toolbar/CoreToolbarShell";
import { StickersPanel } from "@/components/core/StickersPanel";

export function CoreToolbarStickersPanel({
  onInsert,
  onClose,
}: {
  onInsert: (assetId: string) => void;
  onClose: () => void;
}) {
  return (
    <CoreToolbarShell title="Stickers" onClose={onClose} align="left">
      <StickersPanel
        compact
        onInsert={(assetId) => {
          onInsert(assetId);
          onClose();
        }}
      />
    </CoreToolbarShell>
  );
}
