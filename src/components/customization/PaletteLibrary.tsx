"use client";

import { useEffect, useMemo, useState } from "react";

import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import {
  BUILTIN_PALETTES,
  PALETTE_CATEGORIES,
} from "@/lib/customization/built-in-palettes";
import { extractColorsFromImage } from "@/lib/customization/extract-palette";
import { parseHexList, parsePaletteJson } from "@/lib/customization/import-palette";
import { applyStudyHaulPaletteGlobally, paletteToThemePatch } from "@/lib/customization/apply-palette";
import { PaletteCardGrid } from "@/components/customization/PaletteCardGrid";
import { useCustomization } from "@/components/customization/CustomizationProvider";
import { ColorPicker } from "@/components/customization/ColorPicker";
import { confirmDeleteMany } from "@/lib/confirm-delete";
import { useSelectableIds } from "@/lib/selection/use-selectable-ids";
import { useThemeOptional } from "@/lib/theme/ThemeProvider";

export function PaletteLibrary({
  onSelectColor,
  onSelectPalette,
  selectedColor,
  applyGlobally = false,
}: {
  onSelectColor?: (color: string) => void;
  onSelectPalette?: (colors: string[]) => void;
  selectedColor?: string;
  applyGlobally?: boolean;
}) {
  const { state, savePalette, deletePalette, toggleFavoritePalette } = useCustomization();
  const theme = useThemeOptional();
  const [categoryId, setCategoryId] = useState(PALETTE_CATEGORIES[0]?.id ?? "");
  const [importText, setImportText] = useState("");
  const [newPaletteName, setNewPaletteName] = useState("My palette");
  const [editingColors, setEditingColors] = useState<string[]>(["#6366f1"]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const userPaletteIds = useMemo(
    () => state.userPalettes.map((p) => p.id),
    [state.userPalettes],
  );
  const paletteSelection = useSelectableIds(userPaletteIds);

  useEffect(() => {
    paletteSelection.pruneTo(userPaletteIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPaletteIds.join("|")]);

  const categoryPalettes = useMemo(
    () => BUILTIN_PALETTES.filter((p) => p.categoryId === categoryId),
    [categoryId],
  );

  async function importFromText() {
    try {
      let name = newPaletteName;
      let colors: string[];
      if (importText.trim().startsWith("{") || importText.trim().startsWith("[")) {
        const parsed = parsePaletteJson(importText);
        colors = parsed.colors;
        if (parsed.name) name = parsed.name;
      } else {
        colors = parseHexList(importText);
      }
      if (colors.length === 0) return;
      await savePalette({ name, colors });
      setImportText("");
    } catch {
      // ignore parse errors in UI
    }
  }

  async function importFromImage(file: File) {
    const colors = await extractColorsFromImage(file);
    if (colors.length === 0) return;
    await savePalette({ name: file.name.replace(/\.[^.]+$/, ""), colors });
  }

  async function handlePaletteSelect(colors: string[]) {
    onSelectColor?.(colors[0] ?? "");
    onSelectPalette?.(colors);
    if (!applyGlobally) return;
    if (theme) {
      await theme.updateSettings(paletteToThemePatch(colors));
    } else {
      await applyStudyHaulPaletteGlobally(colors);
    }
  }

  async function deleteSelectedPalettes() {
    const ids = paletteSelection.selectedIds;
    if (ids.length === 0) return;
    if (!confirmDeleteMany(ids.length, { noun: "palette" })) return;
    setBulkDeleting(true);
    try {
      for (const id of ids) {
        await deletePalette(id);
      }
      paletteSelection.clear();
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Built-in palettes
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {PALETTE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                categoryId === cat.id
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="mt-3 max-h-96 overflow-y-auto">
          <PaletteCardGrid
            palettes={categoryPalettes}
            favoriteIds={state.favoritePaletteIds}
            onSelectPalette={(colors) => void handlePaletteSelect(colors)}
            onFavorite={(id) => void toggleFavoritePalette(id)}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">My palettes</p>
        {state.userPalettes.length > 0 ? (
          <div className="mt-2 space-y-2">
            <BulkSelectionBar
              totalCount={state.userPalettes.length}
              selectedCount={paletteSelection.selectedCount}
              allSelected={paletteSelection.allSelected}
              someSelected={paletteSelection.someSelected}
              onToggleAll={paletteSelection.toggleAll}
              onClear={paletteSelection.clear}
              onDeleteSelected={() => void deleteSelectedPalettes()}
              deleting={bulkDeleting}
              noun="palette"
            />
            <div className="space-y-2">
              {state.userPalettes.map((palette) => (
                <div key={palette.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-4 h-4 w-4 shrink-0 accent-[var(--sh-primary,#ea580c)]"
                    checked={paletteSelection.isSelected(palette.id)}
                    onChange={() => paletteSelection.toggle(palette.id)}
                    aria-label={`Select ${palette.name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <PaletteCardGrid
                      palettes={[palette]}
                      onSelectPalette={(colors) => void handlePaletteSelect(colors)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-stone-400">No custom palettes yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-stone-200 p-3">
        <p className="text-xs font-bold text-stone-600">Create or import palette</p>
        <input
          value={newPaletteName}
          onChange={(e) => setNewPaletteName(e.target.value)}
          placeholder="Palette name"
          className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {editingColors.map((color, index) => (
            <ColorPicker
              key={`${index}-${color}`}
              compact
              value={color}
              onChange={(next) => {
                const copy = [...editingColors];
                copy[index] = next;
                setEditingColors(copy);
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => setEditingColors((c) => [...c, "#94a3b8"])}
            className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-600"
          >
            + Color
          </button>
          <button
            type="button"
            onClick={() => void savePalette({ name: newPaletteName, colors: editingColors })}
            className="rounded-lg bg-stone-900 px-2 py-1 text-[10px] font-semibold text-white"
          >
            Save palette
          </button>
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste HEX list or JSON palette..."
          className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs"
          rows={2}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => void importFromText()}
            className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold"
          >
            Import text
          </button>
          <label className="cursor-pointer rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold">
            Import from image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFromImage(file);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
