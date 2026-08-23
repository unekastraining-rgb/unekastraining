"use client";

import { CoreToolbarShell } from "@/components/core/toolbar/CoreToolbarShell";
import { ImagesImportPanel } from "@/components/core/ImagesImportPanel";

export function CoreToolbarImagesPanel({
  onInsert,
  onClose,
}: {
  onInsert: (assetId: string) => void;
  onClose: () => void;
}) {
  return (
    <CoreToolbarShell title="Images" onClose={onClose} align="left">
      <ImagesImportPanel
        compact
        onInsert={(assetId) => {
          onInsert(assetId);
          onClose();
        }}
      />
    </CoreToolbarShell>
  );
}
