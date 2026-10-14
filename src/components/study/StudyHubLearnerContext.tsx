"use client";

import { useEffect, useState } from "react";

import { LearnerContextStrip } from "@/components/study/LearnerContextStrip";
import type { LearnerContextPresentation } from "@/lib/learning/universal-learner-context";

/**
 * 2P-29 — Optional Study Hub consumer of Universal Learner Context.
 * Soft-fails; never blocks Hub; never creates evidence.
 */
export function StudyHubLearnerContext({
  conceptId,
  materialId,
}: {
  conceptId?: string | null;
  materialId?: string | null;
}) {
  const [presentation, setPresentation] =
    useState<LearnerContextPresentation | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (conceptId?.trim()) params.set("conceptId", conceptId.trim());
    if (materialId?.trim()) params.set("materialId", materialId.trim());
    const qs = params.toString();
    fetch(`/api/study/learner-context${qs ? `?${qs}` : ""}`)
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as {
          presentation?: LearnerContextPresentation;
        };
        return json.presentation ?? null;
      })
      .then((p) => {
        if (!cancelled) setPresentation(p);
      })
      .catch(() => {
        if (!cancelled) setPresentation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [conceptId, materialId]);

  return <LearnerContextStrip presentation={presentation} />;
}
