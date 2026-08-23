"use client";

export type MaterialOpenMode = "popup" | "core";

export interface MaterialPreviewPayload {
  id: string;
  title: string;
  type: string;
  courseId: string;
  courseTitle: string;
  url: string | null;
  hasFile: boolean;
  previewText: string;
}

const PREFERENCE_KEY = "studyhaul-material-open-preference";

export function getMaterialOpenPreference(): MaterialOpenMode {
  if (typeof window === "undefined") return "popup";
  const stored = window.localStorage.getItem(PREFERENCE_KEY);
  return stored === "core" ? "core" : "popup";
}

export function setMaterialOpenPreference(mode: MaterialOpenMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFERENCE_KEY, mode);
}

export async function fetchMaterialPreview(
  materialId: string,
): Promise<MaterialPreviewPayload> {
  const response = await fetch(`/api/materials/${materialId}/open`);
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error ?? "Could not load material.");
  }
  return data.material as MaterialPreviewPayload;
}

export async function openMaterialInCore(
  materialId: string,
): Promise<{ coreHref: string; noteId: string; created: boolean }> {
  const response = await fetch(`/api/materials/${materialId}/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "core" }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error ?? "Could not open workbook.");
  }
  return {
    coreHref: data.coreHref as string,
    noteId: data.noteId as string,
    created: Boolean(data.created),
  };
}

export async function openMaterialPreview(
  materialId: string,
): Promise<MaterialPreviewPayload> {
  const response = await fetch(`/api/materials/${materialId}/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "preview" }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error ?? "Could not load material.");
  }
  return data.material as MaterialPreviewPayload;
}
