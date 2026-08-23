import { randomUUID } from "crypto";

import { db } from "@/lib/db";

import {
  DEFAULT_CUSTOMIZATION,
  MAX_FAVORITE_COLORS,
  MAX_RECENT_COLORS,
  type CustomizationState,
  type UserPalette,
} from "./types";
import { normalizeHex } from "./color-math";

export function parseCustomization(
  settingsJson: string | null | undefined,
): CustomizationState {
  if (!settingsJson) return { ...DEFAULT_CUSTOMIZATION };
  try {
    const blob = JSON.parse(settingsJson) as {
      customization?: Partial<CustomizationState>;
    };
    const raw = blob.customization ?? {};
    return {
      recentColors: Array.isArray(raw.recentColors)
        ? raw.recentColors.filter((c): c is string => typeof c === "string")
        : [],
      favoriteColors: Array.isArray(raw.favoriteColors)
        ? raw.favoriteColors.filter((c): c is string => typeof c === "string")
        : [],
      userPalettes: Array.isArray(raw.userPalettes)
        ? raw.userPalettes.filter(
            (p): p is UserPalette =>
              Boolean(p) &&
              typeof p === "object" &&
              typeof (p as UserPalette).id === "string" &&
              typeof (p as UserPalette).name === "string" &&
              Array.isArray((p as UserPalette).colors),
          )
        : [],
      favoritePaletteIds: Array.isArray(raw.favoritePaletteIds)
        ? raw.favoritePaletteIds.filter((id): id is string => typeof id === "string")
        : [],
      recentTemplateAssetIds: Array.isArray(raw.recentTemplateAssetIds)
        ? raw.recentTemplateAssetIds.filter((id): id is string => typeof id === "string")
        : [],
      favoriteTemplateAssetIds: Array.isArray(raw.favoriteTemplateAssetIds)
        ? raw.favoriteTemplateAssetIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return { ...DEFAULT_CUSTOMIZATION };
  }
}

async function readSettingsBlob(userId: string): Promise<Record<string, unknown>> {
  const row = await db.userPreferences.findUnique({
    where: { userId },
    select: { settingsJson: true },
  });
  if (!row?.settingsJson) return {};
  try {
    return JSON.parse(row.settingsJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writeCustomization(
  userId: string,
  next: CustomizationState,
): Promise<CustomizationState> {
  const blob = await readSettingsBlob(userId);
  const updated = { ...blob, customization: next };
  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, settingsJson: JSON.stringify(updated) },
    update: { settingsJson: JSON.stringify(updated) },
  });
  return next;
}

export async function getUserCustomization(userId: string): Promise<CustomizationState> {
  const row = await db.userPreferences.findUnique({
    where: { userId },
    select: { settingsJson: true },
  });
  return parseCustomization(row?.settingsJson);
}

export async function recordRecentColor(
  userId: string,
  color: string,
): Promise<CustomizationState> {
  const hex = normalizeHex(color);
  if (!hex) return getUserCustomization(userId);

  const current = await getUserCustomization(userId);
  const recentColors = [hex, ...current.recentColors.filter((c) => c !== hex)].slice(
    0,
    MAX_RECENT_COLORS,
  );
  return writeCustomization(userId, { ...current, recentColors });
}

export async function patchCustomization(
  userId: string,
  patch: Partial<CustomizationState>,
): Promise<CustomizationState> {
  const current = await getUserCustomization(userId);
  return writeCustomization(userId, { ...current, ...patch });
}

export async function toggleFavoriteColor(
  userId: string,
  color: string,
): Promise<CustomizationState> {
  const hex = normalizeHex(color);
  if (!hex) return getUserCustomization(userId);

  const current = await getUserCustomization(userId);
  const exists = current.favoriteColors.includes(hex);
  const favoriteColors = exists
    ? current.favoriteColors.filter((c) => c !== hex)
    : [hex, ...current.favoriteColors].slice(0, MAX_FAVORITE_COLORS);
  return writeCustomization(userId, { ...current, favoriteColors });
}

export async function removeRecentColor(
  userId: string,
  color: string,
): Promise<CustomizationState> {
  const hex = normalizeHex(color);
  if (!hex) return getUserCustomization(userId);
  const current = await getUserCustomization(userId);
  return writeCustomization(userId, {
    ...current,
    recentColors: current.recentColors.filter((c) => c !== hex),
  });
}

export async function upsertUserPalette(
  userId: string,
  palette: Omit<UserPalette, "id"> & { id?: string },
): Promise<CustomizationState> {
  const current = await getUserCustomization(userId);
  const id = palette.id ?? randomUUID();
  const now = new Date().toISOString();
  const entry: UserPalette = {
    id,
    name: palette.name.trim() || "My palette",
    colors: palette.colors.map((c) => normalizeHex(c)).filter((c): c is string => Boolean(c)),
    categoryId: palette.categoryId,
    createdAt: palette.createdAt ?? now,
    updatedAt: now,
  };

  const index = current.userPalettes.findIndex((p) => p.id === id);
  const userPalettes =
    index >= 0
      ? current.userPalettes.map((p, i) => (i === index ? entry : p))
      : [entry, ...current.userPalettes];

  return writeCustomization(userId, { ...current, userPalettes });
}

export async function deleteUserPalette(
  userId: string,
  paletteId: string,
): Promise<CustomizationState> {
  const current = await getUserCustomization(userId);
  return writeCustomization(userId, {
    ...current,
    userPalettes: current.userPalettes.filter((p) => p.id !== paletteId),
    favoritePaletteIds: current.favoritePaletteIds.filter((id) => id !== paletteId),
  });
}
