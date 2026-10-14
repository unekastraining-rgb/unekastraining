/**
 * PPTX text extraction for the existing material pipeline.
 * Uses JSZip (already a dependency) — no separate ingestion system.
 */

import JSZip from "jszip";

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Collect text from OOXML `<a:t>` runs. */
function extractRunsFromXml(xml: string): string[] {
  const runs: string[] = [];
  const re = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const text = decodeXmlEntities(match[1] ?? "").trim();
    if (text) runs.push(text);
  }
  return runs;
}

function slideSortKey(path: string): number {
  const m = path.match(/slide(\d+)\.xml$/i);
  return m ? Number(m[1]) : 0;
}

function notesSortKey(path: string): number {
  const m = path.match(/notesSlide(\d+)\.xml$/i);
  return m ? Number(m[1]) : 0;
}

/**
 * Extract readable slide + notes text from a PPTX buffer.
 * Throws on malformed/unreadable archives (caller decides fail-soft vs hard fail).
 */
export async function extractPptxText(buffer: Buffer): Promise<string> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error(
      "Could not read this PowerPoint file. It may be corrupted or not a valid .pptx.",
    );
  }

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => slideSortKey(a) - slideSortKey(b));

  if (slideFiles.length === 0) {
    throw new Error(
      "No slides found in this PowerPoint file. Export as .pptx and try again.",
    );
  }

  const notesBySlide = new Map<number, string>();
  const notesFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(name))
    .sort((a, b) => notesSortKey(a) - notesSortKey(b));

  for (const notesPath of notesFiles) {
    const num = notesSortKey(notesPath);
    const xml = await zip.files[notesPath]!.async("string");
    const runs = extractRunsFromXml(xml);
    if (runs.length > 0) notesBySlide.set(num, runs.join(" "));
  }

  const sections: string[] = [];
  for (const slidePath of slideFiles) {
    const num = slideSortKey(slidePath);
    const xml = await zip.files[slidePath]!.async("string");
    const runs = extractRunsFromXml(xml);
    const body = runs.join("\n").trim();
    const notes = notesBySlide.get(num)?.trim();
    const parts = [`--- slide ${num} ---`];
    if (body) parts.push(body);
    if (notes) parts.push(`Notes: ${notes}`);
    if (parts.length === 1) parts.push("(no extractable text)");
    sections.push(parts.join("\n"));
  }

  const text = sections.join("\n\n").trim();
  if (!text || sections.every((s) => s.includes("(no extractable text)"))) {
    throw new Error(
      "This PowerPoint has no readable text. Add titles or bullet text, or export again.",
    );
  }
  return text;
}

export function isPptxFile(mimeType: string, fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    lower.endsWith(".pptx")
  );
}
