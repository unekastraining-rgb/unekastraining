"use client";

import Link from "next/link";
import { useState } from "react";
import { FilePlus2, Trash2 } from "lucide-react";

import type { MultiFileProjectMeta } from "@/lib/learning/artifact-persistence";

/**
 * Lightweight project file navigator — does not replace CORE note rail.
 * Each file opens as a normal CORE note (?noteId=).
 */
export function ProjectFileNavigator({
  projectId,
  meta,
  updatedAt,
  onMetaChange,
}: {
  projectId: string;
  meta: MultiFileProjectMeta;
  updatedAt: string | null;
  onMetaChange?: (next: {
    meta: MultiFileProjectMeta;
    updatedAt: string;
  }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  async function addFile() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "add-file",
          projectId,
          fileTitle: newTitle.trim() || `File ${meta.files.length + 1}`,
          expectedUpdatedAt: updatedAt,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { meta: MultiFileProjectMeta; updatedAt: string; fileNoteId: string };
      };
      if (!res.ok || !data.success || !data.data) {
        setError(data.error ?? "Could not add file.");
        return;
      }
      setNewTitle("");
      onMetaChange?.({ meta: data.data.meta, updatedAt: data.data.updatedAt });
    } catch {
      setError("Could not add file.");
    } finally {
      setBusy(false);
    }
  }

  async function removeFile(fileNoteId: string, title: string) {
    if (busy) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remove “${title}” from this project?`)
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "remove-file",
          projectId,
          fileNoteId,
          expectedUpdatedAt: updatedAt,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { meta: MultiFileProjectMeta; updatedAt: string };
      };
      if (!res.ok || !data.success || !data.data) {
        setError(data.error ?? "Could not remove file.");
        return;
      }
      onMetaChange?.({ meta: data.data.meta, updatedAt: data.data.updatedAt });
    } catch {
      setError("Could not remove file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      data-project-file-navigator
      data-artifact-persistence
      className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
        Project files
      </p>
      <p className="mt-0.5 text-[11px] text-stone-500">
        Each file is its own notebook — saving one never overwrites another.
      </p>
      <ul className="mt-3 space-y-1.5">
        {meta.files.map((file) => (
          <li
            key={file.noteId}
            className="flex items-center justify-between gap-2 rounded-xl border border-stone-100 px-2.5 py-1.5"
          >
            <Link
              href={`/core?noteId=${encodeURIComponent(file.noteId)}`}
              className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800 hover:text-teal-800"
            >
              {file.title}
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => void removeFile(file.noteId, file.title)}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 touch-manipulation"
              aria-label={`Remove ${file.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </li>
        ))}
        {meta.files.length === 0 ? (
          <li className="text-xs text-stone-500">No files yet.</li>
        ) : null}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New file title"
          className="min-h-11 flex-1 rounded-xl border border-stone-200 px-3 text-sm"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void addFile()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 touch-manipulation"
        >
          <FilePlus2 className="h-3.5 w-3.5" aria-hidden />
          Add
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
