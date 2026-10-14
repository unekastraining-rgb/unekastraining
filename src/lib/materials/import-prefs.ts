export type MaterialImportMode = "raw" | "ai";
export type MaterialImportDestination = "new-workbook" | "new-page" | "current";

export interface MaterialImportPrefs {
  mode: MaterialImportMode;
  destination: MaterialImportDestination;
  remember: boolean;
}

const PREFS_KEY = "studyhaul-material-import-prefs";

export function getMaterialImportPrefs(): MaterialImportPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MaterialImportPrefs>;
    if (parsed.mode !== "raw" && parsed.mode !== "ai") return null;
    if (
      parsed.destination !== "new-workbook" &&
      parsed.destination !== "new-page" &&
      parsed.destination !== "current"
    ) {
      return null;
    }
    return {
      mode: parsed.mode,
      destination: parsed.destination,
      remember: Boolean(parsed.remember),
    };
  } catch {
    return null;
  }
}

export function setMaterialImportPrefs(prefs: MaterialImportPrefs) {
  if (typeof window === "undefined") return;
  if (!prefs.remember) {
    window.localStorage.removeItem(PREFS_KEY);
    return;
  }
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
