"use client";

import { useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";

import {
  BUILTIN_PALETTES,
  PALETTE_CATEGORIES,
} from "@/lib/customization/built-in-palettes";
import { applyStudyHaulPaletteGlobally, paletteToThemePatch } from "@/lib/customization/apply-palette";
import { extractColorsFromImage } from "@/lib/customization/extract-palette";
import { PaletteCardGrid } from "@/components/customization/PaletteCardGrid";
import { useCustomizationOptional } from "@/components/customization/CustomizationProvider";
import { useThemeOptional } from "@/lib/theme/ThemeProvider";

export function CompactPalettePicker({
  onSelectPalette,
  applyGlobally = true,
  label = "Built-in palettes",
  showImageImport = false,
}: {
  onSelectPalette?: (colors: string[]) => void;
  applyGlobally?: boolean;
  label?: string;
  showImageImport?: boolean;
}) {
  const customization = useCustomizationOptional();
  const theme = useThemeOptional();
  const [categoryId, setCategoryId] = useState(PALETTE_CATEGORIES[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const categoryPalettes = useMemo(
    () => BUILTIN_PALETTES.filter((palette) => palette.categoryId === categoryId),
    [categoryId],
  );

  async function handleSelect(colors: string[]) {
    onSelectPalette?.(colors);
    if (theme) {
      await theme.updateSettings(paletteToThemePatch(colors));
    } else if (applyGlobally) {
      await applyStudyHaulPaletteGlobally(colors);
    }
  }

  async function importPaletteFromImage(file: File) {
    setImporting(true);
    try {
      const colors = await extractColorsFromImage(file);
      if (colors.length === 0) return;
      const name = file.name.replace(/\.[^.]+$/, "") || "Imported palette";
      await customization?.savePalette({ name, colors });
      await handleSelect(colors);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-left text-[10px] font-semibold text-stone-600 hover:bg-stone-100"
      >
        {label}
        <span className="text-stone-400">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-2 rounded-xl border border-stone-100 bg-stone-50/80 p-2">
          {showImageImport ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-2.5 py-2 text-[10px] font-semibold text-stone-600 hover:bg-stone-50">
              <ImagePlus className="h-3.5 w-3.5 text-orange-500" />
              {importing ? "Extracting colors…" : "Import palette from image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/*"
                className="hidden"
                disabled={importing}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importPaletteFromImage(file);
                  event.target.value = "";
                }}
              />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-1">
            {PALETTE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={`rounded-md px-2 py-0.5 text-[9px] font-semibold ${
                  categoryId === category.id
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          <div className="max-h-44 overflow-y-auto">
            <PaletteCardGrid
              palettes={categoryPalettes}
              favoriteIds={customization?.state.favoritePaletteIds ?? []}
              onSelectPalette={(colors) => void handleSelect(colors)}
              onFavorite={
                customization
                  ? (id) => void customization.toggleFavoritePalette(id)
                  : undefined
              }
            />
          </div>
          {customization && customization.state.userPalettes.length > 0 ? (
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                My palettes
              </p>
              <div className="max-h-32 overflow-y-auto">
                <PaletteCardGrid
                  palettes={customization.state.userPalettes}
                  onSelectPalette={(colors) => void handleSelect(colors)}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
