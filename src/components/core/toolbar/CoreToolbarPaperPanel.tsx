"use client";

import { useState } from "react";
import {
  coversByCategory,
  resolveNotebookCoverStyle,
  type NotebookCoverId,
  type PageTemplateId,
} from "@/lib/core/page-templates";
import { ColorPicker } from "@/components/customization/ColorPicker";
import { NotebookImageImport } from "@/components/core/NotebookImageImport";
import { TemplateLibrary } from "@/components/customization/TemplateLibrary";
import {
  CoreToolbarShell,
  NavRow,
} from "@/components/core/toolbar/CoreToolbarShell";
import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import { DEFAULT_NOTEBOOK_COVER_COLOR } from "@/lib/customization/study-haul-defaults";
import type { NotebookChromeState } from "@/lib/core/note-types";
import {
  CHALKBOARD_BACKGROUND,
  WHITEBOARD_BACKGROUND,
} from "@/lib/core/ink-engine";
import {
  DEFAULT_LINE_COLOR,
  DEFAULT_PAPER_COLOR,
  DEFAULT_RULING_SPACING,
} from "@/lib/core/paper-style";

export type PaperSurfaceId = "notebook" | "whiteboard" | "chalkboard";

type PaperScreen = "main" | "covers" | "templates" | "ruling" | "layers";

const SURFACES: {
  id: PaperSurfaceId;
  label: string;
  description: string;
  swatch: string;
}[] = [
  {
    id: "notebook",
    label: "Notebook",
    description: "Cream paper page",
    swatch: "#fffdf9",
  },
  {
    id: "whiteboard",
    label: "Whiteboard",
    description: "Infinite bright canvas",
    swatch: WHITEBOARD_BACKGROUND,
  },
  {
    id: "chalkboard",
    label: "Chalkboard",
    description: "Dark green board + chalk",
    swatch: CHALKBOARD_BACKGROUND,
  },
];

const PAPER_SWATCHES = ["#fffdf9", "#ffffff", "#fef9c3", "#ecfdf5", "#eff6ff", "#fdf2f8", "#1a3d32"];
const LINE_SWATCHES = ["#e7e5e4", "#a8a29e", "#94a3b8", "#fda4af", "#5eead4", "#1c1917"];

