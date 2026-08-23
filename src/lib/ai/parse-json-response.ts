export function extractJsonPayload(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  let raw = (fenced?.[1] ?? content).trim();

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
