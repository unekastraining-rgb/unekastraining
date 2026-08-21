import { hexToRgb, normalizeHex } from "@/lib/customization/color-math";
import { DEFAULT_THEME_SETTINGS } from "@/lib/theme/types";
import { resolveThemeColors } from "@/lib/theme/templates";
import {
  borderInkForSurface,
  isCanvasSafeColor,
  mutedForText,
  textForSurface,
  withAlpha,
} from "@/lib/theme/harmonize";

export function paletteToThemePatch(colors: string[]) {
  const highlight = colors[3] ?? null;
  return {
    themeTemplate: "custom" as const,
    primaryColor: colors[0] ?? null,
    backgroundColor:
      highlight && isCanvasSafeColor(highlight) ? highlight : null,
    accentColor: colors[2] ?? colors[1] ?? colors[0] ?? null,
    paletteColors: colors.length > 0 ? colors : null,
  };
}

function mixHex(a: string, b: string, weightB = 0.5): string {
  const left = hexToRgb(normalizeHex(a) ?? a);
  const right = hexToRgb(normalizeHex(b) ?? b);
  if (!left || !right) return a;
  const weightA = 1 - weightB;
  const channel = (leftChannel: number, rightChannel: number) =>
    Math.round(leftChannel * weightA + rightChannel * weightB);
  const r = channel(left.r, right.r);
  const g = channel(left.g, right.g);
  const blue = channel(left.b, right.b);
  return `#${[r, g, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function reconstructPaletteFromSettings(settings: {
  primaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  paletteColors?: string[] | null;
}): string[] | undefined {
  if (settings.paletteColors?.length) return settings.paletteColors;
  if (!settings.primaryColor) return undefined;
  const primary = settings.primaryColor;
  const accent = settings.accentColor ?? primary;
  return [
    primary,
    mixHex(primary, accent, 0.46),
    accent,
    settings.backgroundColor ?? mixHex(primary, "#ffffff", 0.82),
    mixHex(primary, "#1c1917", 0.72),
  ];
}

export function computeThemeCssVariables(
  resolved: ReturnType<typeof resolveThemeColors>,
  paletteSwatches?: string[],
): Record<string, string> {
  const warm = paletteSwatches?.[1] ?? mixHex(resolved.primary, resolved.accent, 0.46);
  const highlight = paletteSwatches?.[3] ?? resolved.background;
  const deep = paletteSwatches?.[4] ?? resolved.text;
  const base = resolved.background;
  const elevated = mixHex(highlight, mixHex(warm, "#f8f7f5", 0.55), 0.48);
  const surfaceCard = mixHex(elevated, highlight, 0.28);
  const surfaceMuted = mixHex(warm, highlight, 0.32);
  const sidebarSurface = mixHex(highlight, elevated, 0.38);
  const chip = mixHex(elevated, "#ffffff", 0.42);
  // Ink is always derived from the page canvas (always a light tint), never elevated
  // surfaces — warm palettes can darken elevated enough to incorrectly flip all text light.
  const pageText = textForSurface(base, deep);
  const headingText = pageText;
  const bodyText = mutedForText(pageText);
  const chipBorder = withAlpha(headingText, 0.2);
  const borderSubtle = borderInkForSurface(base);
  const shadowInk = headingText;
  const elevation1 = `0 1px 2px ${withAlpha(shadowInk, 0.05)}, 0 10px 28px -14px ${withAlpha(shadowInk, 0.1)}`;

  return {
    "--sh-primary": resolved.primary,
    "--sh-background": base,
    "--sh-base": base,
    "--sh-elevated": elevated,
    "--sh-accent": resolved.accent,
    "--sh-surface": elevated,
    "--sh-surface-card": surfaceCard,
    "--sh-surface-muted": surfaceMuted,
    "--sh-sidebar-surface": sidebarSurface,
    "--sh-chip": chip,
    "--sh-chip-border": chipBorder,
    "--sh-border-subtle": borderSubtle,
    "--sh-input": chip,
    "--sh-text-heading": headingText,
    "--sh-text-body": bodyText,
    "--sh-elevation-1": elevation1,
    "--sh-gradient": resolved.gradient,
    "--sh-warm": warm,
    "--sh-highlight": highlight,
    "--sh-deep": deep,
    "--sh-text": pageText,
    "--sh-muted": bodyText,
    "--sh-primary-soft": withAlpha(resolved.primary, 0.18),
    "--sh-accent-soft": withAlpha(resolved.accent, 0.16),
    "--sh-warm-soft": withAlpha(warm, 0.18),
    "--sh-deep-soft": withAlpha(deep, 0.08),
    "--sh-highlight-soft": withAlpha(highlight, 0.45),
    "--sh-border": borderSubtle,
    "--sh-shadow": withAlpha(shadowInk, 0.12),
    "--primary": resolved.primary,
    "--secondary": resolved.accent,
    "--background": resolved.background,
    "--foreground": pageText,
    "--muted": bodyText,
    "--card": resolved.surface,
  };
}

export function applyThemeCssVariables(
  resolved: ReturnType<typeof resolveThemeColors>,
  paletteSwatches?: string[],
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = computeThemeCssVariables(resolved, paletteSwatches);

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  document.body.style.background = vars["--sh-gradient"] || vars["--sh-background"];
  document.body.style.color = vars["--sh-text"];
}

export function applyPaletteCssVariables(colors: string[]) {
  const settings = { ...DEFAULT_THEME_SETTINGS, ...paletteToThemePatch(colors) };
  applyThemeCssVariables(resolveThemeColors(settings), colors);
}

export async function applyStudyHaulPaletteGlobally(colors: string[]) {
  if (colors.length === 0) return;
  const patch = paletteToThemePatch(colors);
  applyPaletteCssVariables(colors);

  try {
    localStorage.setItem(
      "study-haul-theme",
      JSON.stringify({ ...DEFAULT_THEME_SETTINGS, ...patch }),
    );
  } catch {
    // ignore storage errors
  }

  try {
    await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch {
    // ignore network errors in UI
  }
}
