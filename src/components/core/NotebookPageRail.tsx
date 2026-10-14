"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";

import { useTapHandler } from "@/hooks/useTapHandler";
import type { NotebookPagesContainer } from "@/lib/core/note-types";
import type { PageLayoutMode } from "@/lib/core/notebook-page-layout";

function displayPageName(label: string | undefined, pageNumber: number) {
  const trimmed = label?.trim();
  if (!trimmed || /^Page \d+$/i.test(trimmed)) return `Page ${pageNumber}`;
  return trimmed;
}

function RailTapButton({
  onActivate,
  className,
  title,
  children,
  onDoubleClick,
  "aria-label": ariaLabel,
}: {
  onActivate: () => void;
  className: string;
  title?: string;
  children: ReactNode;
  onDoubleClick?: (e: MouseEvent) => void;
  "aria-label"?: string;
}) {
  const tap = useTapHandler(onActivate);
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      data-core-chrome-action="1"
      {...tap}
      onDoubleClick={onDoubleClick}
      className={className}
      style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
    >
      {children}
    </button>
  );
}

export function NotebookPageRail({
  pages,
  activePageId,
  viewingCover = false,
  pageLabel,
  onSelect,
  onShowCover,
  onAdd,
  onAddBeside,
  onDuplicate,
  onRename,
  onDelete,
}: {
  pages: NotebookPagesContainer["pages"];
  activePageId: string;
  viewingCover?: boolean;
  layoutMode?: PageLayoutMode;
  pageLabel?: string;
  onSelect: (pageId: string) => void;
  onShowCover?: () => void;
  onAdd: () => void;
  onAddBeside?: () => void;
  onDuplicate: (pageId: string) => void;
  onRename: (pageId: string, label: string) => void;
  onDelete: (pageId: string) => void;
}) {
  const canDelete = pages.length > 1;
  const activeIndex = Math.max(
    0,
    pages.findIndex((page) => page.id === activePageId),
  );
  const indicator =
    pageLabel ?? `${activeIndex + 1}/${Math.max(1, pages.length)}`;
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div
      data-hub-chrome
      data-notebook-page-rail
      className="relative z-[60] flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-orange-200/80 bg-[#fff8f1] px-2 py-1.5 shadow-[0_-4px_12px_rgba(28,25,23,0.06)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <span className="shrink-0 rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-white">
        {indicator}
      </span>
      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-stone-400">
        Pages
      </span>
      {onShowCover ? (
        <RailTapButton
          onActivate={onShowCover}
          className={`flex h-9 min-w-[3rem] shrink-0 flex-col items-center justify-center rounded-lg border px-2 text-center transition ${
            viewingCover
              ? "border-stone-900 bg-stone-900 text-white shadow-sm"
              : "border-stone-300 bg-gradient-to-br from-orange-100 to-amber-50 hover:border-orange-300"
          }`}
          title="Notebook cover"
        >
          <span className="text-[9px] font-bold opacity-70">Cover</span>
          <span className="text-[9px] font-semibold">◆</span>
        </RailTapButton>
      ) : null}
      {pages.map((page) => {
        const active = !viewingCover && page.id === activePageId;
        const editing = editingId === page.id;
        return (
          <div key={page.id} className="group flex shrink-0 items-center gap-0.5">
            {editing ? (
              <input
                autoFocus
                defaultValue={displayPageName(page.label, page.pageNumber)}
                onBlur={(e) => {
                  onRename(page.id, e.target.value.trim());
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="h-9 w-28 rounded-lg border border-orange-400 bg-white px-2 text-[10px] font-semibold text-stone-800 outline-none ring-2 ring-orange-200"
                title="Name this page"
                aria-label={`Rename page ${page.pageNumber}`}
              />
            ) : (
              <RailTapButton
                onActivate={() => onSelect(page.id)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  setEditingId(page.id);
                }}
                className={`flex h-9 min-w-[3.25rem] max-w-[7rem] flex-col items-center justify-center rounded-lg border px-1.5 text-center transition ${
                  active
                    ? "border-orange-500 bg-white shadow-sm ring-2 ring-orange-200"
                    : "border-stone-200 bg-white/80 hover:border-orange-200"
                }`}
                title={`${displayPageName(page.label, page.pageNumber)} — double-click to rename`}
              >
                <span className="text-[9px] font-bold text-stone-400">
                  {page.pageNumber}
                </span>
                <span className="w-full truncate text-[9px] font-semibold text-stone-700">
                  {displayPageName(page.label, page.pageNumber)}
                </span>
              </RailTapButton>
            )}
            <RailTapButton
              onActivate={() => setEditingId(page.id)}
              className="rounded p-1 text-[9px] font-bold text-stone-400 opacity-100 hover:bg-white hover:text-stone-700 sm:opacity-0 sm:group-hover:opacity-100"
              title="Rename page"
            >
              Aa
            </RailTapButton>
            <RailTapButton
              onActivate={() => onDuplicate(page.id)}
              className="rounded p-1 text-stone-400 opacity-100 hover:bg-white hover:text-stone-600 sm:opacity-0 sm:group-hover:opacity-100"
              title="Duplicate page"
            >
              <Copy className="h-3 w-3" />
            </RailTapButton>
            {canDelete ? (
              <RailTapButton
                onActivate={() => onDelete(page.id)}
                className="rounded p-1 text-stone-400 opacity-100 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                title="Delete page"
              >
                <Trash2 className="h-3 w-3" />
              </RailTapButton>
            ) : null}
          </div>
        );
      })}
      <RailTapButton
        onActivate={onAdd}
        title="Add a page below"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-orange-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-orange-700 touch-manipulation hover:bg-orange-50"
      >
        <Plus className="h-3 w-3" /> Page ↓
      </RailTapButton>
      {onAddBeside ? (
        <RailTapButton
          onActivate={onAddBeside}
          title="Add a facing page"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-teal-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-teal-800 touch-manipulation hover:bg-teal-50"
        >
          <Plus className="h-3 w-3" /> Page →
        </RailTapButton>
      ) : null}
    </div>
  );
}
