"use client";

import { Trash2 } from "lucide-react";

/**
 * Sticky/inline bar for select-all + bulk delete on list surfaces.
 */
export function BulkSelectionBar({
  totalCount,
  selectedCount,
  allSelected,
  someSelected,
  onToggleAll,
  onClear,
  onDeleteSelected,
  deleting,
  noun = "item",
  nounPlural,
}: {
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  deleting?: boolean;
  noun?: string;
  nounPlural?: string;
}) {
  if (totalCount === 0) return null;

  const plural = nounPlural ?? `${noun}s`;
  const label =
    selectedCount === 1 ? `1 ${noun} selected` : `${selectedCount} ${plural} selected`;

  return (
    <div
      data-bulk-selection-bar
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-stone-800 touch-manipulation">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--sh-primary,#ea580c)]"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={() => onToggleAll()}
            aria-label={allSelected ? "Clear selection" : "Select all"}
          />
          Select all
        </label>
        {selectedCount > 0 ? (
          <>
            <span className="text-sm text-stone-600">{label}</span>
            <button
              type="button"
              onClick={onClear}
              className="min-h-11 text-sm font-semibold text-stone-600 underline-offset-2 hover:underline touch-manipulation"
            >
              Clear
            </button>
          </>
        ) : (
          <span className="text-sm text-stone-500">
            Select one or more {plural} to delete
          </span>
        )}
      </div>

      {selectedCount > 0 ? (
        <button
          type="button"
          data-bulk-delete
          disabled={deleting}
          onClick={onDeleteSelected}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 touch-manipulation"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {deleting
            ? "Deleting…"
            : `Delete ${selectedCount === 1 ? noun : `${selectedCount} ${plural}`}`}
        </button>
      ) : null}
    </div>
  );
}
