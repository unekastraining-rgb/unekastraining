function extractFencedJson(content: string): string | null {
  const jsonFence = content.match(/```json\s*([\s\S]*?)```/i);
  if (jsonFence?.[1]?.trim()) return jsonFence[1].trim();

  const bareFence = content.match(/```\s*([\s\S]*?)```/);
  const inner = bareFence?.[1]?.trim() ?? "";
  if (inner && /^\s*[{\[]/.test(inner)) return inner;

  return null;
}

export function extractJsonPayload(content: string): string {
  let raw = (extractFencedJson(content) ?? content).trim();

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    raw = raw.slice(start, end + 1);
  } else if (start >= 0) {
    raw = raw.slice(start);
  }

  return raw;
}

/** Best-effort repair when the model truncates mid-string or mid-object. */
export function repairTruncatedJson(raw: string): string {
  let text = raw.trimEnd();

  text = text.replace(/,\s*"[^"]*":\s*"[^"]*$/, "");
  text = text.replace(/,\s*"[^"]*":\s*$/, "");
  text = text.replace(/,\s*$/, "");

  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  if (inString) text += '"';
  while (stack.length > 0) text += stack.pop();

  return text;
}

export function parseAiJson<T>(
  content: string,
  fallbackMessage = "We couldn't read the AI response. Please try again.",
): T {
  const raw = extractJsonPayload(content);
  const candidates = [raw, repairTruncatedJson(raw)];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error && lastError.message.includes("Unterminated string")) {
    throw new Error(
      "The lesson was too long and got cut off. Please try opening the lesson again.",
    );
  }

  throw new Error(fallbackMessage);
}

/** True when an error string is source code, a JSON parse dump, or a Prisma blob. */
export function looksLikeModelDump(text: string): boolean {
  const t = text.trim();
  if (t.length > 180) return true;
  return /public class|System\.out|void main\s*\(|Unexpected token|is not valid JSON|Invalid `prisma|```(?:java|python|cpp|c\+\+)/i.test(
    t,
  );
}

export function friendlyUserFacingAiError(
  error: unknown,
  fallback = "Could not finish that. Please try again.",
): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (!raw.trim() || looksLikeModelDump(raw)) return fallback;
  return raw.trim();
}
