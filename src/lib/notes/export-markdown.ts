import type { NoteDocument } from "@/lib/core/note-types";

export function noteDocumentToMarkdown(
  title: string,
  method: string,
  doc: NoteDocument,
  plainContent?: string,
): string {
  const lines: string[] = [`# ${title}`, "", `*Method: ${method}*`, ""];

  if (plainContent?.trim()) {
    lines.push(plainContent.trim(), "");
  }

  if (doc.typed?.trim()) {
    lines.push(doc.typed.trim(), "");
  }

  if (doc.cornell) {
    lines.push("## Cornell notes", "", doc.cornell.notes, "", "### Cues", "", doc.cornell.cues, "");
    if (doc.cornell.summary) {
      lines.push("### Summary", "", doc.cornell.summary, "");
    }
  }

  if (doc.qa?.pairs?.length) {
    lines.push("## Q&A", "");
    for (const pair of doc.qa.pairs) {
      if (!pair.question && !pair.answer) continue;
      lines.push(`**Q:** ${pair.question}`, "", `**A:** ${pair.answer}`, "");
    }
  }

  if (doc.outline?.length) {
    lines.push("## Outline", "");
    for (const item of doc.outline) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}
