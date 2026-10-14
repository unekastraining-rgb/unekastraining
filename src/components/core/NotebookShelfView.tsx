"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";

import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { SelectCheckbox } from "@/components/ui/SelectCheckbox";
import { PAGE_TEMPLATES, resolveNotebookCoverStyle } from "@/lib/core/page-templates";
import type { NoteDocument } from "@/lib/core/note-types";
import { confirmDeleteMany } from "@/lib/confirm-delete";
import { useSelectableIds } from "@/lib/selection/use-selectable-ids";

export interface ShelfNote {
  id: string;
  title: string | null;
  method: string;
  updatedAt: string;
  contentJson: string | null;
  course?: { id: string; title: string; color: string | null } | null;
}

function parseNotebook(contentJson: string | null) {
  if (!contentJson) return {} as NonNullable<NoteDocument["notebook"]>;
  try {
    const doc = JSON.parse(contentJson) as NoteDocument;
    return doc.notebook ?? {};
  } catch {
    return {};
  }
}

/**
 * Shelf UI — open uses native GET forms so iPad Safari always navigates.
 * Delete uses the shared select-all / select-one / bulk-delete pattern.
 */
export function NotebookShelfView({ initialNotes }: { initialNotes: ShelfNote[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const ids = useMemo(() => notes.map((n) => n.id), [notes]);
  const selection = useSelectableIds(ids);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    selection.pruneTo(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);

  async function deleteSelected() {
    const selected = selection.selectedIds;
    if (selected.length === 0) return;
    if (
      !confirmDeleteMany(selected.length, {
        noun: "notebook",
        detail: "covers, pages, and writing in these notebooks will be removed",
      })
    ) {
      return;
    }
    setBulkDeleting(true);
    try {
      const response = await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Could not delete notebooks.");
      }
      setNotes((prev) => prev.filter((n) => !selected.includes(n.id)));
      selection.clear();
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete notebooks.");
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <a
          href="/core"
          className="inline-flex min-h-11 items-center rounded-xl border border-brand bg-brand-soft px-4 py-2.5 text-sm font-semibold text-stone-800 touch-manipulation"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          ← Back to notebook
        </a>
      </div>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Core</p>
          <h1 className="text-3xl font-bold text-stone-900">Notebook shelf</h1>
          <p className="mt-1 text-sm text-stone-600">
            Covers and paper you picked — open any notebook and keep writing.
          </p>
        </div>
        <Link
          href="/core/go/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <Plus className="h-4 w-4" />
          New notebook
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-orange-300" />
          <p className="mt-3 font-semibold text-stone-800">No notebooks yet</p>
          <p className="mt-1 text-sm text-stone-500">
            Create one with a cover + paper template from Core, or{" "}
            <Link href="/courses" className="font-semibold text-teal-700 hover:underline">
              upload a syllabus
            </Link>{" "}
            for a cold-start study pack.
          </p>
          <Link
            href="/core"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-teal-600 touch-manipulation"
          >
            Go to Core Notes →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <BulkSelectionBar
            totalCount={notes.length}
            selectedCount={selection.selectedCount}
            allSelected={selection.allSelected}
            someSelected={selection.someSelected}
            onToggleAll={selection.toggleAll}
            onClear={selection.clear}
            onDeleteSelected={() => void deleteSelected()}
            deleting={bulkDeleting}
            noun="notebook"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {notes.map((note) => {
              const notebook = parseNotebook(note.contentJson);
              const cover = resolveNotebookCoverStyle(notebook);
              const paperLabel =
                PAGE_TEMPLATES.find((t) => t.id === notebook.pageTemplateId)?.label ?? "Paper";
              const title = note.title?.trim() || "Untitled";
              const selected = selection.isSelected(note.id);
              return (
                <div
                  key={note.id}
                  className={`relative ${
                    selected ? "ring-2 ring-[var(--sh-primary,#ea580c)] ring-offset-2 rounded-2xl" : ""
                  }`}
                  data-shelf-note-id={note.id}
                >
                  <div className="absolute left-1 top-1 z-10">
                    <SelectCheckbox
                      checked={selected}
                      onChange={() => selection.toggle(note.id)}
                      label={`Select ${title}`}
                      className="rounded-lg bg-white/90 shadow-sm"
                    />
                  </div>
                  <form action="/core" method="get" className="m-0">
                    <input type="hidden" name="noteId" value={note.id} />
                    <button
                      type="submit"
                      className="group w-full rounded-2xl border border-orange-100 bg-white p-2 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg touch-manipulation"
                      style={{
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                      }}
                    >
                      <div
                        className={`pointer-events-none relative aspect-[3/4] overflow-hidden rounded-xl ${cover.className ?? ""}`}
                        style={cover.style}
                      >
                        <div className="absolute inset-y-0 left-0 w-2 bg-black/15" />
                        <div
                          data-notebook-binding
                          className="absolute inset-y-3 left-1 w-3 opacity-80"
                          aria-hidden
                        />
                        <div className="absolute inset-0 flex flex-col justify-end p-3">
                          <p
                            className={`line-clamp-3 text-sm font-black leading-snug ${cover.titleClassName}`}
                          >
                            {title}
                          </p>
                          <p
                            className={`mt-1 text-[10px] font-semibold ${cover.titleClassName} opacity-75`}
                          >
                            {paperLabel}
                          </p>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-3 bg-white/90 shadow-inner" />
                      </div>
                      <p className="pointer-events-none mt-2 truncate text-sm font-semibold text-stone-900 group-hover:text-teal-700">
                        {title}
                      </p>
                      <p className="pointer-events-none truncate text-[10px] text-stone-400">
                        {note.course?.title ?? "No course"} ·{" "}
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
