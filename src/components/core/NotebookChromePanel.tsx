"use client";

import {
  NOTEBOOK_COVERS,
  PEN_PRESETS,
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
  showCover = true,
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
}) {
  const previewColor = customCoverColor ?? DEFAULT_NOTEBOOK_COVER_COLOR;
  const previewStyle = resolveNotebookCoverStyle({
    coverId,
    customCoverColor: customCoverColor ?? previewColor,
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
        Show notebook cover
      </label>

      {showCover ? (
        <div className="overflow-hidden rounded-xl ring-1 ring-stone-200/60">
          <div
            className={`flex h-10 items-center px-3 ${previewStyle.className ?? ""}`}
            style={previewStyle.style}
          >
            <span className="text-xs font-bold text-white drop-shadow">Cover preview</span>
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Cover</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ColorPicker
            compact
            value={previewColor}
            onChange={(color) => onCustomCoverColorChange(color)}
            label="Cover"
          />
          <span className="text-[10px] text-stone-500">Click swatch for RGB wheel</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {NOTEBOOK_COVERS.map((cover) => (
            <button
              key={cover.id}
              type="button"
              onClick={() => {
                onCustomCoverColorChange(null);
                onCoverChange(cover.id);
              }}
              title={cover.label}
              className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cover.gradient} ring-2 ${
                !customCoverColor && coverId === cover.id
                  ? "ring-stone-900"
                  : "ring-transparent"
              }`}
            />
          ))}
        </div>
        {onApplyCoverPalette || onApplyPalette ? (
          <CompactPalettePicker
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
            <ColorPicker compact value={inkColor ?? "#44403c"} onChange={onInkColorChange} label="Ink" />
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
      </div>
    </section>
  );
}
