/** Last ink OCR snapshot stored on Core note JSON — indexed by Hub global search. */
export function extractInkOcrFromNoteJson(
  contentJson: string | null | undefined,
): string {
  try {
    const parsed = JSON.parse(contentJson ?? "{}") as {
      metadata?: { lastInkOcr?: { text?: string } };
    };
    return parsed.metadata?.lastInkOcr?.text ?? "";
  } catch {
    return "";
  }
}

function includesQuery(haystack: string | null | undefined, query: string) {
  return (haystack ?? "").toLowerCase().includes(query);
}

/** Match a Core note against Hub search, including persisted handwriting OCR. */
export function noteMatchesSearchQuery(
  note: {
    title: string | null;
    content: string;
    contentJson?: string | null;
  },
  rawQuery: string,
): { matches: boolean; fromHandwriting: boolean } {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) {
    return { matches: false, fromHandwriting: false };
  }

  const body = `${note.content} ${note.contentJson ?? ""}`;
  const inkText = extractInkOcrFromNoteJson(note.contentJson);
  const titleMatch = includesQuery(note.title, query);
  const bodyMatch = includesQuery(body, query);
  const inkMatch = includesQuery(inkText, query);
  const fromHandwriting =
    Boolean(inkText) && inkMatch && !titleMatch;

  return {
    matches: titleMatch || bodyMatch || inkMatch,
    fromHandwriting,
  };
}
