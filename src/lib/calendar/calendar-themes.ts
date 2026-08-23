import type { ColorScaleId } from "./color-scales";
import { getPaletteForScale } from "./color-scales";
import type { CalendarSettings } from "./settings";

export type CalendarThemeId =
  | "coursicle-coral"
  | "coursicle-lavender"
  | "coursicle-dark"
  | "coursicle-classic"
  | "coursicle-mint"
  | "coursicle-sky"
  | "custom";

export interface CalendarThemePreset {
  id: CalendarThemeId;
  label: string;
  backgroundColor: string;
  accentColor: string;
  eventPalette: readonly string[];
  textColor: string;
  mutedTextColor: string;
  gridLineColor: string;
  headerBackground: string;
  eventFillOpacity: number;
  isDark: boolean;
}

export interface CalendarAppearance {
  themeId: CalendarThemeId;
  backgroundColor: string;
  accentColor: string;
  eventPalette: readonly string[];
  textColor: string;
  mutedTextColor: string;
  gridLineColor: string;
  headerBackground: string;
  eventFillOpacity: number;
  isDark: boolean;
}

export const CALENDAR_THEME_PRESETS: CalendarThemePreset[] = [
  {
    id: "coursicle-coral",
    label: "Coral",
    backgroundColor: "#fff0f3",
    accentColor: "#e8837f",
    eventPalette: ["#f9a8a0", "#f4b8a8", "#e8837f", "#fbbf9a", "#fda4af", "#fdba74"],
    textColor: "#292524",
    mutedTextColor: "#78716c",
    gridLineColor: "rgba(232, 131, 127, 0.18)",
    headerBackground: "rgba(232, 131, 127, 0.12)",
    eventFillOpacity: 0.58,
    isDark: false,
  },
  {
    id: "coursicle-lavender",
    label: "Lavender",
    backgroundColor: "#f5f0ff",
    accentColor: "#7c3aed",
    eventPalette: ["#c4b5fd", "#a78bfa", "#8b5cf6", "#93c5fd", "#a5b4fc", "#ddd6fe"],
    textColor: "#1e1b4b",
    mutedTextColor: "#6b7280",
    gridLineColor: "rgba(124, 58, 237, 0.14)",
    headerBackground: "rgba(124, 58, 237, 0.1)",
    eventFillOpacity: 0.55,
    isDark: false,
  },
  {
    id: "coursicle-dark",
    label: "Dark",
    backgroundColor: "#141414",
    accentColor: "#ef4444",
    eventPalette: ["#991b1b", "#b91c1c", "#dc2626", "#7f1d1d", "#450a0a", "#881337"],
    textColor: "#fafafa",
    mutedTextColor: "#a3a3a3",
    gridLineColor: "rgba(255, 255, 255, 0.08)",
    headerBackground: "rgba(239, 68, 68, 0.12)",
    eventFillOpacity: 0.72,
    isDark: true,
  },
  {
    id: "coursicle-classic",
    label: "Classic",
    backgroundColor: "#ffffff",
    accentColor: "#6366f1",
    eventPalette: ["#fde68a", "#93c5fd", "#86efac", "#f9a8d4", "#c4b5fd", "#fdba74"],
    textColor: "#1c1917",
    mutedTextColor: "#78716c",
    gridLineColor: "rgba(0, 0, 0, 0.06)",
    headerBackground: "rgba(99, 102, 241, 0.08)",
    eventFillOpacity: 0.5,
    isDark: false,
  },
  {
    id: "coursicle-mint",
    label: "Mint",
    backgroundColor: "#f0fdf4",
    accentColor: "#059669",
    eventPalette: ["#86efac", "#6ee7b7", "#34d399", "#a7f3d0", "#bef264", "#5eead4"],
    textColor: "#14532d",
    mutedTextColor: "#4b5563",
    gridLineColor: "rgba(5, 150, 105, 0.12)",
    headerBackground: "rgba(5, 150, 105, 0.1)",
    eventFillOpacity: 0.52,
    isDark: false,
  },
  {
    id: "coursicle-sky",
    label: "Sky",
    backgroundColor: "#f0f9ff",
    accentColor: "#0284c7",
    eventPalette: ["#7dd3fc", "#93c5fd", "#38bdf8", "#bae6fd", "#67e8f9", "#a5b4fc"],
    textColor: "#0c4a6e",
    mutedTextColor: "#64748b",
    gridLineColor: "rgba(2, 132, 199, 0.12)",
    headerBackground: "rgba(2, 132, 199, 0.08)",
    eventFillOpacity: 0.52,
    isDark: false,
  },
];

export function getThemePreset(id: CalendarThemeId): CalendarThemePreset | undefined {
  return CALENDAR_THEME_PRESETS.find((theme) => theme.id === id);
}

export function resolveCalendarAppearance(settings: CalendarSettings): CalendarAppearance {
  const preset =
    settings.themeId !== "custom"
      ? getThemePreset(settings.themeId)
      : undefined;

  const eventPalette =
    settings.customEventPalette && settings.customEventPalette.length > 0
      ? settings.customEventPalette
      : preset?.eventPalette ?? getPaletteForScale(settings.colorScale);

  return {
    themeId: settings.themeId,
    backgroundColor: settings.backgroundColor ?? preset?.backgroundColor ?? "#fff8f1",
    accentColor: settings.accentColor ?? preset?.accentColor ?? "#ea580c",
    eventPalette,
    textColor: preset?.textColor ?? (settings.themeId === "coursicle-dark" ? "#fafafa" : "#1c1917"),
    mutedTextColor: preset?.mutedTextColor ?? "#78716c",
    gridLineColor: preset?.gridLineColor ?? "rgba(0,0,0,0.06)",
    headerBackground: preset?.headerBackground ?? "rgba(234, 88, 12, 0.08)",
    eventFillOpacity: preset?.eventFillOpacity ?? 0.5,
    isDark: preset?.isDark ?? settings.themeId === "coursicle-dark",
  };
}

/** Apply a palette (e.g. from PaletteLibrary) as a full calendar theme. */
export function calendarThemeFromPalette(colors: string[]): Partial<CalendarSettings> {
  if (colors.length === 0) return {};
  return {
    themeId: "custom",
    accentColor: colors[0],
    backgroundColor: colors[1] ?? lighten(colors[0], 0.92),
    customEventPalette:
      colors.length >= 3 ? colors.slice(2) : [...colors, ...colors].slice(0, 6),
    colorScale: "vivid",
  };
}

function lighten(hex: string, amount: number): string {
  const rgb = hex.replace("#", "");
  if (rgb.length !== 6) return "#fff8f1";
  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);
  return `#${[r, g, b]
    .map((channel) =>
      Math.round(channel + (255 - channel) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function settingsFromThemePreset(themeId: CalendarThemeId): Partial<CalendarSettings> {
  const preset = getThemePreset(themeId);
  if (!preset) return { themeId: "custom" };
  return {
    themeId,
    backgroundColor: preset.backgroundColor,
    accentColor: preset.accentColor,
    customEventPalette: [...preset.eventPalette],
    colorScale: themeId === "coursicle-dark" ? "contrast" : "pastel",
  };
}

/** Map legacy color scale changes onto custom palette. */
export function settingsFromColorScale(scale: ColorScaleId): Partial<CalendarSettings> {
  return {
    themeId: "custom",
    customEventPalette: [...getPaletteForScale(scale)],
    colorScale: scale,
  };
}
