"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Sparkles,
  Wand2,
} from "lucide-react";

import {
  CORE_FORMAT_CATALOG,
  formatsByCategory,
  getFormatDefinition,
  type CoreFormatId,
} from "@/lib/core/format-catalog";
import type { FormatRecommendation } from "@/lib/core/note-types";

export function CoreAdaptivePanel({
  courseId,
  materialId,
  sourcePreview,
  activeFormat,
  activeSections = [],
  recommendations,
  onRecommendations,
  onApplyFormat,
  onAddFormats,
  onApplyAllRecommendations,
  onStartBlank,
  onAnalyze,
}: {
  courseId: string;
  materialId: string | null;
  sourcePreview?: string;
  activeFormat: CoreFormatId;
  activeSections?: CoreFormatId[];
  recommendations: FormatRecommendation[];
  onRecommendations: (items: FormatRecommendation[], meta?: { summary?: string; workspacePlan?: string }) => void;
  onApplyFormat: (formatId: CoreFormatId, combo?: CoreFormatId[]) => void;
  onAddFormats: (formatIds: CoreFormatId[]) => void;
  onApplyAllRecommendations?: () => void;
  onStartBlank: () => void;
  onAnalyze: () => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<Set<CoreFormatId>>(new Set());
  const [workspacePlan, setWorkspacePlan] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [guide, setGuide] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/core/adaptive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          courseId: courseId || undefined,
          materialId: materialId || undefined,
          sourceText: sourcePreview,
          useAi: true,
        }),
      });
      const data = await response.json();
      if (data.success) {
        onRecommendations(data.recommendations ?? [], {
          summary: data.summary,
          workspacePlan: data.workspacePlan,
        });
        setSummary(data.summary ?? null);
        setWorkspacePlan(data.workspacePlan ?? null);
        setGuide(data.guide ?? []);
        setExpanded(true);
        setDismissed(false);
        onAnalyze();
      }
    } finally {
      setAnalyzing(false);
    }
  }, [courseId, materialId, onAnalyze, onRecommendations, sourcePreview]);

  useEffect(() => {
    if (recommendations.length > 0 || dismissed) return;
    if (courseId || materialId || sourcePreview) {
      void runAnalysis();
    }
  }, [courseId, materialId, sourcePreview, recommendations.length, dismissed, runAnalysis]);

  const grouped = formatsByCategory();
  const activeOnPage = new Set(activeSections);

  function toggleFormat(formatId: CoreFormatId) {
    setSelectedFormats((current) => {
      const next = new Set(current);
      if (next.has(formatId)) next.delete(formatId);
      else next.add(formatId);
      return next;
    });
  }

  function addSelectedFormats() {
    if (selectedFormats.size === 0) return;
    onAddFormats(Array.from(selectedFormats));
    setSelectedFormats(new Set());
  }

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-teal-200 bg-teal-50/50 px-3 py-2 text-xs font-semibold text-teal-800"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Show CORE adaptive guide
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/80 to-white shadow-sm">
      <div className="flex items-start justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
            <Sparkles className="h-3.5 w-3.5" />
            CORE adaptive workspace
          </p>
          <p className="mt-0.5 text-sm text-stone-600">
            {summary ??
              "One page, many blocks — paragraph, mind map, chart, and images share the same canvas. Drag blocks to arrange them."}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={analyzing}
            className="rounded-lg border border-teal-200 bg-white p-2 text-teal-700 hover:bg-teal-50 disabled:opacity-50"
            aria-label="Re-analyze"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t border-teal-100 px-4 py-3">
          {activeOnPage.size > 0 ? (
            <p className="rounded-xl bg-white/80 px-3 py-2 text-xs text-stone-700 ring-1 ring-teal-100">
              <strong>On this page:</strong>{" "}
              {Array.from(activeOnPage)
                .map((id) => getFormatDefinition(id).label)
                .join(" · ")}
            </p>
          ) : null}

          {workspacePlan ? (
            <p className="rounded-xl bg-white/80 px-3 py-2 text-xs text-stone-700 ring-1 ring-teal-100">
              <strong>Plan:</strong> {workspacePlan}
            </p>
          ) : null}

          {recommendations.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold text-stone-800">Recommended for this material</p>
              <ul className="space-y-2">
                {recommendations.map((item) => {
                  const def = getFormatDefinition(item.formatId);
                  const companions = def.companions ?? [];
                  const onPage = activeOnPage.has(item.formatId);
                  return (
                    <li
                      key={item.formatId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-100 bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900">
                          {def.emoji} {def.label}
                          {item.aiSuggested ? (
                            <span className="ml-2 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                              AI
                            </span>
                          ) : null}
                          {onPage ? (
                            <span className="ml-2 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                              On page
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-stone-500">{item.reason}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onApplyFormat(item.formatId, companions)}
                        className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500"
                      >
                        {onPage ? "Add again" : "Add to page"}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => {
                  if (onApplyAllRecommendations) {
                    onApplyAllRecommendations();
                  } else {
                    onAddFormats(recommendations.map((r) => r.formatId));
                  }
                }}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow hover:brightness-105"
              >
                Add all recommendations ({recommendations.length} blocks)
              </button>
            </div>
          ) : analyzing ? (
            <p className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing material…
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onStartBlank}
              className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Start blank
            </button>
            <button
              type="button"
              onClick={() => setShowAllFormats((value) => !value)}
              className="rounded-xl border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50"
            >
              {showAllFormats ? "Hide formats" : "Pick formats"}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700"
            >
              Dismiss
            </button>
          </div>

          {showAllFormats ? (
            <div className="space-y-3 rounded-xl border border-orange-100 bg-orange-50/30 p-3">
              <p className="text-xs text-stone-600">
                Select multiple formats, then add them as draggable blocks on the same page — like
                Goodnotes. Use Tools for photos and canvas starters for sticky layouts.
              </p>
              {(
                Object.entries(grouped) as Array<
                  [keyof ReturnType<typeof formatsByCategory>, typeof CORE_FORMAT_CATALOG]
                >
              ).map(([category, formats]) =>
                formats.length ? (
                  <div key={category}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      {category}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {formats.map((format) => {
                        const selected = selectedFormats.has(format.id);
                        const onPage = activeOnPage.has(format.id);
                        return (
                          <button
                            key={format.id}
                            type="button"
                            onClick={() => toggleFormat(format.id)}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                              selected
                                ? "bg-teal-600 text-white ring-2 ring-teal-300"
                                : onPage
                                  ? "bg-white text-teal-800 ring-1 ring-teal-300"
                                  : "bg-white text-stone-600 ring-1 ring-orange-100 hover:ring-teal-200"
                            }`}
                          >
                            {format.emoji} {format.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null,
              )}
              <button
                type="button"
                disabled={selectedFormats.size === 0}
                onClick={addSelectedFormats}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add to canvas ({selectedFormats.size})
              </button>
            </div>
          ) : null}

          <FormatGuide formatId={activeFormat} extraSteps={guide} />
        </div>
      ) : null}
    </section>
  );
}

function FormatGuide({
  formatId,
  extraSteps,
}: {
  formatId: CoreFormatId;
  extraSteps: string[];
}) {
  const def = getFormatDefinition(formatId);
  const steps = [...def.guideSteps, ...extraSteps].slice(0, 5);

  return (
    <div className="rounded-xl border border-dashed border-teal-200 bg-white/60 px-3 py-2">
      <p className="text-xs font-bold text-teal-800">
        How to use {def.emoji} {def.label}
      </p>
      <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-stone-600">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
