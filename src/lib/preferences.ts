import type { UserThemeSettings } from "@/lib/theme/types";
import { DEFAULT_THEME_SETTINGS } from "@/lib/theme/types";
import { db } from "@/lib/db";

function readSettingsBlob(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function readPaletteColors(raw: string | null | undefined): string[] | null {
  const blob = readSettingsBlob(raw);
  const colors = blob.paletteColors;
  if (!Array.isArray(colors)) return null;
  const normalized = colors.filter((value): value is string => typeof value === "string");
  return normalized.length > 0 ? normalized : null;
}

async function writePaletteColors(userId: string, paletteColors: string[] | null) {
  const row = await db.userPreferences.findUnique({
    where: { userId },
    select: { settingsJson: true },
  });
  const blob = readSettingsBlob(row?.settingsJson);
  const nextBlob = { ...blob, paletteColors: paletteColors ?? undefined };
  if (!paletteColors?.length) {
    delete nextBlob.paletteColors;
  }
  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, settingsJson: JSON.stringify(nextBlob) },
    update: { settingsJson: JSON.stringify(nextBlob) },
  });
}

export async function getOrCreateUserPreferences(
  userId: string,
): Promise<UserThemeSettings> {
  const existing = await db.userPreferences.findUnique({
    where: { userId },
  });

  if (existing) {
    return {
      themeTemplate: existing.themeTemplate as UserThemeSettings["themeTemplate"],
      primaryColor: existing.primaryColor,
      backgroundColor: existing.backgroundColor,
      accentColor: existing.accentColor,
      paletteColors: readPaletteColors(existing.settingsJson),
      elementaryMode: existing.elementaryMode,
      defaultQuickView: existing.defaultQuickView as UserThemeSettings["defaultQuickView"],
    };
  }

  const created = await db.userPreferences.create({
    data: { userId },
  });

  return {
    themeTemplate: created.themeTemplate as UserThemeSettings["themeTemplate"],
    primaryColor: created.primaryColor,
    backgroundColor: created.backgroundColor,
    accentColor: created.accentColor,
    paletteColors: readPaletteColors(created.settingsJson),
    elementaryMode: created.elementaryMode,
    defaultQuickView: created.defaultQuickView as UserThemeSettings["defaultQuickView"],
  };
}

export async function updateUserPreferences(
  userId: string,
  patch: Partial<UserThemeSettings>,
) {
  if (patch.paletteColors !== undefined) {
    await writePaletteColors(userId, patch.paletteColors);
  }

  await db.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      themeTemplate: patch.themeTemplate ?? DEFAULT_THEME_SETTINGS.themeTemplate,
      primaryColor: patch.primaryColor ?? null,
      backgroundColor: patch.backgroundColor ?? null,
      accentColor: patch.accentColor ?? null,
      elementaryMode: patch.elementaryMode ?? false,
      defaultQuickView: patch.defaultQuickView ?? DEFAULT_THEME_SETTINGS.defaultQuickView,
    },
    update: {
      ...(patch.themeTemplate !== undefined
        ? { themeTemplate: patch.themeTemplate }
        : {}),
      ...(patch.primaryColor !== undefined
        ? { primaryColor: patch.primaryColor }
        : {}),
      ...(patch.backgroundColor !== undefined
        ? { backgroundColor: patch.backgroundColor }
        : {}),
      ...(patch.accentColor !== undefined
        ? { accentColor: patch.accentColor }
        : {}),
      ...(patch.elementaryMode !== undefined
        ? { elementaryMode: patch.elementaryMode }
        : {}),
      ...(patch.defaultQuickView !== undefined
        ? { defaultQuickView: patch.defaultQuickView }
        : {}),
    },
  });
}
