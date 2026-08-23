import { db } from "@/lib/db";
import {
  DEFAULT_RESOURCES_LIBRARY_SETTINGS,
  type ResourcesLibrarySettings,
} from "@/lib/resources/types";

const SETTINGS_KEY = "resourcesLibrary";

function readBlob(settingsJson: string | null | undefined): Record<string, unknown> {
  if (!settingsJson) return {};
  try {
    return JSON.parse(settingsJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function parseResourcesLibrarySettings(
  raw: unknown,
): ResourcesLibrarySettings {
  const value = (raw ?? {}) as Partial<ResourcesLibrarySettings>;
  return {
    layout: value.layout === "list" ? "list" : DEFAULT_RESOURCES_LIBRARY_SETTINGS.layout,
    appearance:
      value.appearance === "dark" || value.appearance === "system"
        ? value.appearance
        : DEFAULT_RESOURCES_LIBRARY_SETTINGS.appearance,
    showIcons: value.showIcons ?? DEFAULT_RESOURCES_LIBRARY_SETTINGS.showIcons,
    showDescriptions:
      value.showDescriptions ?? DEFAULT_RESOURCES_LIBRARY_SETTINGS.showDescriptions,
    showTags: value.showTags ?? DEFAULT_RESOURCES_LIBRARY_SETTINGS.showTags,
    accentColor:
      typeof value.accentColor === "string" ? value.accentColor : DEFAULT_RESOURCES_LIBRARY_SETTINGS.accentColor,
  };
}

export async function getResourcesLibrarySettings(
  userId: string,
): Promise<ResourcesLibrarySettings> {
  const row = await db.userPreferences.findUnique({
    where: { userId },
    select: { settingsJson: true },
  });
  const blob = readBlob(row?.settingsJson);
  return parseResourcesLibrarySettings(blob[SETTINGS_KEY]);
}

export async function updateResourcesLibrarySettings(
  userId: string,
  patch: Partial<ResourcesLibrarySettings>,
): Promise<ResourcesLibrarySettings> {
  const row = await db.userPreferences.findUnique({
    where: { userId },
    select: { settingsJson: true },
  });
  const blob = readBlob(row?.settingsJson);
  const current = parseResourcesLibrarySettings(blob[SETTINGS_KEY]);
  const next = { ...current, ...patch };
  const updated = { ...blob, [SETTINGS_KEY]: next };

  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, settingsJson: JSON.stringify(updated) },
    update: { settingsJson: JSON.stringify(updated) },
  });

  return next;
}
