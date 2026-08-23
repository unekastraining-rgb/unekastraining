"use client";

import { Copy, Plus, Trash2 } from "lucide-react";

import type { NotebookPagesContainer } from "@/lib/core/note-types";

export function NotebookPageRail({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onDuplicate,
  onRename,
  onDelete,
}: {
  pages: NotebookPagesContainer["pages"];
  activePageId: string;
  onSelect: (pageId: string) => void;
  onAdd: () => void;
  onDuplicate: (pageId: string) => void;
  onRename: (pageId: string, label: string) => void;
  onDelete: (pageId: string) => void;
}) {
  const canDelete = pages.length > 1;

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-t border-orange-100 bg-[#fff8f1] px-3 py-2">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-stone-400">
        Sheets
      </span>
      {pages.map((page) => {
        const active = page.id === activePageId;
        return (
          <div key={page.id} className="group flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(page.id)}
              className={`flex h-10 min-w-[3rem] flex-col items-center justify-center rounded-xl border px-2 text-center transition ${
                active
                  ? "border-orange-500 bg-white shadow-sm ring-2 ring-orange-200"
                  : "border-stone-200 bg-white/80 hover:border-orange-200"
              }`}
              title={page.label ?? `Page ${page.pageNumber}`}
            >
              <span className="text-[10px] font-bold text-stone-400">{page.pageNumber}</span>
              <span className="max-w-[4rem] truncate text-[9px] font-semibold text-stone-700">
                {page.label?.replace(/^Page \d+$/, "") || "•"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(page.id)}
              className="rounded p-1 text-stone-400 opacity-0 hover:bg-white hover:text-stone-600 group-hover:opacity-100"
              title="Duplicate page"
            >
              <Copy className="h-3 w-3" />
            </button>
            {canDelete ? (
              <button
                type="button"
                onClick={() => onDelete(page.id)}
                className="rounded p-1 text-stone-400 opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                title="Delete page"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-dashed border-orange-300 bg-white px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
      >
        <Plus className="h-3.5 w-3.5" /> Add page
      </button>
      {pages.find((p) => p.id === activePageId) ? (
        <input
          key={activePageId}
          defaultValue={pages.find((p) => p.id === activePageId)?.label ?? ""}
          onBlur={(e) => onRename(activePageId, e.target.value)}
          placeholder="Label page…"
          className="ml-auto w-32 shrink-0 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[10px]"
        />
      ) : null}
      {!canDelete ? (
        <span className="ml-2 shrink-0 text-[9px] text-stone-400">Hover a sheet to delete</span>
      ) : null}
    </div>
  );
}
