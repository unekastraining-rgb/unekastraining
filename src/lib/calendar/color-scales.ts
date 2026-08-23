export type ColorScaleId = "vivid" | "pastel" | "earth" | "contrast";

export const COLOR_SCALES: Record<
  ColorScaleId,
  { label: string; colors: readonly string[] }
> = {
  vivid: {
    label: "Vivid",
    colors: [
      "#3b82f6",
      "#8b5cf6",
      "#22c55e",
      "#f59e0b",
      "#ec4899",
      "#14b8a6",
      "#6366f1",
      "#ea580c",
      "#0ea5e9",
      "#a855f7",
      "#84cc16",
      "#f43f5e",
    ],
  },
  pastel: {
    label: "Pastel",
    colors: [
      "#93c5fd",
      "#c4b5fd",
      "#86efac",
      "#fcd34d",
      "#f9a8d4",
      "#5eead4",
      "#a5b4fc",
      "#fdba74",
      "#7dd3fc",
      "#d8b4fe",
      "#bef264",
      "#fda4af",
    ],
  },
  earth: {
    label: "Earth",
    colors: [
      "#78716c",
      "#a16207",
      "#65a30d",
      "#0d9488",
      "#b45309",
      "#92400e",
      "#4d7c0f",
      "#0369a1",
      "#7c2d12",
      "#57534e",
      "#15803d",
      "#1e40af",
    ],
  },
  contrast: {
    label: "High contrast",
    colors: [
      "#1d4ed8",
      "#7e22ce",
      "#15803d",
      "#c2410c",
      "#be123c",
      "#0f766e",
      "#4338ca",
      "#b91c1c",
      "#0369a1",
      "#6b21a8",
      "#3f6212",
      "#9f1239",
    ],
  },
};

export function getPaletteForScale(scale: ColorScaleId): readonly string[] {
  return COLOR_SCALES[scale]?.colors ?? COLOR_SCALES.vivid.colors;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return null;
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function nearestPaletteColor(hex: string, palette: readonly string[]): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return palette[0] ?? hex;

  let best = palette[0] ?? hex;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const candidate of palette) {
    const c = hexToRgb(candidate);
    if (!c) continue;
    const dist =
      (rgb[0] - c[0]) ** 2 + (rgb[1] - c[1]) ** 2 + (rgb[2] - c[2]) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }

  return best;
}

/** Map a stored color onto the active event palette. */
export function applyToEventPalette(hex: string, palette: readonly string[]): string {
  return nearestPaletteColor(hex, palette);
}

/** Map a stored color onto the active palette (Google-style calendar recoloring). */
export function applyColorScale(hex: string, scale: ColorScaleId): string {
  const palette = getPaletteForScale(scale);
  return nearestPaletteColor(hex, palette);
}
