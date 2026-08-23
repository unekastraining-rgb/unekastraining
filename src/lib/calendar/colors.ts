export const EVENT_COLOR_PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#ea580c",
  "#0ea5e9",
  "#a855f7",
  "#84cc16",
  "#f43f5e",
] as const;

export const DEFAULT_EVENT_COLOR = "#ea580c";

export function resolveItemColor(
  eventColor: string | null | undefined,
  courseColor: string | null | undefined,
): string {
  return eventColor ?? courseColor ?? DEFAULT_EVENT_COLOR;
}

export function colorWithAlpha(hex: string, alpha = 0.15): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `${hex}26`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
