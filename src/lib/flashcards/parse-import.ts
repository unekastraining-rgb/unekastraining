export interface ParsedFlashcardRow {
  front: string;
  back: string;
}

/** Parse Anki TSV, CSV, or Quizlet-style "term\tdefinition" exports. */
export function parseFlashcardImportText(text: string): ParsedFlashcardRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const cards: ParsedFlashcardRow[] = [];

  for (const line of lines) {
    if (/^#/.test(line) || /^tags:/i.test(line)) continue;

    let front = "";
    let back = "";

    if (line.includes("\t")) {
      const parts = line.split("\t");
      front = parts[0]?.trim() ?? "";
      back = parts.slice(1).join("\t").trim();
    } else if (line.includes(" — ")) {
      const parts = line.split(" — ");
      front = parts[0]?.trim() ?? "";
      back = parts.slice(1).join(" — ").trim();
    } else if (line.includes(",")) {
      const match = line.match(/^"([^"]*)"\s*,\s*"([^"]*)"/);
      if (match) {
        front = match[1];
        back = match[2];
      } else {
        const comma = line.indexOf(",");
        front = line.slice(0, comma).replace(/^"|"$/g, "").trim();
        back = line.slice(comma + 1).replace(/^"|"$/g, "").trim();
      }
    } else if (line.includes(";")) {
      const [a, b] = line.split(";");
      front = a?.trim() ?? "";
      back = b?.trim() ?? "";
    }

    if (front && back) {
      cards.push({ front, back });
    }
  }

  return cards.slice(0, 500);
}

export function flashcardsToCsv(cards: Array<{ front: string; back: string }>): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return ["front,back", ...cards.map((card) => `${escape(card.front)},${escape(card.back)}`)].join(
    "\n",
  );
}

export function flashcardsToAnkiTsv(cards: Array<{ front: string; back: string }>): string {
  return cards.map((card) => `${card.front}\t${card.back}`).join("\n");
}
