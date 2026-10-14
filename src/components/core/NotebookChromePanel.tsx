"use client";

import {
  PEN_PRESETS,
  coversByCategory,
  resolveNotebookCoverStyle,
  type NotebookCoverId,
  type PageTemplateId,
  type PenPresetId,
} from "@/lib/core/page-templates";
import { ColorPicker } from "@/components/customization/ColorPicker";
import { CompactPalettePicker } from "@/components/customization/CompactPalettePicker";
import { TemplateLibrary } from "@/components/customization/TemplateLibrary";
import { DEFAULT_NOTEBOOK_COVER_COLOR } from "@/lib/customization/study-haul-defaults";
import type { NotebookChromeState } from "@/lib/core/note-types";

export function NotebookChromePanel({
  notebook,
  coverId,
  customCoverColor,
  showCover = false,
  pageTemplateId,
  customBackgroundAssetId,
  penPresetId,
  inkColor,
  onCoverChange,
  onCustomCoverColorChange,
  onShowCoverChange,
  onPageBackgroundChange,
  onColorSchemeChange,
  onApplyPalette,
  onApplyCoverPalette,
  onApplyPagePalette,
  onTemplateChange,
  onCustomBackgroundChange,
  onPenPresetChange,
  onInkColorChange,
  pencilOnly = false,
  onPencilOnlyChange,
}: {
  notebook?: NotebookChromeState;
  coverId?: NotebookCoverId;
  customCoverColor?: string | null;
  showCover?: boolean;
  pageTemplateId?: PageTemplateId;
  customBackgroundAssetId?: string | null;
  penPresetId?: PenPresetId;
  inkColor?: string;
  onCoverChange: (id: NotebookCoverId) => void;
  onCustomCoverColorChange: (color: string | null) => void;
  onShowCoverChange: (show: boolean) => void;
  onPageBackgroundChange?: (color: string) => void;
  onColorSchemeChange?: (scheme: NonNullable<NotebookChromeState["colorScheme"]>) => void;
  onApplyPalette?: (colors: string[]) => void;
  onApplyCoverPalette?: (colors: string[]) => void;
  onApplyPagePalette?: (colors: string[]) => void;
  onTemplateChange: (id: PageTemplateId) => void;
  onCustomBackgroundChange: (assetId: string | null) => void;
  onPenPresetChange: (id: PenPresetId) => void;
  onInkColorChange?: (color: string) => void;
  pencilOnly?: boolean;
  onPencilOnlyChange?: (value: boolean) => void;
}) {
  const previewStyle = resolveNotebookCoverStyle({
    coverId,
    customCoverColor,
  });

  return (
    <section className="space-y-4 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Notebook look</p>

      <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
        <input
          type="checkbox"
          checked={showCover}
          onChange={(e) => onShowCoverChange(e.target.checked)}
          className="rounded border-orange-300"
        />
        Show cover band on pages (off = more paper)
      </label>

      {showCover ? (
        <div className="overflow-hidden rounded-xl ring-1 ring-stone-200/60">
          <div
            className={`flex h-10 items-center px-3 ${previewStyle.className ?? ""}`}
            style={previewStyle.style}
          >
            <span className={`text-xs font-bold ${previewStyle.titleClassName}`}>
              Cover preview
            </span>
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Custom cover color
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ColorPicker
            compact
            value={customCoverColor ?? DEFAULT_NOTEBOOK_COVER_COLOR}
            onChange={(color) => onCustomCoverColorChange(color)}
            label="Cover"
          />
          <button
            type="button"
            onClick={() => onCustomCoverColorChange(null)}
            className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-600"
          >
            Use preset
          </button>
        </div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Color covers
        </p>
        <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {coversByCategory("color").map((cover) => (
            <button
              key={cover.id}
              type="button"
              onClick={() => {
                onCustomCoverColorChange(null);
                onCoverChange(cover.id);
              }}
              title={cover.label}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br shadow-sm ${cover.gradient} ring-2 ${
                !customCoverColor && coverId === cover.id
                  ? "ring-stone-900"
                  : "ring-transparent"
              }`}
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-black/20" />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/85" />
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Art covers
        </p>
        <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {coversByCategory("art").map((cover) => (
            <button
              key={cover.id}
              type="button"
              onClick={() => {
                onCustomCoverColorChange(null);
                onCoverChange(cover.id);
              }}
              title={cover.label}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg shadow-sm ring-2 ${
                !customCoverColor && coverId === cover.id
                  ? "ring-stone-900"
                  : "ring-transparent"
              }`}
              style={
                cover.artBackground
                  ? { backgroundImage: cover.artBackground, backgroundSize: "cover" }
                  : undefined
              }
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-black/20" />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/85" />
            </button>
          ))}
        </div>
        {onApplyCoverPalette || onApplyPalette ? (
          <CompactPalettePicker
            applyGlobally={false}
            label="Cover palettes"
            onSelectPalette={(colors) => {
              onApplyCoverPalette?.(colors);
              onApplyPalette?.(colors);
            }}
          />
        ) : null}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Page background
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ColorPicker
            compact
            value={notebook?.pageBackgroundColor ?? "#fffdf9"}
            onChange={(color) => onPageBackgroundChange?.(color)}
            label="Page background"
          />
          <span className="text-[10px] text-stone-500">Click swatch for RGB wheel</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {(
            [
              { id: "solid", label: "Solid" },
              { id: "ombre", label: "Ombre" },
              { id: "edge", label: "Edge" },
              { id: "bubbles", label: "Bubbles" },
            ] as const
          ).map((scheme) => (
            <button
              key={scheme.id}
              type="button"
              onClick={() => onColorSchemeChange?.(scheme.id)}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                (notebook?.colorScheme ?? "solid") === scheme.id
                  ? "bg-orange-600 text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {scheme.label}
            </button>
          ))}
        </div>
        {onApplyPagePalette || onApplyPalette ? (
          <CompactPalettePicker
            applyGlobally={false}
            label="Page palettes"
            onSelectPalette={(colors) => {
              onApplyPagePalette?.(colors);
              onApplyPalette?.(colors);
            }}
          />
        ) : null}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Paper & templates
        </p>
        <div className="mt-2">
          <TemplateLibrary
            compact
            selectedBuiltinId={pageTemplateId}
            selectedImportedId={customBackgroundAssetId ?? undefined}
            onSelectBuiltin={(id) => {
              onCustomBackgroundChange(null);
              onTemplateChange(id as PageTemplateId);
            }}
            onSelectImported={(assetId) => onCustomBackgroundChange(assetId)}
          />
        </div>
      </div>

      {onInkColorChange ? (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Ink color</p>
          <p className="mt-0.5 text-[10px] text-stone-500">
            Pen and highlighter only — not tied to notebook palettes.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <ColorPicker compact touchFriendly value={inkColor ?? "#44403c"} onChange={onInkColorChange} label="Ink" />
            <span className="text-[10px] text-stone-500">Click swatch for RGB wheel</span>
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Pen preset</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {PEN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPenPresetChange(preset.id)}
              title={preset.description}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                penPresetId === preset.id
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {onPencilOnlyChange ? (
          <label className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-stone-600">
            <input
              type="checkbox"
              checked={pencilOnly}
              onChange={(event) => onPencilOnlyChange(event.target.checked)}
              className="rounded border-orange-300"
            />
            Pencil only (stylus draws · finger pans). Off = finger draws · two-finger pans.
          </label>
        ) : null}
      </div>
    </section>
  );
}
