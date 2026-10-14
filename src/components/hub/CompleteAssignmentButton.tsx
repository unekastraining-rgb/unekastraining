"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { ClientIcon } from "@/components/ui/ClientIcon";
import { isAssignmentCompleted } from "@/lib/academic";
import type { AssignmentStatus } from "@/generated/prisma";

/** Compact complete toggle for scheduled assignment rows outside the Assignments panel. */
export function CompleteAssignmentButton({
  assignmentId,
  status,
  title,
  onChanged,
}: {
  assignmentId: string;
  status: string;
  title: string;
  onChanged?: (completed: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const completed = isAssignmentCompleted(status as AssignmentStatus);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !completed;
    onChanged?.(next);
    try {
      await fetch("/api/planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assignmentId, completed: next }),
      });
    } catch {
      onChanged?.(completed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle();
      }}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border touch-manipulation disabled:opacity-60 ${
        completed
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-brand bg-white text-stone-500 hover:bg-brand-soft"
      }`}
      aria-label={
        completed ? `Mark ${title} incomplete` : `Mark ${title} complete`
      }
      title={completed ? "Mark incomplete" : "Mark complete"}
    >
      <ClientIcon icon={CheckCircle2} className="h-4 w-4" />
    </button>
  );
}
