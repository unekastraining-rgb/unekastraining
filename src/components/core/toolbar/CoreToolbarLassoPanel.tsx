"use client";

import {
  CoreToolbarShell,
  NavRow,
  OptionChip,
  ToggleRow,
} from "@/components/core/toolbar/CoreToolbarShell";
import type { CoreToolbarState } from "@/lib/core/core-toolbar-types";

export function CoreToolbarLassoPanel({
  state,
  onChange,
  onClose,
}: {
  state: CoreToolbarState;
  onChange: (patch: Partial<CoreToolbarState>) => void;
  onClose: () => void;
}) {
  const lasso = state.lasso;

  function patchLasso(patch: Partial<typeof lasso>) {
    onChange({ lasso: { ...lasso, ...patch } });
  }

  return (
    <CoreToolbarShell title="Lasso" onClose={onClose}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">Type</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <OptionChip
          label="Rectangular"
          active={lasso.mode === "rect"}
          onClick={() => patchLasso({ mode: "rect" })}
        />
        <OptionChip
          label="Freehand"
          active={lasso.mode === "freehand"}
          onClick={() => patchLasso({ mode: "freehand" })}
        />
      </div>

      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">Select</p>
      <div className="space-y-0.5">
        <ToggleRow
          label="Handwriting"
          checked={lasso.selectHandwriting}
          onChange={(value) => patchLasso({ selectHandwriting: value })}
        />
        <ToggleRow
          label="Images"
          checked={lasso.selectImages}
          onChange={(value) => patchLasso({ selectImages: value })}
        />
        <ToggleRow
          label="Shapes"
          checked={lasso.selectShapes}
          onChange={(value) => patchLasso({ selectShapes: value })}
        />
        <ToggleRow
          label="Arrows"
          checked={lasso.selectArrows}
          onChange={(value) => patchLasso({ selectArrows: value })}
        />
        <ToggleRow
          label="Text boxes"
          checked={lasso.selectTextBoxes}
          onChange={(value) => patchLasso({ selectTextBoxes: value })}
        />
        <ToggleRow
          label="Equations"
          checked={lasso.selectEquations}
          onChange={(value) => patchLasso({ selectEquations: value })}
        />
        <ToggleRow
          label="Tape"
          checked={lasso.selectTape}
          onChange={(value) => patchLasso({ selectTape: value })}
        />
        <ToggleRow
          label="Sticky notes"
          checked={lasso.selectStickyNotes}
          onChange={(value) => patchLasso({ selectStickyNotes: value })}
        />
      </div>
    </CoreToolbarShell>
  );
}
