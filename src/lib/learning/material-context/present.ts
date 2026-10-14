/**
 * 2P-28 — Presentational helpers for material source context.
 */

import type { LearningMaterialContext } from "./types";

export type MaterialSourceCitationView = {
  provenanceLabel: string;
  title: string;
  materialId: string;
  courseId: string | null;
  noteId: string | null;
  partial: boolean;
  partialNotice: string | null;
  openMaterialHref: string | null;
  openCoreHref: string | null;
  relatedLabels: string[];
};

export function presentMaterialSourceCitation(
  context: LearningMaterialContext | null | undefined,
): MaterialSourceCitationView | null {
  if (!context?.materialId || !context.provenance?.label) return null;

  const courseId = context.courseId?.trim() || null;
  const noteId = context.noteId?.trim() || null;
  const materialId = context.materialId;

  const openMaterialHref = `/materials`;
  let openCoreHref: string | null = null;
  if (courseId) {
    const params = new URLSearchParams();
    params.set("courseId", courseId);
    params.set("materialId", materialId);
    if (noteId) params.set("noteId", noteId);
    openCoreHref = `/core?${params.toString()}`;
  }

  return {
    provenanceLabel: context.provenance.label,
    title: context.title,
    materialId,
    courseId,
    noteId,
    partial: Boolean(context.partial),
    partialNotice: context.partial
      ? "Some content from this material may be incomplete — use only what was extracted."
      : null,
    openMaterialHref,
    openCoreHref,
    relatedLabels: (context.relatedSources ?? []).map((s) => s.provenanceLabel),
  };
}

/** Append source line to Orchestrator why-copy without changing diagnosis. */
export function appendSourceToWhyThisActivity(
  why: string | null,
  context: LearningMaterialContext | null | undefined,
): string | null {
  if (!why?.trim()) {
    if (context?.provenance.label) {
      return `Practice connected to ${context.provenance.label.replace(/^Source:\s*/i, "")}.`;
    }
    return null;
  }
  if (!context?.provenance.label) return why;
  return `${why.trim()}\n\n${context.provenance.label}`;
}

/** Append materialId to Adaptive / activity URLs when owned context exists. */
export function withMaterialIdQuery(
  href: string,
  materialId: string | null | undefined,
): string {
  const id = materialId?.trim();
  if (!id || !href) return href;
  try {
    const url = new URL(href, "http://local.invalid");
    if (!url.searchParams.has("materialId")) {
      url.searchParams.set("materialId", id);
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}
