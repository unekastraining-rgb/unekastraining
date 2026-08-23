"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard } from "lucide-react";

import { CalendarAiScheduling } from "@/components/calendar/CalendarAiScheduling";
import { useFocusParam } from "@/hooks/useFocusParam";

import { CourseFilterBar } from "./calendar/CourseFilterBar";
import { HubAssignmentsPanel } from "./HubAssignmentsPanel";
import { HubInsightsPanel } from "./HubInsightsPanel";
import type { HubAssignment, HubCourse } from "./types";
import type { AttentionItem } from "@/lib/csl/attention";
import type { ProgressSnapshot } from "@/lib/csl/progress";
import type { HubTelemetrySnapshot } from "@/lib/csl/study-sessions";

export function AssignmentsTab({
  courses,
  assignments,
  attention,
  progress,
  telemetry,
  onChanged,
}: {
  courses: HubCourse[];
  assignments: HubAssignment[];
  attention: AttentionItem[];
  progress: ProgressSnapshot;
  telemetry: HubTelemetrySnapshot;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const { focusId } = useFocusParam();
  const [courseFilterId, setCourseFilterId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Planner
          </p>
          <h1 className="text-3xl font-black text-stone-900">Assignments</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Everything due across your classes — add tasks, check them off, and
            filter by course.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-brand bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
        >
          <LayoutDashboard className="h-4 w-4 text-brand" />
          Back to hub
        </Link>
      </div>

      <CourseFilterBar
        courses={courses}
        selectedCourseId={courseFilterId}
        onChange={setCourseFilterId}
      />

      <HubAssignmentsPanel
        assignments={assignments}
        courses={courses}
        courseFilterId={courseFilterId}
        focusAssignmentId={focusId}
        onSelectAssignment={() => {}}
        onChanged={() => {
          router.refresh();
          onChanged?.();
        }}
        expanded
      />

      <HubInsightsPanel attention={attention} progress={progress} telemetry={telemetry} />

      <CalendarAiScheduling
        compact
        onApproved={() => {
          router.refresh();
          onChanged?.();
        }}
      />
    </div>
  );
}
