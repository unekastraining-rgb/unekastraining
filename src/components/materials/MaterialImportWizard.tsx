"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Sparkles, Wand2, X } from "lucide-react";

import type { MaterialPreviewPayload } from "@/lib/materials/client";
import {
  getMaterialImportPrefs,
  setMaterialImportPrefs,
  type MaterialImportDestination,
  type MaterialImportMode,
} from "@/lib/materials/import-prefs";

export interface MaterialImportChoice {
  mode: MaterialImportMode;
  destination: MaterialImportDestination;
  targetNoteId: string | null;
  remember: boolean;
}

export function MaterialImportWizard({
  material,
  notes,
  hasActiveWorkbook,
  activeNoteId,
  busy,
  error,
  onCancel,
  onConfirm,
  onRetry,
}: {
  material: MaterialPreviewPayload;
  notes: Array<{ id: string; title: string | null; courseTitle?: string | null }>;
  hasActiveWorkbook: boolean;
  activeNoteId: string | null;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (choice: MaterialImportChoice) => void;
  onRetry?: () => void;
}) {
  const saved = useMemo(() => getMaterialImportPrefs(), []);
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<MaterialImportMode>(saved?.mode ?? "ai");
  const [destination, setDestination] = useState<MaterialImportDestination>(
    saved?.destination && (saved.destination !== "current" || hasActiveWorkbook)
      ? saved.destination
      : "new-workbook",
  );
  const [targetNoteId, setTargetNoteId] = useState<string | null>(
    activeNoteId ?? notes[0]?.id ?? null,
  );
  const [remember, setRemember] = useState(Boolean(saved?.remember));

  useEffect(() => {
    if (targetNoteId && notes.some((note) => note.id === targetNoteId)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setTargetNoteId(activeNoteId ?? notes[0]?.id ?? null);
  }, [notes, activeNoteId, targetNoteId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  const previewSnippet =
    material.previewText?.trim().slice(0, 280) ||
    (material.hasFile
      ? "File attached — you can annotate it in Core."
      : material.url
        ? "External link material."
        : "No preview text yet.");

  function confirm() {
    const choice: MaterialImportChoice = {
      mode,
      destination,
      targetNoteId:
        destination === "new-workbook"
          ? null
          : destination === "current"
            ? activeNoteId
            : targetNoteId,
      remember,
    };
    setMaterialImportPrefs({
      mode: choice.mode,
      destination: choice.destination,
      remember: choice.remember,
    });
    onConfirm(choice);
  }

  const canContinueStep2 =
    destination === "new-workbook" ||
    (destination === "current" && Boolean(activeNoteId)) ||
    (destination === "new-page" && Boolean(targetNoteId || activeNoteId));

  return (
    <div
      data-core-import-loading
      className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <a
        href="/core"
        data-core-hard-nav="1"
        aria-label="Close import"
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]"
        style={{ WebkitTapHighlightColor: "transparent" }}
        onClick={(event) => {
          if (busy) {
            event.preventDefault();
            return;
          }
          onCancel();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="material-import-title"
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-orange-100 bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-orange-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Import into Core · Step {step} of 2
            </p>
            <h2 id="material-import-title" className="truncate text-lg font-bold text-stone-900">
              {material.title}
            </h2>
            <p className="text-xs text-stone-500">
              {material.courseTitle} · {material.type.replaceAll("_", " ")}
            </p>
          </div>
          <a
            href="/core"
            data-core-hard-nav="1"
            aria-label="Cancel import"
            className="rounded-xl border border-stone-200 p-2 text-stone-500 hover:bg-stone-50"
            style={{ WebkitTapHighlightColor: "transparent" }}
            onClick={(event) => {
              if (busy) {
                event.preventDefault();
                return;
              }
              onCancel();
            }}
          >
            <X className="h-4 w-4" />
          </a>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
              <p className="text-xs leading-relaxed text-stone-600">{previewSnippet}</p>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-stone-800">How do you want to import?</p>
              <ChoiceCard
                selected={mode === "raw"}
                icon={<Wand2 className="h-4 w-4" />}
                title="Without AI"
                description="Paste text and/or open the file for annotating — no auto formatting."
                onClick={() => setMode("raw")}
              />
              <ChoiceCard
                selected={mode === "ai"}
                icon={<Sparkles className="h-4 w-4" />}
                title="With AI"
                description="Extract key ideas, apply study formats. Q&A becomes flashcards in Study / Locker."
                hint="Needs an AI API key in env · may take ~10–20s"
                onClick={() => setMode("ai")}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-stone-800">Where should it go?</p>
              <ChoiceCard
                selected={destination === "new-workbook"}
                title="New workbook"
                description="Open the new-notebook setup menu first, then place the import."
                onClick={() => setDestination("new-workbook")}
              />
              <ChoiceCard
                selected={destination === "new-page"}
                title="Add as new page"
                description="Create a new page in one of your Core notebooks, then place the import there."
                onClick={() => setDestination("new-page")}
              />
              <ChoiceCard
                selected={destination === "current"}
                title="Current canvas / sheet"
                description={
                  hasActiveWorkbook
                    ? "Place onto the page you’re already working on."
                    : "Open a workbook in Core first to use this option."
                }
                disabled={!hasActiveWorkbook}
                onClick={() => hasActiveWorkbook && setDestination("current")}
              />

              {destination === "new-page" ? (
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Target workbook
                  </span>
                  <select
                    value={targetNoteId ?? ""}
                    onChange={(event) => setTargetNoteId(event.target.value || null)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800"
                  >
                    {notes.length === 0 ? (
                      <option value="">No Core notebooks yet — use New workbook</option>
                    ) : (
                      notes.map((note) => {
                        const name = note.title?.trim() || "Untitled notebook";
                        const course = note.courseTitle?.trim();
                        const open = note.id === activeNoteId ? " · open" : "";
                        return (
                          <option key={note.id} value={note.id}>
                            {course ? `${name} (${course})${open}` : `${name}${open}`}
                          </option>
                        );
                      })
                    )}
                  </select>
                </label>
              ) : null}
            </div>
          )}

          {error ? (
            <div className="space-y-2 rounded-xl border border-red-100 bg-red-50 px-3 py-3">
              <p className="text-xs text-red-700">{error}</p>
              {onRetry ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onRetry}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? "Trying again…" : "Try again"}
                </button>
              ) : null}
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="rounded border-stone-300"
            />
            Remember these choices next time
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-orange-100 px-5 py-4">
          {step === 1 ? (
            <a
              href="/core"
              data-core-hard-nav="1"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
              style={{ WebkitTapHighlightColor: "transparent" }}
              onClick={(event) => {
                if (busy) {
                  event.preventDefault();
                  return;
                }
                onCancel();
              }}
            >
              Cancel
            </a>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStep(1)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            >
              Back
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStep(2)}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !canContinueStep2}
              onClick={confirm}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {busy
                ? mode === "ai"
                  ? "Working with AI…"
                  : "Importing…"
                : destination === "new-workbook"
                  ? mode === "ai"
                    ? "Analyze & choose cover"
                    : "Continue to cover"
                  : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChoiceCard({
  selected,
  title,
  description,
  hint,
  icon,
  disabled,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  hint?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
        selected
          ? "border-teal-300 bg-teal-50/70 ring-1 ring-teal-200"
          : "border-stone-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-stone-900">
        {icon}
        {title}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-stone-600">{description}</span>
      {hint ? <span className="mt-1 block text-[10px] font-medium text-stone-400">{hint}</span> : null}
    </button>
  );
}
