"use client";

import { CoreToolbarShell } from "@/components/core/toolbar/CoreToolbarShell";
import { TemplateLibrary } from "@/components/customization/TemplateLibrary";
import type { PageTemplateId } from "@/lib/core/page-templates";

export function CoreToolbarTemplatesPanel({
  pageTemplateId,
  customBackgroundAssetId,
  onSelectBuiltin,
  onSelectImported,
  onClose,
}: {
  pageTemplateId?: PageTemplateId;
  customBackgroundAssetId?: string | null;
  onSelectBuiltin: (templateId: PageTemplateId) => void;
  onSelectImported: (assetId: string) => void;
  onClose: () => void;
}) {
  return (
    <CoreToolbarShell title="Page templates" onClose={onClose} align="left">
      <p className="mb-2 text-[10px] text-stone-500">
        Built-in paper layouts or import PNG, JPG, and PDF page backgrounds.
      </p>
      <TemplateLibrary
        selectedBuiltinId={pageTemplateId}
        selectedImportedId={customBackgroundAssetId ?? undefined}
        onSelectBuiltin={(id) => {
          onSelectBuiltin(id as PageTemplateId);
          onClose();
        }}
        onSelectImported={(assetId) => {
          onSelectImported(assetId);
          onClose();
        }}
      />
    </CoreToolbarShell>
  );
}
