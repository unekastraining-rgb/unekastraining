"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";

import { resolveNotebookCoverStyle } from "@/lib/core/page-templates";
import type { NoteDocument } from "@/lib/core/note-types";

interface ShelfNote {
  id: string;
  title: string;
  method: string;
  updatedAt: string;
  contentJson: string | null;
  course?: { title: string; color: string | null } | null;
}

export function NotebookShelfView() {
  const [notes, setNotes] = useState<ShelfNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (data.success) setNotes(data.data);
      setLoading(false);
    })();
  }, []);

  function parseNotebook(contentJson: string | null) {
    if (!contentJson) return {};
    try {
      const doc = JSON.parse(contentJson) as NoteDocument;
      return doc.notebook ?? {};
    } catch {
      return {};
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Core</p>
          <h1 className="text-3xl font-bold text-stone-900">Notebook shelf</h1>
          <p className="mt-1 text-sm text-stone-600">
            All your notebooks in one place — open any page to keep writing.
          </p>
        </div>
        <Link
          href="/core"
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          New notebook
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-stone-500">Loading shelf...</p>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-orange-300" />
          <p className="mt-3 font-semibold text-stone-800">No notebooks yet</p>
          <p className="mt-1 text-sm text-stone-500">Create your first notebook from Core Notes.</p>
          <Link href="/core" className="mt-4 inline-block text-sm font-semibold text-teal-600">
            Go to Core Notes →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {notes.map((note) => {
            const notebook = parseNotebook(note.contentJson);
            const cover = resolveNotebookCoverStyle(notebook);
            return (
              <Link
                key={note.id}
                href={`/core?noteId=${note.id}`}
                className="group rounded-2xl border border-orange-100 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={`aspect-[3/4] rounded-xl ${cover.className ?? ""}`}
                  style={cover.style}
                />
                <p className="mt-2 truncate text-sm font-semibold text-stone-900 group-hover:text-teal-700">
                  {note.title}
                </p>
                <p className="truncate text-[10px] text-stone-400">
                  {note.course?.title ?? "No course"} ·{" "}
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
