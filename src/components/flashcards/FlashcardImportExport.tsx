"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";

interface FlashcardImportExportProps {
  courseId: string;
  courseTitle?: string;
}

export function FlashcardImportExport({
  courseId,
  courseTitle,
}: FlashcardImportExportProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    if (!text.trim() || !courseId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/flashcards/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          text,
          deckTitle: courseTitle ? `${courseTitle} import` : undefined,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Import failed.");
      setMessage(`Imported ${data.data.imported} cards.`);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
      <p className="text-sm font-bold text-stone-900">Import / export</p>
      <p className="mt-1 text-xs text-stone-600">
        Paste Anki TSV, CSV, or Quizlet-style term — definition (one per line).
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"term\tdefinition\nor front,back"}
        rows={4}
        className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-50">
          <Upload className="h-3.5 w-3.5" />
          Import .apkg
          <input
            type="file"
            accept=".apkg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setLoading(true);
              setError(null);
              const form = new FormData();
              form.append("courseId", courseId);
              form.append("file", file);
              void fetch("/api/flashcards/import", { method: "POST", body: form })
                .then((response) => response.json())
                .then((data) => {
                  if (!data.success) throw new Error(data.error ?? "Import failed.");
                  setMessage(`Imported ${data.data.imported} cards from ${data.data.deckTitle}.`);
                })
                .catch((err) =>
                  setError(err instanceof Error ? err.message : "Import failed."),
                )
                .finally(() => setLoading(false));
            }}
          />
        </label>
        <button
          type="button"
          disabled={loading || !text.trim()}
          onClick={() => void handleImport()}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" />
          {loading ? "Importing…" : "Import deck"}
        </button>
        <a
          href={`/api/flashcards/export?format=csv&courseId=${courseId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </a>
        <a
          href={`/api/flashcards/export?format=anki&courseId=${courseId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export Anki
        </a>
      </div>
      {message ? <p className="mt-2 text-xs font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
    </section>
  );
}
