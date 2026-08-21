import { clamp, hexToHsl, hexToRgb, hslToHex, normalizeHex } from "@/lib/customization/color-math";
import type { ThemeTemplate, ThemeTemplateId } from "./types";

/** Relative luminance (0–1) for contrast checks. */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function isCanvasSafeColor(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  return hsl.l >= 84 && hsl.s <= 45;
}

/** Light neutral canvas tinted by a hue — never a saturated swatch. */
export function tintCanvas(sourceHex: string, lightness = 97): string {
  const hsl = hexToHsl(sourceHex);
  if (!hsl) return "#fafaf9";
  return hslToHex({
    h: hsl.h,
    s: clamp(hsl.s * 0.28, 6, 28),
    l: lightness,
  });
}

export function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** Ensure primary is dark enough for white button text. */
export function ensureButtonPrimary(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  if (hsl.l > 58) {
    return hslToHex({ ...hsl, l: clamp(hsl.l - 18, 32, 52) });
  }
  if (hsl.l < 28) {
    return hslToHex({ ...hsl, l: clamp(hsl.l + 12, 28, 42) });
  }
  return hex;
}

/** Readable body/heading ink for a surface — light bg → dark text, dark bg → light text. */
export function textForSurface(surfaceHex: string, preferredDark?: string): string {
  const surfaceLum = getRelativeLuminance(surfaceHex);
  if (surfaceLum <= 0.55) {
    return "#f5f5f4";
  }

  if (preferredDark) {
    const preferredLum = getRelativeLuminance(preferredDark);
    if (preferredLum < 0.35) {
      return preferredDark;
    }
  }

  return "#1c1917";
}

function textForCanvas(canvasHex: string): string {
  return textForSurface(canvasHex);
}

export function mutedForText(textHex: string): string {
  const hsl = hexToHsl(textHex);
  if (!hsl) return "#57534e";

  if (hsl.l > 50) {
    // Light ink on dark surfaces — slightly dimmer, still light
    return hslToHex({
      ...hsl,
      s: clamp(hsl.s * 0.35, 0, 16),
      l: clamp(hsl.l - 10, 62, 88),
    });
  }

  // Dark ink on light surfaces — softer but still clearly dark (never pale grey)
  return hslToHex({
    ...hsl,
    s: clamp(hsl.s * 0.55, 0, 28),
    l: clamp(hsl.l + 16, 28, 40),
  });
}

/** Subtle border/divider ink that stays visible on themed surfaces. */
export function borderInkForSurface(surfaceHex: string): string {
  const ink = textForSurface(surfaceHex);
  return withAlpha(ink, getRelativeLuminance(surfaceHex) > 0.55 ? 0.14 : 0.22);
}

function buildGradient(canvas: string, primary: string, accent: string): string {
  return [
    `radial-gradient(circle at top left, ${withAlpha(primary, 0.14)}, transparent 42%)`,
    `radial-gradient(circle at top right, ${withAlpha(accent, 0.12)}, transparent 38%)`,
    `linear-gradient(180deg, ${canvas} 0%, ${tintCanvas(primary, 95)} 100%)`,
  ].join(", ");
}

/** Harmonize raw palette swatches into readable app theme (Edge-style). */
export function harmonizeThemeFromAccents(
  primaryInput: string,
  accentInput: string,
  fallback: ThemeTemplate,
): ThemeTemplate {
  const primary = normalizeHex(primaryInput) ?? fallback.primary;
  const accent = normalizeHex(accentInput) ?? fallback.accent;
  const canvas = tintCanvas(primary);
  const text = textForCanvas(canvas);
  const muted = mutedForText(text);

  return {
    id: "custom",
    name: "Custom",
    description: "Harmonized palette",
    primary: ensureButtonPrimary(primary),
    background: canvas,
    accent,
    surface: "#ffffff",
    text,
    muted,
    gradient: buildGradient(canvas, primary, accent),
  };
}

export function resolveHarmonizedTheme(settings: {
  themeTemplate: ThemeTemplateId;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  accentColor?: string | null;
}, base: ThemeTemplate): ThemeTemplate {
  const namedTemplate = settings.themeTemplate !== "custom";
  const hasAccentOverrides = !!(settings.primaryColor || settings.accentColor);

  if (namedTemplate && !hasAccentOverrides) {
    if (settings.backgroundColor && isCanvasSafeColor(settings.backgroundColor)) {
      const canvas = normalizeHex(settings.backgroundColor) ?? base.background;
      return {
        ...base,
        background: canvas,
        text: textForCanvas(canvas),
        muted: mutedForText(textForCanvas(canvas)),
        gradient: buildGradient(canvas, base.primary, base.accent),
      };
    }
    return base;
  }

  const primary =
    settings.primaryColor ??
    (settings.backgroundColor && !isCanvasSafeColor(settings.backgroundColor)
      ? settings.backgroundColor
      : null) ??
    base.primary;

  const accent = settings.accentColor ?? base.accent;
  const harmonized = harmonizeThemeFromAccents(primary, accent, base);

  if (settings.backgroundColor && isCanvasSafeColor(settings.backgroundColor)) {
    const canvas = normalizeHex(settings.backgroundColor) ?? harmonized.background;
    return {
      ...harmonized,
      background: canvas,
      text: textForCanvas(canvas),
      muted: mutedForText(textForCanvas(canvas)),
      gradient: buildGradient(canvas, harmonized.primary, harmonized.accent),
    };
  }

  return harmonized;
}
