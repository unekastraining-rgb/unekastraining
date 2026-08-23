"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";

import type { NoteMethod } from "@/generated/prisma";
import { ColorPicker } from "@/components/customization/ColorPicker";
import { PaletteLibrary } from "@/components/customization/PaletteLibrary";
import { TemplateLibrary } from "@/components/customization/TemplateLibrary";
import {
  NOTEBOOK_COVERS,
  PAGE_TEMPLATES,
  PEN_PRESETS,
  WHITEBOARD_STARTERS,
  resolveNotebookCoverStyle,
  type NotebookCoverId,
  type PageTemplateId,
  type PenPresetId,
} from "@/lib/core/page-templates";
import { DEFAULT_NOTEBOOK_COVER_COLOR } from "@/lib/customization/study-haul-defaults";

export interface NotebookSetupConfig {
  coverId: NotebookCoverId;
  customCoverColor?: string | null;
  showCover?: boolean;
  pageTemplateId: PageTemplateId;
  customBackgroundAssetId?: string | null;
  penPresetId: PenPresetId;
  mode: "notes" | "whiteboard";
  method: NoteMethod;
  whiteboardStarterId: string;
  title: string;
}

export function NotebookSetupWizard({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (config: NotebookSetupConfig) => void;
}) {
  const [step, setStep] = useState(0);
  const [coverId, setCoverId] = useState<NotebookCoverId>("classic_orange");
  const [customCoverColor, setCustomCoverColor] = useState<string | null>(
    DEFAULT_NOTEBOOK_COVER_COLOR,
  );
  const [showCover, setShowCover] = useState(true);
  const [pageTemplateId, setPageTemplateId] = useState<PageTemplateId>("blank");
  const [customBackgroundAssetId, setCustomBackgroundAssetId] = useState<string | null>(null);
  const [penPresetId, setPenPresetId] = useState<PenPresetId>("ballpoint");
  const [mode, setMode] = useState<"notes" | "whiteboard">("notes");
  const [whiteboardStarterId, setWhiteboardStarterId] = useState("plain");
  const [title, setTitle] = useState("Untitled notebook");

  if (!open) return null;

  const template = PAGE_TEMPLATES.find((item) => item.id === pageTemplateId);
  const method =
    mode === "whiteboard"
      ? ("WHITEBOARD" as NoteMethod)
      : ((template?.noteMethod ?? "BLANK") as NoteMethod);

  const coverPreview = resolveNotebookCoverStyle({
    coverId,
    customCoverColor: customCoverColor ?? DEFAULT_NOTEBOOK_COVER_COLOR,
  });

  function finish() {
    onComplete({
      coverId,
      customCoverColor,
      showCover,
      pageTemplateId,
      customBackgroundAssetId,
      penPresetId,
      mode,
      method,
      whiteboardStarterId,
      title: title.trim() || "Untitled notebook",
    });
    setStep(0);
  }

  const steps = ["Cover", "Paper & import", "Details"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-[#fff8f1] shadow-2xl ring-1 ring-orange-100">
        <div className="flex items-center justify-between border-b border-orange-100 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
              New notebook · Step {step + 1} of {steps.length}
            </p>
            <h2 className="text-2xl font-black text-stone-900">{steps[step]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_220px]">
          <div className="overflow-y-auto px-6 py-5">
            {step === 0 ? (
              <div className="space-y-5">
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={showCover}
                    onChange={(e) => setShowCover(e.target.checked)}
                    className="rounded border-orange-300"
                  />
                  Include a notebook cover (you can turn this off for a plain page)
                </label>

                {showCover ? (
                  <>
                    <div className="rounded-2xl border border-orange-100 bg-white p-4">
                      <p className="mb-2 text-sm font-semibold text-stone-800">
                        Pick any cover color
                      </p>
                      <ColorPicker
                        value={customCoverColor ?? DEFAULT_NOTEBOOK_COVER_COLOR}
                        onChange={setCustomCoverColor}
                        label="Cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-700">Or start from a preset</p>
                      <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {NOTEBOOK_COVERS.map((cover) => (
                          <button
                            key={cover.id}
                            type="button"
                            onClick={() => {
                              setCustomCoverColor(null);
                              setCoverId(cover.id);
                            }}
                            className={`rounded-2xl border p-2 text-left transition ${
                              !customCoverColor && coverId === cover.id
                                ? "border-stone-900 ring-2 ring-stone-900"
                                : "border-orange-100 bg-white hover:border-orange-200"
                            }`}
                          >
                            <div className={`mb-2 h-16 rounded-xl bg-gradient-to-br ${cover.gradient}`} />
                            <p className="text-xs font-semibold text-stone-800">{cover.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-stone-600">
                    No cover — you&apos;ll get a clean page without the colored header bar.
                  </p>
                )}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border border-dashed border-orange-200 bg-white p-4">
                  <Upload className="mt-0.5 h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-semibold text-stone-900">Import your own paper</p>
                    <p className="text-sm text-stone-600">
                      Upload PNG, JPG, or PDF templates — planners, dot grids, decorative pages,
                      anything you use in Goodnotes.
                    </p>
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
                <div className="rounded-2xl border border-orange-100 bg-white p-4">
                  <p className="text-sm font-semibold text-stone-800">Color palettes</p>
                  <p className="text-xs text-stone-500">
                    Browse warm Study Haul palettes or save your own — not limited to presets.
                  </p>
                  <div className="mt-3 max-h-56 overflow-y-auto">
                    <PaletteLibrary />
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <label className="block text-sm">
                  <span className="font-semibold text-stone-700">Notebook title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. PSYC 101 Notes, Weekly Planner…"
                    className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2"
                  />
                </label>

                <div>
                  <p className="text-sm font-semibold text-stone-700">Notebook type</p>
                  <div className="mt-2 flex gap-2">
                    {(
                      [
                        { id: "notes", label: "Notes", hint: "Type, text boxes, sketch" },
                        { id: "whiteboard", label: "Whiteboard", hint: "Infinite canvas" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMode(item.id)}
                        className={`flex-1 rounded-2xl border px-4 py-3 text-left ${
                          mode === item.id
                            ? "border-orange-500 bg-orange-50"
                            : "border-orange-100 bg-white"
                        }`}
                      >
                        <p className="font-semibold text-stone-900">{item.label}</p>
                        <p className="text-xs text-stone-500">{item.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {mode === "whiteboard" ? (
                  <div>
                    <p className="text-sm font-semibold text-stone-700">Starter layout</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {WHITEBOARD_STARTERS.map((starter) => (
                        <button
                          key={starter.id}
                          type="button"
                          onClick={() => setWhiteboardStarterId(starter.id)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                            whiteboardStarterId === starter.id
                              ? "bg-orange-600 text-white"
                              : "bg-white text-stone-700 ring-1 ring-orange-100"
                          }`}
                        >
                          {starter.emoji} {starter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-stone-700">Default pen</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PEN_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setPenPresetId(preset.id)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                            penPresetId === preset.id
                              ? "bg-stone-900 text-white"
                              : "bg-white text-stone-700 ring-1 ring-orange-100"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <aside className="hidden border-l border-orange-100 bg-white/80 p-4 md:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Preview</p>
            <div className="mt-3 overflow-hidden rounded-xl shadow-md ring-1 ring-stone-200/60">
              {showCover ? (
                <>
                  <div
                    className={`h-14 flex items-end px-3 pb-2 ${coverPreview.className ?? ""}`}
                    style={coverPreview.style}
                  >
                    <span className="text-xs font-bold text-white drop-shadow">{title}</span>
                  </div>
                  <div
                    className={`h-40 ${
                      customBackgroundAssetId
                        ? "bg-stone-100"
                        : PAGE_TEMPLATES.find((t) => t.id === pageTemplateId)?.paperClass ?? "bg-white"
                    }`}
                  />
                </>
              ) : (
                <div
                  className={`h-52 ${
                    PAGE_TEMPLATES.find((t) => t.id === pageTemplateId)?.paperClass ?? "bg-white"
                  }`}
                />
              )}
            </div>
            <p className="mt-3 text-xs text-stone-500">
              Template:{" "}
              <strong>{PAGE_TEMPLATES.find((t) => t.id === pageTemplateId)?.label ?? "Blank"}</strong>
            </p>
          </aside>
        </div>

        <div className="flex items-center justify-between border-t border-orange-100 bg-white px-6 py-4">
          <div className="flex gap-1">
            {steps.map((label, index) => (
              <span
                key={label}
                className={`h-1.5 w-10 rounded-full ${
                  index <= step ? "bg-orange-500" : "bg-orange-100"
                }`}
                title={label}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((value) => value - 1)}
                className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold"
              >
                Back
              </button>
            ) : null}
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((value) => value + 1)}
                className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white"
              >
                Create notebook
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
