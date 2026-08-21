export type ThemeTemplateId =
  | "study-haul"
  | "ocean-breeze"
  | "lavender-dream"
  | "forest-study"
  | "sunset-coral"
  | "custom";

export interface ThemeTemplate {
  id: ThemeTemplateId;
  name: string;
  description: string;
  primary: string;
  background: string;
  accent: string;
  surface: string;
  text: string;
  muted: string;
  gradient: string;
}

export interface UserThemeSettings {
  themeTemplate: ThemeTemplateId;
  primaryColor: string | null;
  backgroundColor: string | null;
  accentColor: string | null;
  /** Full 5-swatch palette from built-in or imported palettes */
  paletteColors: string[] | null;
  elementaryMode: boolean;
  defaultQuickView: "today" | "week" | "due-soon";
}

export const DEFAULT_THEME_SETTINGS: UserThemeSettings = {
  themeTemplate: "study-haul",
  primaryColor: null,
  backgroundColor: null,
  accentColor: null,
  paletteColors: null,
  elementaryMode: false,
  defaultQuickView: "today",
};
