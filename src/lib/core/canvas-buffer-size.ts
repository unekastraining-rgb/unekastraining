/**
 * Pure helpers for notebook SketchLayer / InfiniteCanvas sizing.
 * Keeps 0×0 first-layout from permanently locking a blank drawable surface.
 */

export type CanvasCssSizeInput = {
  measureClientWidth?: number | null;
  measureClientHeight?: number | null;
  canvasClientWidth?: number | null;
  canvasClientHeight?: number | null;
};

export type CanvasCssSize = {
  cssW: number;
  cssH: number;
  /** True when both axes came from the Math.max(1, …) fallback (still unmeasured). */
  provisional: boolean;
};

export function resolveCanvasCssSize(input: CanvasCssSizeInput): CanvasCssSize {
  const measuredW =
    positive(input.measureClientWidth) || positive(input.canvasClientWidth);
  const measuredH =
    positive(input.measureClientHeight) || positive(input.canvasClientHeight);
  const cssW = Math.max(1, measuredW || 1);
  const cssH = Math.max(1, measuredH || 1);
  return {
    cssW,
    cssH,
    provisional: measuredW === 0 || measuredH === 0,
  };
}

export function computeCanvasBufferPixels(
  cssW: number,
  cssH: number,
  devicePixelRatio: number,
  maxSide = 8192,
): { bw: number; bh: number; ratio: number } {
  const ratio = Math.min(Math.max(devicePixelRatio || 1, 0.5), 2);
  const wantW = cssW * ratio;
  const wantH = cssH * ratio;
  const fit = Math.min(1, maxSide / wantW, maxSide / wantH);
  return {
    bw: Math.max(1, Math.floor(wantW * fit)),
    bh: Math.max(1, Math.floor(wantH * fit)),
    ratio,
  };
}

/** Newest in-flight save wins; older completions must not update "Saved" UX. */
export function shouldApplySaveResult(
  saveGeneration: number,
  latestGeneration: number,
): boolean {
  return saveGeneration === latestGeneration;
}

function positive(value: number | null | undefined): number {
  return typeof value === "number" && value > 0 ? value : 0;
}
