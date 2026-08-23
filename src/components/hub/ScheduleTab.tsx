"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, Loader2, Plus } from "lucide-react";

import { useFocusParam } from "@/hooks/useFocusParam";

import { AiCourseBuilder } from "@/components/courses/AiCourseBuilder";
import { StudyAnythingCard } from "@/components/study/StudyAnythingCard";
import { CalendarAiScheduling } from "@/components/calendar/CalendarAiScheduling";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { RecurrenceScopeDialog } from "@/components/calendar/RecurrenceScopeDialog";
import { filterEventsByQuickView } from "@/lib/calendar/events";
import { buildCalendarHref } from "@/lib/calendar/links";
import { parseUnifiedCalendarId } from "@/lib/calendar/hub-adapters";
import {
  deleteHubEvent,
  toggleHubEventComplete,
  updateHubEvent,
} from "@/lib/calendar/hub-event-actions";
import type { QuickViewMode } from "@/lib/calendar/types";
import { localDateKey } from "@/lib/calendar/types";
import { confirmDelete } from "@/lib/confirm-delete";
import { useTheme } from "@/lib/theme/ThemeProvider";

import { HubAssignmentsPanel } from "./HubAssignmentsPanel";
import { HubMonthCalendar } from "./calendar/HubMonthCalendar";
import { WeekTimeGrid } from "./calendar/WeekTimeGrid";
import { HubInsightsPanel } from "./HubInsightsPanel";
import { HubStudyNowCard } from "./HubStudyNowCard";
import { ClassMeetingsModal } from "./ClassMeetingsModal";
import { FirstRunOnboarding } from "./FirstRunOnboarding";
import type { HubAssignment, HubCourse, HubGradeSchoolPlan, HubMeeting } from "./types";
import type { AttentionItem } from "@/lib/csl/attention";
import type { ProgressSnapshot } from "@/lib/csl/progress";
import type { HubTelemetrySnapshot } from "@/lib/csl/study-sessions";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { RecurrenceEditScope } from "@/lib/calendar/recurrence";
import type { CalendarEventInput, WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";
import { WeekStrip } from "./WeekStrip";
import { QuickViewBar } from "./calendar/QuickViewBar";
import { CourseFilterBar } from "./calendar/CourseFilterBar";
import { ScheduleDetailPanel } from "./calendar/ScheduleDetailPanel";
import { GradeSchoolLearningPlan } from "@/components/grade-school/GradeSchoolLearningPlan";
import { ElementaryPlanner } from "./elementary/ElementaryPlanner";
import { ElementaryTodaySchedule } from "./elementary/ElementaryTodaySchedule";
import { useHubCalendar } from "./useHubCalendar";

export function ScheduleTab({
  courses,
  assignments,
  meetings,
  selectedDate,
  onSelectDate,
  attention,
  progress,
  telemetry,
  onScheduleChanged,
  assignmentsOnly = false,
  gradeSchoolPlans = [],
}: {
  courses: HubCourse[];
  assignments: HubAssignment[];
  meetings: HubMeeting[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  attention: AttentionItem[];
  progress: ProgressSnapshot;
  telemetry: HubTelemetrySnapshot;
  onScheduleChanged?: () => void;
  assignmentsOnly?: boolean;
  gradeSchoolPlans?: HubGradeSchoolPlan[];
}) {
  const router = useRouter();
  const { settings } = useTheme();
  const { focusId, focusClass } = useFocusParam();
  const { events: allEvents, items, loading, error, refresh, moveEvent } =
    useHubCalendar(selectedDate);
  const [quickView, setQuickView] = useState<QuickViewMode>(
    settings.elementaryMode ? "today" : settings.defaultQuickView,
  );
  const [courseFilterId, setCourseFilterId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [calendarMode, setCalendarMode] = useState<"week-grid" | "month">(
    "week-grid",
  );
  const [deleteScopeOpen, setDeleteScopeOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<WorkspaceCalendarItem | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitial, setCreateInitial] = useState<
    Parameters<typeof EventFormModal>[0]["initial"]
  >();
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<
    Parameters<typeof EventFormModal>[0]["initial"]
  >();
  const [scheduleCourse, setScheduleCourse] = useState<HubCourse | null>(null);

  const courseScopedEvents = useMemo(() => {
    if (!courseFilterId) return allEvents;
    return allEvents.filter((event) => event.courseId === courseFilterId);
  }, [allEvents, courseFilterId]);

  const courseScopedItems = useMemo(() => {
    if (!courseFilterId) return items;
    return items.filter((item) => item.courseId === courseFilterId);
  }, [items, courseFilterId]);

  const scopedCourse = useMemo(
    () => courses.find((course) => course.id === courseFilterId) ?? null,
    [courses, courseFilterId],
  );

  const studyNowProps = {
    courseId: courseFilterId,
    courseTitle: scopedCourse?.title ?? null,
  };

  const todayEvents = useMemo(
    () => filterEventsByQuickView(allEvents, "today", selectedDate),
    [allEvents, selectedDate],
  );

  const filteredEvents = useMemo(
    () => filterEventsByQuickView(courseScopedEvents, quickView, selectedDate),
    [courseScopedEvents, quickView, selectedDate],
  );

  const eventDays = useMemo(() => {
    const days = new Set<string>();
    for (const event of allEvents) days.add(event.date);
    return days;
  }, [allEvents]);

  const editableEventIds = useMemo(
    () => new Set(items.filter((item) => item.editable).map((item) => item.id)),
    [items],
  );

  useEffect(() => {
    if (!focusId) return;

    const match = allEvents.find((event) => {
      const ref = parseUnifiedCalendarId(event.id);
      return (
        ref?.sourceId === focusId ||
        event.id === focusId ||
        event.id === `asg-${focusId}` ||
        event.id === `evt-${focusId}`
      );
    });

    if (match) {
      setSelectedEventId(match.id);
      const todayKey = localDateKey(new Date());
      setQuickView(match.date === todayKey ? "today" : "week");
    }
  }, [focusId, allEvents]);

  function selectAssignment(assignmentId: string) {
    const eventId = `asg-${assignmentId}`;
    const match = allEvents.find(
      (event) => event.id === eventId || event.id === `assignment-${assignmentId}`,
    );

    if (match) {
      setSelectedEventId(match.id);
      const todayKey = localDateKey(new Date());
      setQuickView(match.date === todayKey ? "today" : "week");
      if (match.date) {
        onSelectDate(new Date(`${match.date}T12:00:00`));
      }
    }
  }

  async function handleAssignmentsChanged() {
    await refresh();
    router.refresh();
    onScheduleChanged?.();
  }

  const quickViewLabel =
    quickView === "today"
      ? "Today"
      : quickView === "week"
        ? "This week"
        : "Due soon";

  async function handleEventMove(
    id: string,
    startAt: string,
    endAt: string | null,
  ) {
    const success = await moveEvent(id, startAt, endAt);
    if (success) {
      await refresh();
      router.refresh();
    }
  }

  async function handleEventResize(
    id: string,
    startAt: string,
    endAt: string,
  ) {
    await handleEventMove(id, startAt, endAt);
  }

  async function handleProposalApproved() {
    await refresh();
    router.refresh();
  }

  function openCreateEvent(date: Date, hour?: number) {
    const start = new Date(date);
    if (hour !== undefined) {
      start.setHours(hour, 0, 0, 0);
    } else {
      start.setHours(9, 0, 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setCreateInitial({
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      allDay: hour === undefined,
    });
    setCreateOpen(true);
  }

  async function handleCreateEvent(input: CalendarEventInput) {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error ?? "Failed to create event");
    }
    await refresh();
    router.refresh();
  }

  function openEditEvent(event: CalendarEvent) {
    const item = items.find((entry) => entry.id === event.id);
    if (!item?.editable) return;
    setEditInitial({ ...item, id: item.id });
    setEditOpen(true);
  }

  async function handleUpdateEvent(input: CalendarEventInput) {
    const item = items.find((entry) => entry.id === editInitial?.id);
    if (!item) throw new Error("Event not found");

    const success = await updateHubEvent(item, input);
    if (!success) throw new Error("Failed to update event");

    await refresh();
    router.refresh();
  }

  const workspaceCourses = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        title: course.title,
        color: course.color,
      })),
    [courses],
  );

  async function handleToggleComplete(event: CalendarEvent, completed: boolean) {
    const success = await toggleHubEventComplete(event.id, completed);
    if (success) {
      await refresh();
      router.refresh();
    }
  }

  async function handleDelete(event: CalendarEvent) {
    const item = items.find((entry) => entry.id === event.id);
    if (item?.isRecurrenceOccurrence) {
      setPendingDelete(item);
      setDeleteScopeOpen(true);
      return;
    }

    if (!confirmDelete(event.title)) return;
    const success = await deleteHubEvent(event.id);
    if (success) {
      setSelectedEventId(null);
      await refresh();
      router.refresh();
    }
  }

  async function confirmScopedDelete(scope: RecurrenceEditScope) {
    if (!pendingDelete) return;
    if (!confirmDelete(pendingDelete.title)) {
      setDeleteScopeOpen(false);
      setPendingDelete(null);
      return;
    }

    const success = await deleteHubEvent(pendingDelete.id, {
      editScope: scope,
      occurrenceAt: pendingDelete.occurrenceAt,
    });
    if (success) {
      setSelectedEventId(null);
      await refresh();
      router.refresh();
    }

    setDeleteScopeOpen(false);
    setPendingDelete(null);
  }

  function openClassSchedule(event: CalendarEvent) {
    const course = courses.find((entry) => entry.id === event.courseId);
    if (course) setScheduleCourse(course);
  }

  const schedulePanelProps = {
    onToggleComplete: handleToggleComplete,
    onDelete: handleDelete,
    onEdit: openEditEvent,
    editableEventIds,
    onManageClassSchedule: openClassSchedule,
    focusClass,
  };

  if (assignmentsOnly) {
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
            <CalendarDays className="h-4 w-4 text-brand" />
            Back to hub schedule
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
          onSelectAssignment={selectAssignment}
          onChanged={() => void handleAssignmentsChanged()}
          expanded
        />

        <HubInsightsPanel attention={attention} progress={progress} telemetry={telemetry} />

        <CalendarAiScheduling compact onApproved={handleProposalApproved} />
      </div>
    );
  }

  if (settings.elementaryMode) {
    return (
      <div className="space-y-6">
        <HubStudyNowCard {...studyNowProps} />

        <GradeSchoolLearningPlan plans={gradeSchoolPlans} />

        <AiCourseBuilder
          onSaved={() => router.refresh()}
          onError={() => {}}
        />

        <ElementaryTodaySchedule
          events={todayEvents}
          loading={loading}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
        />

        {selectedEventId ? (
          <ScheduleDetailPanel
            events={todayEvents}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            quickViewLabel="Today"
            {...schedulePanelProps}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <QuickViewBar active={quickView} onChange={setQuickView} />
          <Link
            href={buildCalendarHref({ date: localDateKey(selectedDate), view: "week" })}
            className="inline-flex items-center gap-2 rounded-full border border-brand bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
          >
            <CalendarDays className="h-4 w-4 text-brand" />
            Open full calendar
          </Link>
        </div>

        <ElementaryPlanner plans={gradeSchoolPlans} />

        {error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}
      </div>
    );
  }

  if (!loading && courses.length === 0 && allEvents.length === 0) {
    return <FirstRunOnboarding variant="hub" />;
  }

  return (
    <div className="space-y-6">
      <HubStudyNowCard {...studyNowProps} />

      <StudyAnythingCard />

      <HubAssignmentsPanel
        assignments={assignments}
        courses={courses}
        courseFilterId={courseFilterId}
        focusAssignmentId={focusId}
        onSelectAssignment={selectAssignment}
        onChanged={() => void handleAssignmentsChanged()}
      />

      <HubInsightsPanel attention={attention} progress={progress} telemetry={telemetry} />

      <CalendarAiScheduling compact onApproved={handleProposalApproved} />

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <QuickViewBar active={quickView} onChange={setQuickView} />
          <CourseFilterBar
            courses={courses}
            selectedCourseId={courseFilterId}
            onChange={setCourseFilterId}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openCreateEvent(selectedDate)}
            className="inline-flex items-center gap-2 rounded-full btn-primary px-4 py-2 text-sm font-semibold text-white transition "
          >
            <Plus className="h-4 w-4" />
            Add event
          </button>
          <Link
            href={buildCalendarHref({
              date: localDateKey(selectedDate),
              view: calendarMode === "month" ? "month" : "week",
            })}
            className="inline-flex items-center gap-2 rounded-full border border-brand bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
          >
            <CalendarDays className="h-4 w-4 text-brand" />
            Open full calendar
            <ArrowUpRight className="h-3.5 w-3.5 text-stone-400" />
          </Link>
          <button
            type="button"
            onClick={() => setCalendarMode("week-grid")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              calendarMode === "week-grid"
                ? "bg-stone-900 text-white"
                : "border border-brand bg-white text-stone-700"
            }`}
          >
            Time grid
          </button>
          <button
            type="button"
            onClick={() => setCalendarMode("month")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              calendarMode === "month"
                ? "bg-stone-900 text-white"
                : "border border-brand bg-white text-stone-700"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {loading && allEvents.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading schedule…
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <ScheduleDetailPanel
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          quickViewLabel={quickViewLabel}
          {...schedulePanelProps}
        />

        <div className="space-y-6">
          <WeekStrip
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            eventDays={eventDays}
          />

          {calendarMode === "week-grid" ? (
            <WeekTimeGrid
              weekStartDate={selectedDate}
              items={courseScopedItems}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              onEventMove={handleEventMove}
              onEventResize={handleEventResize}
              onSlotClick={openCreateEvent}
              onToggleComplete={async (id, completed) => {
                const event = allEvents.find((entry) => entry.id === id);
                if (!event) return;
                await handleToggleComplete(event, completed);
              }}
            />
          ) : (
            <HubMonthCalendar
              anchorDate={selectedDate}
              items={courseScopedItems}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              onSelectDate={(date) => {
                onSelectDate(date);
                setCalendarMode("week-grid");
              }}
              onEventMove={handleEventMove}
              onToggleComplete={async (id, completed) => {
                const event = allEvents.find((entry) => entry.id === id);
                if (!event) return;
                await handleToggleComplete(event, completed);
              }}
            />
          )}
        </div>
      </div>

      <RecurrenceScopeDialog
        open={deleteScopeOpen}
        action="delete"
        onChoose={(scope) => void confirmScopedDelete(scope)}
        onCancel={() => {
          setDeleteScopeOpen(false);
          setPendingDelete(null);
        }}
      />

      <EventFormModal
        open={createOpen}
        courses={workspaceCourses}
        initial={createInitial}
        onClose={() => {
          setCreateOpen(false);
          setCreateInitial(undefined);
        }}
        onSave={handleCreateEvent}
      />

      <EventFormModal
        open={editOpen}
        courses={workspaceCourses}
        initial={editInitial}
        onClose={() => {
          setEditOpen(false);
          setEditInitial(undefined);
        }}
        onSave={handleUpdateEvent}
        onDelete={async () => {
          const event = allEvents.find((entry) => entry.id === editInitial?.id);
          if (!event) return;
          setEditOpen(false);
          setEditInitial(undefined);
          await handleDelete(event);
        }}
      />

      {scheduleCourse ? (
        <ClassMeetingsModal
          course={scheduleCourse}
          meetings={meetings}
          open
          onClose={() => setScheduleCourse(null)}
          onChanged={() => {
            void refresh();
            onScheduleChanged?.();
          }}
        />
      ) : null}
    </div>
  );
}
