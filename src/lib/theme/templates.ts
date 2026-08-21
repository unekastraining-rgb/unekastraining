import type { ThemeTemplate, ThemeTemplateId } from "./types";
import { resolveHarmonizedTheme } from "./harmonize";

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: "study-haul",
    name: "Study Haul",
    description: "Warm cream with orange and teal accents",
    primary: "#ea580c",
    background: "#fff8f1",
    accent: "#0d9488",
    surface: "#ffffff",
    text: "#292524",
    muted: "#78716c",
    gradient:
      "radial-gradient(circle at top left, rgba(251,146,60,0.18), transparent 40%), radial-gradient(circle at top right, rgba(45,212,191,0.15), transparent 35%), linear-gradient(180deg, #fff8f1 0%, #fff1e6 100%)",
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Cool blues and sandy whites",
    primary: "#0284c7",
    background: "#f0f9ff",
    accent: "#06b6d4",
    surface: "#ffffff",
    text: "#0c4a6e",
    muted: "#64748b",
    gradient:
      "radial-gradient(circle at top, rgba(14,165,233,0.15), transparent 45%), linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)",
  },
  {
    id: "lavender-dream",
    name: "Lavender Dream",
    description: "Soft purples and lilac",
    primary: "#7c3aed",
    background: "#faf5ff",
    accent: "#a78bfa",
    surface: "#ffffff",
    text: "#3b0764",
    muted: "#7e22ce",
    gradient:
      "radial-gradient(circle at top right, rgba(167,139,250,0.2), transparent 40%), linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)",
  },
  {
    id: "forest-study",
    name: "Forest Study",
    description: "Calm greens for deep focus",
    primary: "#059669",
    background: "#f0fdf4",
    accent: "#34d399",
    surface: "#ffffff",
    text: "#14532d",
    muted: "#4b5563",
    gradient:
      "radial-gradient(circle at top left, rgba(52,211,153,0.15), transparent 40%), linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)",
  },
  {
    id: "sunset-coral",
    name: "Sunset Coral",
    description: "Pink and peach sunset vibes",
    primary: "#e11d48",
    background: "#fff1f2",
    accent: "#fb7185",
    surface: "#ffffff",
    text: "#881337",
    muted: "#9f1239",
    gradient:
      "radial-gradient(circle at top, rgba(251,113,133,0.2), transparent 45%), linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)",
  },
];

export function getThemeTemplate(id: ThemeTemplateId): ThemeTemplate {
  return THEME_TEMPLATES.find((t) => t.id === id) ?? THEME_TEMPLATES[0];
}

export function resolveThemeColors(settings: {
  themeTemplate: ThemeTemplateId;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  accentColor?: string | null;
}): ThemeTemplate {
  const base = getThemeTemplate(settings.themeTemplate);
  return resolveHarmonizedTheme(settings, base);
}
