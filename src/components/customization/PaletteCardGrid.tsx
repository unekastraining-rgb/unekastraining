"use client";

import { Star } from "lucide-react";

import type { ColorPalette } from "@/lib/customization/types";

export function PaletteCard({
  palette,
  favorite,
  onSelect,
  onFavorite,
  onDuplicate,
}: {
  palette: { id: string; name: string; colors: string[] };
  favorite?: boolean;
  onSelect?: (colors: string[]) => void;
  onFavorite?: () => void;
  onDuplicate?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(palette.colors)}
      className="group w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex">
        <div className="flex w-14 shrink-0 flex-col gap-1 border-r border-stone-100 p-2">
          {palette.colors.slice(0, 5).map((color) => (
            <span
              key={color}
              className="block h-5 w-5 rounded-full ring-1 ring-black/5"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-bold text-stone-900">{palette.name}</p>
            <span className="flex gap-1 opacity-0 transition group-hover:opacity-100">
              {onFavorite ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && onFavorite()}
                  className="rounded p-0.5 hover:bg-stone-100"
                >
                  <Star
                    className={`h-3.5 w-3.5 ${
                      favorite ? "fill-amber-400 text-amber-400" : "text-stone-400"
                    }`}
                  />
                </span>
              ) : null}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {palette.colors.slice(0, 4).map((color) => (
              <code key={color} className="text-[9px] text-stone-400">
                {color}
              </code>
            ))}
          </div>
          <div className="mt-2 flex h-10 overflow-hidden rounded-lg">
            {palette.colors.map((color) => (
              <span key={color} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export function PaletteCardGrid({
  palettes,
  favoriteIds = [],
  onSelectPalette,
  onFavorite,
  onDuplicate,
}: {
  palettes: Array<{ id: string; name: string; colors: string[] }>;
  favoriteIds?: string[];
  onSelectPalette?: (colors: string[]) => void;
  onFavorite?: (id: string) => void;
  onDuplicate?: (palette: ColorPalette) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {palettes.map((palette) => (
        <PaletteCard
          key={palette.id}
          palette={palette}
          favorite={favoriteIds.includes(palette.id)}
          onSelect={onSelectPalette}
          onFavorite={onFavorite ? () => onFavorite(palette.id) : undefined}
        />
      ))}
    </div>
  );
}
