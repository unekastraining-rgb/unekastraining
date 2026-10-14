"use client";

import Link from "next/link";
import { BookOpen, FileText } from "lucide-react";

import type { MaterialSourceCitationView } from "@/lib/learning/material-context";

/**
 * 2P-28 — Accessible source citation strip.
 * Display only — navigation does not create LearningAttempt.
 */
export function MaterialSourceCitation({
  citation,
  compact = false,
}: {
  citation: MaterialSourceCitationView | null | undefined;
  compact?: boolean;
}) {
  if (!citation) return null;

  return (
    <aside
      className={
        compact
          ? "rounded-lg border border-stone-200/80 bg-stone-50/90 px-2.5 py-2"
          : "rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-3"
      }
      data-material-source-citation
      aria-label="Learning material source"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        Based on your material
      </p>
      <p
        className="mt-1 text-sm text-stone-800"
        data-material-provenance
      >
        {citation.provenanceLabel}
      </p>
      {citation.partialNotice ? (
        <p className="mt-1 text-xs text-amber-800" data-material-partial>
          {citation.partialNotice}
        </p>
      ) : null}
      {citation.relatedLabels.length > 0 ? (
        <ul className="mt-2 space-y-0.5 text-xs text-stone-600" data-material-related>
          {citation.relatedLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {citation.openCoreHref ? (
          <Link
            href={citation.openCoreHref}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            data-material-view-source
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Open in CORE
          </Link>
        ) : null}
        {citation.openMaterialHref ? (
          <Link
            href={citation.openMaterialHref}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            data-material-open-list
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            View materials
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
