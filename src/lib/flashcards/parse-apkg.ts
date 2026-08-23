import JSZip from "jszip";
import initSqlJs from "sql.js";

export interface ParsedApkgCard {
  front: string;
  back: string;
}

/** Parse Anki .apkg (collection.anki2 SQLite inside a zip). */
export async function parseApkgBuffer(buffer: ArrayBuffer): Promise<{
  deckName: string;
  cards: ParsedApkgCard[];
}> {
  const zip = await JSZip.loadAsync(buffer);
  const collectionFile =
    zip.file("collection.anki2") ?? zip.file("collection.anki21");
  if (!collectionFile) {
    throw new Error("Invalid .apkg — missing collection database.");
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });

  const dbBytes = await collectionFile.async("uint8array");
  const db = new SQL.Database(dbBytes);

  let deckName = "Imported deck";
  try {
    const decksRow = db.exec("SELECT decks FROM col LIMIT 1");
    if (decksRow[0]?.values[0]?.[0]) {
      const decksJson = JSON.parse(String(decksRow[0].values[0][0])) as Record<
        string,
        { name?: string }
      >;
      const firstDeck = Object.values(decksJson).find((deck) => deck.name);
      if (firstDeck?.name) deckName = firstDeck.name;
    }
  } catch {
    // ignore deck name parse errors
  }

  const notesResult = db.exec("SELECT flds FROM notes LIMIT 500");
  const cards: ParsedApkgCard[] = [];

  if (notesResult[0]) {
    for (const row of notesResult[0].values) {
      const fields = String(row[0] ?? "").split("\x1f");
      const front = stripHtml(fields[0] ?? "").trim();
      const back = stripHtml(fields[1] ?? fields[0] ?? "").trim();
      if (front && back && front !== back) {
        cards.push({ front, back });
      } else if (front) {
        cards.push({ front, back: back || front });
      }
    }
  }

  db.close();

  if (cards.length === 0) {
    throw new Error("No cards found in this .apkg file.");
  }

  return { deckName, cards: cards.slice(0, 500) };
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
