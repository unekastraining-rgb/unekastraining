"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileImage, Trash2, Upload } from "lucide-react";

import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import {
  templatesByKind,
  type PageTemplateKind,
} from "@/lib/core/page-templates";
import { confirmDelete, confirmDeleteMany } from "@/lib/confirm-delete";
import type { MediaAssetRecord } from "@/lib/customization/types";
import { useSelectableIds } from "@/lib/selection/use-selectable-ids";

type Section = "paper" | "layouts" | "imported";

export function TemplateLibrary({
  onSelectBuiltin,
  onSelectImported,
  selectedBuiltinId,
  selectedImportedId,
  compact = false,
}: {
  onSelectBuiltin?: (templateId: string) => void;
  onSelectImported?: (assetId: string) => void;
  selectedBuiltinId?: string;
  selectedImportedId?: string;
  /** Tighter grid for side panels */
  compact?: boolean;
}) {
  const [section, setSection] = useState<Section>("paper");
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const assetIds = useMemo(() => assets.map((a) => a.id), [assets]);
  const assetSelection = useSelectableIds(assetIds);

  const loadAssets = useCallback(async () => {
    const res = await fetch("/api/customization/templates?kind=template");
    if (res.ok) {
      setAssets((await res.json()) as MediaAssetRecord[]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    assetSelection.pruneTo(assetIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetIds.join("|")]);

  async function uploadTemplate(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.[^.]+$/, ""));
      form.append("kind", "template");
      const res = await fetch("/api/customization/templates", { method: "POST", body: form });
      if (res.ok) await loadAssets();
    } finally {
      setUploading(false);
    }
  }

  async function deleteAsset(id: string) {
    const asset = assets.find((a) => a.id === id);
    if (!confirmDelete(asset?.name ?? "template")) return;
    await fetch(`/api/customization/templates/${id}`, { method: "DELETE" });
    await loadAssets();
  }

  async function deleteSelectedAssets() {
    const ids = assetSelection.selectedIds;
    if (ids.length === 0) return;
    if (!confirmDeleteMany(ids.length, { noun: "template" })) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/customization/templates/${id}`, { method: "DELETE" }),
        ),
      );
      assetSelection.clear();
      await loadAssets();
    } finally {
      setBulkDeleting(false);
    }
  }

  const sections: { id: Section; label: string; hint: string }[] = [
    { id: "paper", label: "Paper", hint: "Blank, lines, dots, grid" },
    { id: "layouts", label: "Layouts", hint: "Cornell, columns, planners" },
    { id: "imported", label: "My imports", hint: "Your uploaded backgrounds" },
  ];

  const kind: PageTemplateKind = section === "layouts" ? "layout" : "paper";
  const builtin = section === "imported" ? [] : templatesByKind(kind);

  const cols = compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";
  const sheetAspect = compact ? "aspect-[3/4]" : "aspect-[8.5/11]";
  const touchChip = compact ? " min-h-11 touch-manipulation" : "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            title={s.hint}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold${touchChip} ${
              section === s.id ? "bg-stone-900 text-white" : "bg-orange-50 text-stone-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-stone-500">
        {sections.find((s) => s.id === section)?.hint}
      </p>

      {section === "imported" ? (
        <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs font-semibold text-stone-600 hover:bg-stone-100${touchChip}`}>
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Import PNG, JPG, or PDF paper"}
          <input
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadTemplate(file);
            }}
          />
        </label>
      ) : null}

      {section !== "imported" ? (
        <div className={`grid gap-3 ${cols}`}>
          {builtin.map((template) => {
            const selected =
              !selectedImportedId && selectedBuiltinId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelectBuiltin?.(template.id)}
                className={`group rounded-2xl border p-2 text-left transition touch-manipulation${touchChip} ${
                  selected
                    ? "border-stone-900 ring-2 ring-stone-900"
                    : "border-orange-100 bg-white hover:border-orange-200 hover:shadow-md"
                }`}
              >
                <div className="relative mx-auto w-full max-w-[9rem] overflow-hidden rounded-md shadow-md ring-1 ring-stone-300/50">
                  <div
                    className={`w-full ${sheetAspect} ${template.paperClass}`}
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/5 to-transparent" />
                </div>
                <p className="mt-2 text-xs font-bold text-stone-900">{template.label}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-stone-500">
                  {template.description}
                </p>
                {template.kind === "paper" ? (
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-teal-700/80">
                    Paper
                  </p>
                ) : (
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-amber-700/80">
                    Layout
                  </p>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {assets.length === 0 ? (
            <p className="text-xs text-stone-400">
              No imports yet — bring your own paper/templates here.
            </p>
          ) : (
            <>
              <BulkSelectionBar
                totalCount={assets.length}
                selectedCount={assetSelection.selectedCount}
                allSelected={assetSelection.allSelected}
                someSelected={assetSelection.someSelected}
                onToggleAll={assetSelection.toggleAll}
                onClear={assetSelection.clear}
                onDeleteSelected={() => void deleteSelectedAssets()}
                deleting={bulkDeleting}
                noun="template"
              />
              <div className={`grid gap-3 ${cols}`}>
                {assets.map((asset) => {
                  const selected = selectedImportedId === asset.id;
                  const checked = assetSelection.isSelected(asset.id);
                  return (
                    <div
                      key={asset.id}
                      className={`rounded-2xl border p-2 ${
                        checked
                          ? "border-rose-300 ring-2 ring-rose-200"
                          : selected
                            ? "border-stone-900 ring-2 ring-stone-900"
                            : "border-orange-100 bg-white"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-[var(--sh-primary,#ea580c)]"
                          checked={checked}
                          onChange={() => assetSelection.toggle(asset.id)}
                          aria-label={`Select ${asset.name}`}
                        />
                        <span className="text-[10px] text-stone-500">Select</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectImported?.(asset.id)}
                        className={`w-full text-left${touchChip}`}
                      >
                        {asset.mimeType.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/customization/templates/${asset.id}`}
                            alt={asset.name}
                            className={`mx-auto mb-2 w-full max-w-[9rem] rounded-md object-cover shadow-md ring-1 ring-stone-300/50 ${sheetAspect}`}
                          />
                        ) : (
                          <div
                            className={`mx-auto mb-2 flex w-full max-w-[9rem] items-center justify-center rounded-md bg-red-50 text-red-500 shadow-md ${sheetAspect}`}
                          >
                            <FileImage className="h-6 w-6" />
                          </div>
                        )}
                        <p className="truncate text-xs font-bold text-stone-900">{asset.name}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteAsset(asset.id)}
                        className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500 hover:text-rose-700${touchChip}`}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
