"use client";

import { CoreToolbarShell, ToggleRow } from "@/components/core/toolbar/CoreToolbarShell";
import { ALL_TOOLBAR_ITEMS } from "@/lib/core/core-toolbar-defaults";
import type { CoreToolbarItemId } from "@/lib/core/core-toolbar-types";

const ITEM_LABELS: Record<CoreToolbarItemId, string> = {
  chat: "Chat",
  readWrite: "Read / Write",
  select: "Select",
  lasso: "Lasso",
  pen: "Pen",
  eraser: "Eraser",
  text: "Text",
  elements: "Elements",
  stickers: "Stickers",
  images: "Images",
  templates: "Templates",
  shapes: "Shapes",
  sticky: "Sticky notes",
  laser: "Laser pointer",
  record: "Record & summarize",
  recordings: "Show recordings",
  zoom: "Zoom window",
  ruler: "Ruler",
  timekeeper: "Time keeper",
  customize: "Customize toolbar",
  clearPage: "Clear page",
};

export function CoreToolbarCustomizePanel({
  visibleItems,
  onChange,
  onClose,
}: {
  visibleItems: CoreToolbarItemId[];
  onChange: (items: CoreToolbarItemId[]) => void;
  onClose: () => void;
}) {
  function toggle(id: CoreToolbarItemId) {
    if (id === "customize") return;
    if (visibleItems.includes(id)) {
      onChange(visibleItems.filter((item) => item !== id));
    } else {
      onChange([...visibleItems, id]);
    }
  }

  return (
    <CoreToolbarShell title="Customize toolbar" onClose={onClose} align="right">
      <p className="mb-2 text-xs text-stone-500">
        Toggle which tools appear in your top toolbar.
      </p>
      <div className="space-y-0.5">
        {ALL_TOOLBAR_ITEMS.filter((id) => id !== "customize").map((id) => (
          <ToggleRow
            key={id}
            label={ITEM_LABELS[id]}
            checked={visibleItems.includes(id)}
            onChange={() => toggle(id)}
          />
        ))}
      </div>
    </CoreToolbarShell>
  );
}
