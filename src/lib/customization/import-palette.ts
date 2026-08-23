import { normalizeHex } from "./color-math";

export function parseHexList(text: string): string[] {
  const matches = text.match(/#?[0-9a-fA-F]{3,6}\b/g) ?? [];
  const colors: string[] = [];
  for (const match of matches) {
    const hex = normalizeHex(match);
    if (hex && !colors.includes(hex)) colors.push(hex);
  }
  return colors;
}

export function parsePaletteJson(text: string): { name?: string; colors: string[] } {
  const parsed = JSON.parse(text) as unknown;

  if (Array.isArray(parsed)) {
    const colors = parsed
      .map((item) => {
        if (typeof item === "string") return normalizeHex(item);
        if (item && typeof item === "object" && "color" in item) {
          return normalizeHex(String((item as { color: string }).color));
        }
        return null;
      })
      .filter((c): c is string => Boolean(c));
    return { colors };
  }

  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    const name = typeof obj.name === "string" ? obj.name : undefined;
    const rawColors = obj.colors ?? obj.palette ?? obj.swatches;
    if (Array.isArray(rawColors)) {
      const colors = rawColors
        .map((c) => (typeof c === "string" ? normalizeHex(c) : null))
        .filter((c): c is string => Boolean(c));
      return { name, colors };
    }
  }

  throw new Error("Unrecognized palette JSON format");
}
