"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import type { NoteMethod } from "@/generated/prisma";
import { NotebookImageImport } from "@/components/core/NotebookImageImport";
import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import { TemplateLibrary } from "@/components/customization/TemplateLibrary";
import {
  NOTEBOOK_TEMPLATE_PACKS,
  PAGE_TEMPLATES,
  coversByCategory,
  resolveNotebookCoverStyle,
  type NotebookCoverId,
  type NotebookTemplatePack,
  type PageTemplateId,
  type PenPresetId,
} from "@/lib/core/page-templates";
import { NOTEBOOK_PAPER_COLORS } from "@/lib/core/paper-style";

export interface NotebookSetupConfig {
  coverId: NotebookCoverId;
  customCoverColor?: string | null;
  /** Imported cover artwork (media asset id). */
  customCoverAssetId?: string | null;
  showCover?: boolean;
  pageTemplateId: PageTemplateId;
  customBackgroundAssetId?: string | null;
  penPresetId: PenPresetId;
  mode: "notes" | "whiteboard";
  method: NoteMethod;
  whiteboardStarterId: string;
  title: string;
  pageOrientation?: "portrait" | "landscape";
  pageBackgroundColor?: string | null;
}

export function NotebookSetupWizard({
  open,
  onClose,
  onComplete,
  defaultTitle,
  variant = "full",
  defaults,
  suggestionsSummary,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (config: NotebookSetupConfig) => void;
  defaultTitle?: string;
  /** cover-only: AI/material import already chose title, paper, and type */
  variant?: "full" | "cover-only";
  defaults?: Partial<NotebookSetupConfig>;
  suggestionsSummary?: string;
}) {
  const [coverId, setCoverId] = useState<NotebookCoverId>(
    defaults?.coverId ?? "classic_orange",
  );
  const [customCoverColor, setCustomCoverColor] = useState<string | null>(
    defaults?.customCoverColor === undefined ? null : defaults.customCoverColor,
  );
  const [customCoverAssetId, setCustomCoverAssetId] = useState<string | null>(
    defaults?.customCoverAssetId ?? null,
  );
  /** On-page cover band is off by default — paper is the hero while writing */
  const [showCover, setShowCover] = useState(defaults?.showCover ?? false);
  const [pageTemplateId, setPageTemplateId] = useState<PageTemplateId>(
    defaults?.pageTemplateId ?? "blank",
  );
  const [customBackgroundAssetId, setCustomBackgroundAssetId] = useState<string | null>(
    defaults?.customBackgroundAssetId ?? null,
  );
  const [penPresetId, setPenPresetId] = useState<PenPresetId>(
    defaults?.penPresetId ?? "ballpoint",
  );
  const [mode, setMode] = useState<"notes" | "whiteboard">(defaults?.mode ?? "notes");
  const [whiteboardStarterId] = useState(defaults?.whiteboardStarterId ?? "plain");
  const [title, setTitle] = useState(
    defaults?.title?.trim() || defaultTitle?.trim() || "Untitled notebook",
  );
  const [pageOrientation, setPageOrientation] = useState<"portrait" | "landscape">(
    defaults?.pageOrientation ?? "portrait",
  );
  const [pageBackgroundColor, setPageBackgroundColor] = useState<string>(
    defaults?.pageBackgroundColor ?? NOTEBOOK_PAPER_COLORS[0]!.hex,
  );
  const [activePackId, setActivePackId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    if (defaults?.title?.trim()) setTitle(defaults.title.trim());
    else if (defaultTitle?.trim()) setTitle(defaultTitle.trim());
    if (defaults?.pageTemplateId) setPageTemplateId(defaults.pageTemplateId);
    if (defaults?.mode) setMode(defaults.mode);
    if (defaults?.coverId) setCoverId(defaults.coverId);
    if (defaults?.customCoverColor !== undefined) {
      setCustomCoverColor(defaults.customCoverColor);
    }
    if (defaults?.customCoverAssetId !== undefined) {
      setCustomCoverAssetId(defaults.customCoverAssetId);
    }
    if (defaults?.showCover !== undefined) setShowCover(defaults.showCover);
    else if (variant === "full") setShowCover(false);
    if (defaults?.pageOrientation) setPageOrientation(defaults.pageOrientation);
    if (defaults?.pageBackgroundColor) setPageBackgroundColor(defaults.pageBackgroundColor);
  }, [open, defaultTitle, defaults, variant]);

  if (!open) return null;

  const template = PAGE_TEMPLATES.find((item) => item.id === pageTemplateId);
  const method =
    mode === "whiteboard"
      ? ("WHITEBOARD" as NoteMethod)
      : ((template?.noteMethod ?? defaults?.method ?? "BLANK") as NoteMethod);

  const coverPreview = resolveNotebookCoverStyle({
    coverId,
    customCoverColor,
    customCoverAssetId,
  });

  const coverOnly = variant === "cover-only";

  return (
    <div
      data-notebook-setup
      className="fixed inset-0 z-[5200] flex items-center justify-center bg-stone-900/60 p-3 backdrop-blur-sm sm:p-4"
    >
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#fff8f1] shadow-2xl ring-1 ring-orange-100">
        <div className="flex items-center justify-between border-b border-orange-100 bg-white px-5 py-3 sm:px-6 sm:py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
              {coverOnly ? "Choose a cover" : "New notebook"}
            </p>
            <h2 className="text-xl font-black text-stone-900 sm:text-2xl">
              {coverOnly ? "Almost ready" : "Title · cover · paper · write"}
            </h2>
            {!coverOnly ? (
              <p className="mt-0.5 text-xs text-stone-500">
                One screen — then Start writing. No multi-step wizard.
              </p>
            ) : null}
          </div>
          <a
            href="/core"
            data-core-hard-nav="1"
            className="rounded-xl p-2 text-stone-500 touch-manipulation hover:bg-stone-100"
            aria-label="Close"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <X className="h-5 w-5" />
          </a>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_220px]">
          <div className="space-y-6 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            {/* Mobile cover+paper preview — product feel without desktop sidebar */}
            <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 lg:hidden">
              <div
                className={`relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg shadow-md ring-1 ring-stone-200/70 ${coverPreview.className ?? ""}`}
                style={coverPreview.style}
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-black/20" />
                <div className="absolute inset-x-1 bottom-2">
                  <p className={`line-clamp-2 text-[8px] font-black leading-tight ${coverPreview.titleClassName}`}>
                    {title}
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/90" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Preview
                </p>
                <p className="truncate text-sm font-bold text-stone-900">{title}</p>
                <p className="text-xs text-stone-500">
                  {PAGE_TEMPLATES.find((t) => t.id === pageTemplateId)?.label ?? "Blank"} paper
                </p>
              </div>
            </div>
            {coverOnly ? (
              <div className="rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  AI / import filled these in
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-900">{title}</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  {suggestionsSummary ??
                    `${mode === "whiteboard" ? "Whiteboard" : "Notes"} · ${
                      PAGE_TEMPLATES.find((t) => t.id === pageTemplateId)?.label ?? "Blank"
                    } paper`}
                </p>
              </div>
            ) : (
              <label className="block text-sm">
                <span className="font-semibold text-stone-700">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. PSYC 101, Weekly planner…"
                  className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm"
                  autoFocus
                />
              </label>
            )}

            <section className="space-y-3">
              <div>
                <p className="text-sm font-bold text-stone-900">Cover</p>
                <p className="text-xs text-stone-500">
                  Pick a cover like a real notebook — this is what shows on your shelf.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                {coversByCategory("color").map((cover) => (
                  <CoreChromeAction
                    key={cover.id}
                    onActivate={() => {
                      setCustomCoverColor(null);
                      setCustomCoverAssetId(null);
                      setCoverId(cover.id);
                    }}
                    pressed={!customCoverColor && !customCoverAssetId && coverId === cover.id}
                    className={`rounded-2xl border p-1.5 text-left transition ${
                      !customCoverColor && !customCoverAssetId && coverId === cover.id
                        ? "border-stone-900 ring-2 ring-stone-900"
                        : "border-orange-100 bg-white hover:border-orange-200"
                    }`}
                  >
                    <div
                      className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br shadow-sm ${cover.gradient}`}
                    >
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
                      <div className="absolute inset-x-0 bottom-0 h-2 bg-white/85" />
                    </div>
                    <p className="mt-1 truncate text-[10px] font-semibold text-stone-800">
                      {cover.label}
                    </p>
                  </CoreChromeAction>
                ))}
                {coversByCategory("art").map((cover) => (
                  <CoreChromeAction
                    key={cover.id}
                    onActivate={() => {
                      setCustomCoverColor(null);
                      setCustomCoverAssetId(null);
                      setCoverId(cover.id);
                    }}
                    pressed={!customCoverColor && !customCoverAssetId && coverId === cover.id}
                    className={`rounded-2xl border p-1.5 text-left transition ${
                      !customCoverColor && !customCoverAssetId && coverId === cover.id
                        ? "border-stone-900 ring-2 ring-stone-900"
                        : "border-orange-100 bg-white hover:border-orange-200"
                    }`}
                  >
                    <div
                      className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-sm"
                      style={
                        cover.artBackground
                          ? {
                              backgroundImage: cover.artBackground,
                              backgroundSize: "cover",
                            }
                          : undefined
                      }
                    >
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
                      <div className="absolute inset-x-0 bottom-0 h-2 bg-white/85" />
                    </div>
                    <p className="mt-1 truncate text-[10px] font-semibold text-stone-800">
                      {cover.label}
                    </p>
                  </CoreChromeAction>
                ))}
              </div>
              <div className="rounded-2xl border border-orange-100 bg-white p-3">
                <p className="text-xs font-bold text-stone-900">Use your own picture</p>
                <p className="mb-2 text-[11px] text-stone-500">
                  Import art or a photo and use it as the cover or as the paper background.
                </p>
                <NotebookImageImport
                  selectedCoverAssetId={customCoverAssetId}
                  selectedBackgroundAssetId={customBackgroundAssetId}
                  onApplyCover={(assetId) => {
                    setCustomCoverAssetId(assetId);
                    if (assetId) setCustomCoverColor(null);
                  }}
                  onApplyBackground={(assetId) => setCustomBackgroundAssetId(assetId)}
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <input
                  type="checkbox"
                  checked={showCover}
                  onChange={(e) => setShowCover(e.target.checked)}
                  className="rounded border-orange-300"
                />
                Show cover band on every page (off = more paper, less chrome)
              </label>
            </section>

            {!coverOnly ? (
              <>
                <section className="space-y-3">
                  <div>
                    <p className="text-sm font-bold text-stone-900">Paper</p>
                    <p className="text-xs text-stone-500">
                      <strong>Paper</strong> = the surface (blank, lines, dots).{" "}
                      <strong>Layouts</strong> = guides on top (Cornell, columns).{" "}
                      <strong>My imports</strong> = your own PNG/JPG/PDF backgrounds.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-stone-600">Orientation</span>
                    {(
                      [
                        { id: "portrait", label: "Portrait" },
                        { id: "landscape", label: "Landscape" },
                      ] as const
                    ).map((item) => (
                      <CoreChromeAction
                        key={item.id}
                        onActivate={() => setPageOrientation(item.id)}
                        pressed={pageOrientation === item.id}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${
                          pageOrientation === item.id
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-orange-100 bg-white text-stone-700 hover:border-orange-200"
                        }`}
                      >
                        {item.label}
                      </CoreChromeAction>
                    ))}
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-stone-600">Paper color</p>
                    <div className="flex flex-wrap gap-2">
                      {NOTEBOOK_PAPER_COLORS.map((swatch) => (
                        <CoreChromeAction
                          key={swatch.id}
                          title={swatch.label}
                          aria-label={swatch.label}
                          onActivate={() => setPageBackgroundColor(swatch.hex)}
                          pressed={pageBackgroundColor.toLowerCase() === swatch.hex.toLowerCase()}
                          className={`h-9 w-9 rounded-full border-2 shadow-sm ${
                            pageBackgroundColor.toLowerCase() === swatch.hex.toLowerCase()
                              ? "border-stone-900 ring-2 ring-orange-300"
                              : "border-stone-200"
                          }`}
                        >
                          <span
                            className="block h-full w-full rounded-full"
                            style={{ backgroundColor: swatch.hex }}
                          />
                        </CoreChromeAction>
                      ))}
                    </div>
                  </div>
                  <TemplateLibrary
                    selectedBuiltinId={pageTemplateId}
                    selectedImportedId={customBackgroundAssetId ?? undefined}
                    onSelectBuiltin={(id) => {
                      setCustomBackgroundAssetId(null);
                      setPageTemplateId(id as PageTemplateId);
                    }}
                    onSelectImported={(assetId) => setCustomBackgroundAssetId(assetId)}
                  />
                </section>

                <section>
                  <p className="text-sm font-bold text-stone-900">Notebook or whiteboard</p>
                  <div className="mt-2 flex gap-2">
                    {(
                      [
                        { id: "notes", label: "Notebook", hint: "Pages you write on" },
                        { id: "whiteboard", label: "Whiteboard", hint: "Infinite canvas" },
                      ] as const
                    ).map((item) => (
                      <CoreChromeAction
                        key={item.id}
                        onActivate={() => setMode(item.id)}
                        pressed={mode === item.id}
                        className={`flex-1 rounded-2xl border px-3 py-2.5 text-left ${
                          mode === item.id
                            ? "border-orange-500 bg-orange-50"
                            : "border-orange-100 bg-white"
                        }`}
                      >
                        <p className="text-sm font-semibold text-stone-900">{item.label}</p>
                        <p className="text-[10px] text-stone-500">{item.hint}</p>
                      </CoreChromeAction>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
          </div>

          <aside className="hidden border-l border-orange-100 bg-white/80 p-4 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Preview
            </p>
            <div className="mt-3 mx-auto w-[9.5rem] overflow-hidden rounded-xl shadow-lg ring-1 ring-stone-200/60">
              <div
                className={`relative aspect-[3/4] ${coverPreview.className ?? ""}`}
                style={coverPreview.style}
              >
                <div className="absolute inset-y-0 left-0 w-2 bg-black/15" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-3 pb-4">
                  <span className={`line-clamp-3 text-xs font-black leading-snug ${coverPreview.titleClassName}`}>
                    {title}
                  </span>
                  <span className={`mt-1 text-[9px] font-semibold opacity-80 ${coverPreview.titleClassName}`}>
                    {PAGE_TEMPLATES.find((t) => t.id === pageTemplateId)?.label ?? "Blank"}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-2.5 bg-white/90 shadow-inner" />
              </div>
            </div>
            <div
              className={`mt-3 h-16 overflow-hidden rounded-lg ring-1 ring-stone-200/50 ${
                customBackgroundAssetId
                  ? "bg-stone-100"
                  : PAGE_TEMPLATES.find((t) => t.id === pageTemplateId)?.paperClass ??
                    "bg-white"
              }`}
            />
            <p className="mt-3 text-xs text-stone-500">
              Paper:{" "}
              <strong>
                {PAGE_TEMPLATES.find((t) => t.id === pageTemplateId)?.label ?? "Blank"}
              </strong>
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-stone-400">
              Opens with pen ready so you can write immediately on phone, laptop, or iPad.
            </p>
          </aside>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-orange-100 bg-white px-5 py-3 sm:px-6 sm:py-4">
          <a
            href="/core"
            data-core-hard-nav="1"
            className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-stone-700 touch-manipulation"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            Cancel
          </a>
          {/* Native form POST — creates notebook even if React taps are dead */}
          <form action="/api/notes/quick-create" method="post" className="inline">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="title" value={title.trim() || "Untitled notebook"} />
            <button
              type="submit"
              className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white touch-manipulation hover:bg-orange-500"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {coverOnly ? "Create & import" : "Start writing"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