export function CoreToolbarPaperPanel({
  notebook,
  coverId,
  customCoverColor,
  showCover = false,
  customCoverAssetId,
  pageTemplateId,
  customBackgroundAssetId,
  activeSurface,
  onCoverChange,
  onCustomCoverColorChange,
  onCustomCoverAssetChange,
  onShowCoverChange,
  onPageBackgroundChange,
  onRulingLineColorChange,
  onRulingSpacingChange,
  onLayerVisibilityChange,
  onSelectBuiltinTemplate,
  onSelectImportedTemplate,
  onApplySurface,
  onClose,
  onPageOrientationChange,
}: {
  notebook?: NotebookChromeState;
  coverId?: NotebookCoverId | string;
  customCoverColor?: string | null;
  showCover?: boolean;
  customCoverAssetId?: string | null;
  pageTemplateId?: PageTemplateId;
  customBackgroundAssetId?: string | null;
  activeSurface?: PaperSurfaceId;
  onCoverChange: (id: NotebookCoverId) => void;
  onCustomCoverColorChange: (color: string | null) => void;
  onCustomCoverAssetChange?: (assetId: string | null) => void;
  onShowCoverChange: (show: boolean) => void;
  onPageBackgroundChange?: (color: string) => void;
  onPageOrientationChange?: (orientation: "portrait" | "landscape") => void;
  onRulingLineColorChange?: (color: string) => void;
  onRulingSpacingChange?: (px: number) => void;
  onLayerVisibilityChange?: (patch: NonNullable<NotebookChromeState["layerVisibility"]>) => void;
  onSelectBuiltinTemplate: (templateId: PageTemplateId) => void;
  onSelectImportedTemplate: (assetId: string) => void;
  onApplySurface?: (surface: PaperSurfaceId) => void;
  onClose: () => void;
}) {
  const [screen, setScreen] = useState<PaperScreen>("main");
  const preview = resolveNotebookCoverStyle({
    coverId: coverId as NotebookCoverId | undefined,
    customCoverColor,
    customCoverAssetId,
  });
  const presetSelected = !customCoverColor && !customCoverAssetId;
  const layers = {
    pen: notebook?.layerVisibility?.pen !== false,
    highlighter: notebook?.layerVisibility?.highlighter !== false,
    shapes: notebook?.layerVisibility?.shapes !== false,
    stickies: notebook?.layerVisibility?.stickies !== false,
    textBoxes: notebook?.layerVisibility?.textBoxes !== false,
  };

  if (screen === "covers") {
    return (
      <CoreToolbarShell title="Covers" onBack={() => setScreen("main")} onClose={onClose}>
        <label className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold text-stone-600">
          <input
            type="checkbox"
            checked={showCover}
            onChange={(event) => onShowCoverChange(event.target.checked)}
            className="rounded border-orange-300"
          />
          Show cover band on pages
        </label>
        {showCover ? (
          <div className="mb-3 overflow-hidden rounded-xl ring-1 ring-stone-200/60">
            <div
              className={`flex h-9 items-center px-3 ${preview.className ?? ""}`}
              style={preview.style}
            >
              <span className={`text-xs font-bold ${preview.titleClassName}`}>Cover preview</span>
            </div>
          </div>
        ) : null}
        <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Custom color
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
          <ColorPicker
            compact
            value={customCoverColor ?? DEFAULT_NOTEBOOK_COVER_COLOR}
            onChange={(color) => {
              onCustomCoverAssetChange?.(null);
              onCustomCoverColorChange(color);
            }}
            label="Cover"
          />
          <CoreChromeAction
            onActivate={() => onCustomCoverColorChange(null)}
            className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-600"
          >
            Use preset
          </CoreChromeAction>
        </div>
        {onCustomCoverAssetChange || onSelectImportedTemplate ? (
          <div className="mt-3 border-t border-stone-100 px-1 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Import a picture
            </p>
            <div className="mt-2">
              <NotebookImageImport
                compact
                selectedCoverAssetId={customCoverAssetId}
                selectedBackgroundAssetId={customBackgroundAssetId}
                onApplyCover={
                  onCustomCoverAssetChange
                    ? (assetId) => {
                        if (assetId) onCustomCoverColorChange(null);
                        onCustomCoverAssetChange(assetId);
                      }
                    : undefined
                }
                onApplyBackground={(assetId) => {
                  if (assetId) onSelectImportedTemplate(assetId);
                }}
              />
            </div>
          </div>
        ) : null}
        <p className="mt-3 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Color covers
        </p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {coversByCategory("color").map((cover) => (
            <CoreChromeAction
              key={cover.id}
              onActivate={() => {
                onCustomCoverColorChange(null);
                onCustomCoverAssetChange?.(null);
                onCoverChange(cover.id);
              }}
              title={cover.label}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br shadow-sm ${cover.gradient} ring-2 ${
                presetSelected && coverId === cover.id
                  ? "ring-stone-900"
                  : "ring-transparent"
              }`}
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-black/20" />
            </CoreChromeAction>
          ))}
        </div>
        <p className="mt-3 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Art covers
        </p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {coversByCategory("art").map((cover) => (
            <CoreChromeAction
              key={cover.id}
              onActivate={() => {
                onCustomCoverColorChange(null);
                onCustomCoverAssetChange?.(null);
                onCoverChange(cover.id);
              }}
              title={cover.label}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg shadow-sm ring-2 ${
                presetSelected && coverId === cover.id
                  ? "ring-stone-900"
                  : "ring-transparent"
              }`}
            >
              <span
                className="absolute inset-0"
                style={
                  cover.artBackground
                    ? { backgroundImage: cover.artBackground, backgroundSize: "cover" }
                    : undefined
                }
                aria-hidden
              />
              <div className="absolute inset-y-0 left-0 w-1 bg-black/20" />
            </CoreChromeAction>
          ))}
        </div>
      </CoreToolbarShell>
    );
  }

  if (screen === "templates") {
    return (
      <CoreToolbarShell title="Paper templates" onBack={() => setScreen("main")} onClose={onClose}>
        <p className="mb-2 text-[10px] text-stone-500">
          College ruled, Cornell, columns, staff, McKinsey, or import a background.
        </p>
        {onPageBackgroundChange ? (
          <div className="mb-3 flex items-center gap-2 border-b border-stone-100 pb-3">
            <ColorPicker
              compact
              value={notebook?.pageBackgroundColor ?? DEFAULT_PAPER_COLOR}
              onChange={onPageBackgroundChange}
              label="Page color"
            />
            <span className="text-[10px] text-stone-500">Page color</span>
          </div>
        ) : null}
        <TemplateLibrary
          selectedBuiltinId={pageTemplateId}
          selectedImportedId={customBackgroundAssetId ?? undefined}
          onSelectBuiltin={(id) => {
            onSelectBuiltinTemplate(id as PageTemplateId);
            onClose();
          }}
          onSelectImported={(assetId) => {
            onSelectImportedTemplate(assetId);
            onClose();
          }}
        />
      </CoreToolbarShell>
    );
  }

  if (screen === "ruling") {
    const spacing = notebook?.rulingSpacingPx ?? DEFAULT_RULING_SPACING;
    return (
      <CoreToolbarShell title="Paper & lines" onBack={() => setScreen("main")} onClose={onClose}>
        <p className="mb-2 text-[10px] text-stone-500">
          Paper color, line color, and spacing — like FreeNotes knobs, Study Haul owned.
        </p>
        {onPageOrientationChange ? (
          <>
            <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Orientation
            </p>
            <div className="mt-1 mb-3 flex gap-2 px-1">
              {(
                [
                  { id: "portrait", label: "Portrait" },
                  { id: "landscape", label: "Landscape" },
                ] as const
              ).map((item) => (
                <CoreChromeAction
                  key={item.id}
                  onActivate={() => onPageOrientationChange(item.id)}
                  pressed={(notebook?.pageOrientation ?? "portrait") === item.id}
                  className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold ${
                    (notebook?.pageOrientation ?? "portrait") === item.id
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-700"
                  }`}
                >
                  {item.label}
                </CoreChromeAction>
              ))}
            </div>
          </>
        ) : null}
        <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Paper color
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
          {PAPER_SWATCHES.map((color) => (
            <CoreChromeAction
              key={color}
              title={color}
              onActivate={() => onPageBackgroundChange?.(color)}
              pressed={(notebook?.pageBackgroundColor ?? DEFAULT_PAPER_COLOR) === color}
              className={`h-7 w-7 rounded-full ring-2 ${
                (notebook?.pageBackgroundColor ?? DEFAULT_PAPER_COLOR) === color
                  ? "ring-stone-900"
                  : "ring-transparent"
              }`}
            >
              <span className="block h-full w-full rounded-full" style={{ backgroundColor: color }} />
            </CoreChromeAction>
          ))}
          {onPageBackgroundChange ? (
            <ColorPicker
              compact
              value={notebook?.pageBackgroundColor ?? DEFAULT_PAPER_COLOR}
              onChange={onPageBackgroundChange}
              label="Paper"
            />
          ) : null}
        </div>
        <p className="mt-3 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Line color
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
          {LINE_SWATCHES.map((color) => (
            <CoreChromeAction
              key={color}
              title={color}
              onActivate={() => onRulingLineColorChange?.(color)}
              pressed={(notebook?.rulingLineColor ?? DEFAULT_LINE_COLOR) === color}
              className={`h-7 w-7 rounded-full ring-2 ${
                (notebook?.rulingLineColor ?? DEFAULT_LINE_COLOR) === color
                  ? "ring-stone-900"
                  : "ring-transparent"
              }`}
            >
              <span className="block h-full w-full rounded-full" style={{ backgroundColor: color }} />
            </CoreChromeAction>
          ))}
          {onRulingLineColorChange ? (
            <ColorPicker
              compact
              value={notebook?.rulingLineColor ?? DEFAULT_LINE_COLOR}
              onChange={onRulingLineColorChange}
              label="Lines"
            />
          ) : null}
        </div>
        <p className="mt-3 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Spacing ({spacing}px)
        </p>
        <input
          type="range"
          min={20}
          max={48}
          step={1}
          value={spacing}
          onChange={(event) => onRulingSpacingChange?.(Number(event.target.value))}
          className="mt-2 w-full accent-stone-800"
        />
        <div className="mt-1 flex justify-between text-[10px] text-stone-400">
          <span>Tight</span>
          <span>Wide</span>
        </div>
      </CoreToolbarShell>
    );
  }

  if (screen === "layers") {
    return (
      <CoreToolbarShell title="Layers" onBack={() => setScreen("main")} onClose={onClose}>
        <p className="mb-2 text-[10px] text-stone-500">
          Show or hide ink, highlights, shapes, stickies, and text boxes on this notebook.
        </p>
        {(
          [
            ["pen", "Pen / pencil ink"],
            ["highlighter", "Highlights"],
            ["shapes", "Shapes"],
            ["stickies", "Stickies"],
            ["textBoxes", "Text boxes"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="mb-2 flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700"
          >
            {label}
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={(event) =>
                onLayerVisibilityChange?.({ [key]: event.target.checked })
              }
              className="rounded border-orange-300"
            />
          </label>
        ))}
      </CoreToolbarShell>
    );
  }

  return (
    <CoreToolbarShell title="Edit notebook" onClose={onClose}>
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
        Surfaces
      </p>
      <div className="mb-3 grid grid-cols-1 gap-2">
        {SURFACES.map((surface) => {
          const active = activeSurface === surface.id;
          return (
            <CoreChromeAction
              key={surface.id}
              onActivate={() => {
                onApplySurface?.(surface.id);
                onClose();
              }}
              pressed={active}
              className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition touch-manipulation ${
                active
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white hover:border-orange-200 hover:bg-orange-50"
              }`}
            >
              <span
                className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-black/10"
                style={{ backgroundColor: surface.swatch }}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-xs font-bold">{surface.label}</span>
                <span
                  className={`block text-[10px] ${active ? "text-white/75" : "text-stone-500"}`}
                >
                  {surface.description}
                </span>
              </span>
            </CoreChromeAction>
          );
        })}
      </div>
      <NavRow
        label="Covers"
        description="Notebook cover band & colors"
        onClick={() => setScreen("covers")}
      />
      <NavRow
        label="Templates"
        description="Ruled, Cornell, columns, staff, McKinsey"
        onClick={() => setScreen("templates")}
      />
      <NavRow
        label="Paper & lines"
        description="Paper color, line color, spacing"
        onClick={() => setScreen("ruling")}
      />
      <NavRow
        label="Layers"
        description="Toggle ink, highlights, shapes…"
        onClick={() => setScreen("layers")}
      />
    </CoreToolbarShell>
  );
}
