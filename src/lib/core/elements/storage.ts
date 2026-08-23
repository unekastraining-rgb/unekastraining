const FAVORITES_KEY = "studyhaul:element-favorites";
const RECENT_KEY = "studyhaul:element-recent";
const MAX_RECENT = 24;

export function getElementFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function toggleElementFavorite(id: string): string[] {
  const current = getElementFavorites();
  const next = current.includes(id)
    ? current.filter((entry) => entry !== id)
    : [...current, id];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function getRecentElements(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function recordRecentElement(id: string): string[] {
  const current = getRecentElements().filter((entry) => entry !== id);
  const next = [id, ...current].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
