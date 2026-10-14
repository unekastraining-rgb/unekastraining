import { notFound } from "next/navigation";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { HubSubpageShell } from "@/components/hub/HubSubpageShell";
import { AdaptiveSequenceRunShell } from "@/components/study/AdaptiveSequenceRunShell";
import { LearnerContextStrip } from "@/components/study/LearnerContextStrip";
import { SchoolContextStrip } from "@/components/study/SchoolContextStrip";
import { db } from "@/lib/db";
import { resolveOwnedAssignmentContext } from "@/lib/learning/school-lms";
import { loadAdaptiveRunPageView } from "@/lib/learning/sequence/adaptive-run-page";
import {
  presentUniversalLearnerContext,
  resolveUniversalLearnerContext,
} from "@/lib/learning/universal-learner-context";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

/**
 * Phase 2G-9/2G-10 — Canonical Adaptive Sequence run URL.
 * Displays persisted state; Complete/Abandon use existing lifecycle APIs.
 */
export default async function AdaptiveSequenceRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{
    notice?: string;
    fromNote?: string;
    materialId?: string;
    assignmentId?: string;
  }>;
}) {
  const { runId } = await params;
  const query = await searchParams;
  const user = await getOrCreateDefaultUser();
  const view = await loadAdaptiveRunPageView(user.id, runId, {
    notice: query.notice ?? null,
    materialId: query.materialId ?? null,
  });

  if (view.kind === "not_found") {
    notFound();
  }

  const fromNoteId =
    typeof query.fromNote === "string" && query.fromNote.trim()
      ? query.fromNote.trim()
      : null;

  // 2P-49 — optional owned assignment school context (display only).
  let schoolAssignment: Awaited<
    ReturnType<typeof resolveOwnedAssignmentContext>
  > = null;
  const assignmentIdRaw =
    typeof query.assignmentId === "string" ? query.assignmentId.trim() : "";
  if (assignmentIdRaw) {
    schoolAssignment = await resolveOwnedAssignmentContext({
      userId: user.id,
      assignmentId: assignmentIdRaw,
    });
  }

  // 2P-29 — optional read-only learner context strip (no evidence).
  let learnerContextPresentation = null as ReturnType<
    typeof presentUniversalLearnerContext
  > | null;
  const ownedRun = await db.adaptiveSequenceRun.findFirst({
    where: { id: runId, userId: user.id },
    select: { conceptId: true },
  });
  if (ownedRun?.conceptId) {
    try {
      const ulc = await resolveUniversalLearnerContext({
        learnerId: user.id,
        conceptId: ownedRun.conceptId,
        materialId: query.materialId ?? null,
        includeMaterial: true,
        includeActiveRun: true,
      });
      learnerContextPresentation = presentUniversalLearnerContext(ulc);
    } catch {
      learnerContextPresentation = null;
    }
  }

  return (
    <HubSubpageShell>
      <HubBackBar title="Adaptive Study" planningActive="study" />
      <div className="space-y-3 px-4 py-6 sm:px-6">
        {schoolAssignment ? (
          <SchoolContextStrip
            title={schoolAssignment.title}
            courseTitle={schoolAssignment.courseTitle}
            dueDate={schoolAssignment.dueDate}
          />
        ) : null}
        <LearnerContextStrip presentation={learnerContextPresentation} />
        <AdaptiveSequenceRunShell view={view} fromNoteId={fromNoteId} />
      </div>
    </HubSubpageShell>
  );
}
