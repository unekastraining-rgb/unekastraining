/**
 * Phase 14 — Infer item type + urgency helpers for academic normalization.
 */

import type { AcademicItemType } from "@/lib/learning/academic/types";
import { computePriority } from "@/lib/academic";

export function inferAcademicItemType(
  title: string,
  kindHint?: string | null,
): AcademicItemType {
  const kind = (kindHint ?? "").toUpperCase();
  const t = title.toLowerCase();
  if (kind.includes("QUIZ") || /\bquiz\b/.test(t)) return "quiz";
  if (kind.includes("EXAM") || kind.includes("TEST") || /\b(exam|midterm|final)\b/.test(t)) {
    return "exam";
  }
  if (kind.includes("DISCUSSION") || /\bdiscussion\b/.test(t)) return "discussion";
  if (kind.includes("PROJECT") || /\b(project|essay|paper)\b/.test(t)) return "project";
  if (kind.includes("READING") || /\b(reading|chapter)\b/.test(t)) return "reading";
  if (kind.includes("ASSIGNMENT") || kind) return "assignment";
  return "other";
}

export function urgencyFromDueAt(
  dueAt: Date | null | undefined,
): "low" | "medium" | "high" {
  const p = computePriority(dueAt ?? null);
  if (p === "HIGH") return "high";
  if (p === "MEDIUM") return "medium";
  return "low";
}
