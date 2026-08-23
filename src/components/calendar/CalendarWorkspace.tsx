"use client";

import { useMemo, useState } from "react";
import { Menu } from "lucide-react";

import { CalendarAppearanceProvider } from "@/components/calendar/CalendarAppearanceContext";
import { CalendarAiScheduling } from "@/components/calendar/CalendarAiScheduling";
import { CalendarSettingsPanel } from "@/components/calendar/CalendarSettingsPanel";
import { CalendarSidebar } from "@/components/calendar/CalendarSidebar";
import { CalendarTimeInsightsPanel } from "@/components/calendar/CalendarTimeInsights";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { EventDetailDrawer } from "@/components/calendar/EventDetailDrawer";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { RecurrenceScopeDialog } from "@/components/calendar/RecurrenceScopeDialog";
import { useCalendarWorkspace } from "@/components/calendar/useCalendarWorkspace";
import { AgendaView } from "@/components/calendar/views/AgendaView";
import { MonthView } from "@/components/calendar/views/MonthView";
import {
  buildWeekDays,
  TimeGridView,
} from "@/components/calendar/views/TimeGridView";
import { CalendarGridSkeleton } from "@/components/ui/Skeleton";
import { resolveCalendarAppearance } from "@/lib/calendar/calendar-themes";
import type { CalendarViewMode, WorkspaceCalendarItem, WorkspaceCourse } from "@/lib/calendar/workspace-types";
import type { RecurrenceEditScope } from "@/lib/calendar/recurrence";

export function CalendarWorkspace({
  initialCourses,
  initialDate,
  initialView,
}: {
  initialCourses: WorkspaceCourse[];
  initialDate?: string;
  initialView?: CalendarViewMode;
}) {
  const workspace = useCalendarWorkspace(initialCourses, {
    initialDate,
    initialView,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteScopeOpen, setDeleteScopeOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<WorkspaceCalendarItem | null>(null);
  const [formInitial, setFormInitial] = useState<
    Parameters<typeof EventFormModal>[0]["initial"]
  >();

  const weekStartsOnMonday = workspace.settings.weekStartsOn === "monday";

  const relatedItems = useMemo(() => {
    if (!workspace.selectedItem?.courseId) return [];
    return workspace.allItems.filter(
      (item) => item.courseId === workspace.selectedItem?.courseId,
    );
  }, [workspace.allItems, workspace.selectedItem?.courseId]);

  function openCreate(date?: Date, hour?: number) {
    const start = date ? new Date(date) : new Date();
    if (hour !== undefined) start.setHours(hour, 0, 0, 0);
    else start.setHours(9, 0, 0, 0);
    const end = new Date(
      start.getTime() +
        workspace.settings.defaultEventDurationMinutes * 60 * 1000,
    );

    setFormInitial({
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      allDay: false,
    });
    setFormOpen(true);
  }

  function openEdit() {
    if (!workspace.selectedItem) return;
    setFormInitial({ ...workspace.selectedItem, id: workspace.selectedItem.id });
    setFormOpen(true);
  }

  async function handleEventMove(
    id: string,
    startAt: string,
    endAt: string | null,
  ) {
    const item = workspace.allItems.find((entry) => entry.id === id);
    await workspace.updateEvent(id, {
      startAt,
      endAt,
      allDay: item?.allDay ?? false,
      editScope: item?.isRecurrenceOccurrence ? "single" : undefined,
      occurrenceAt: item?.occurrenceAt,
    });
  }

  async function handleEventResize(
    id: string,
    startAt: string,
    endAt: string,
  ) {
    await workspace.updateEvent(id, { startAt, endAt, allDay: false });
  }

  async function handleToggleComplete(id: string, completed: boolean) {
    await workspace.updateEvent(id, { completed });
  }

  async function handleDelete(item: { id: string; title: string; isRecurrenceOccurrence?: boolean }) {
    if (item.isRecurrenceOccurrence) {
      setPendingDelete(item as WorkspaceCalendarItem);
      setDeleteScopeOpen(true);
      return;
    }

    const { confirmDelete } = await import("@/lib/confirm-delete");
    if (!confirmDelete(item.title)) return;
    await workspace.deleteEvent(item.id);
    setDrawerOpen(false);
  }

  async function confirmScopedDelete(scope: RecurrenceEditScope) {
    if (!pendingDelete) return;
    const { confirmDelete } = await import("@/lib/confirm-delete");
    if (!confirmDelete(pendingDelete.title)) {
      setDeleteScopeOpen(false);
      setPendingDelete(null);
      return;
    }

    await workspace.deleteEvent(pendingDelete.id, { editScope: scope });
    setDeleteScopeOpen(false);
    setPendingDelete(null);
    setDrawerOpen(false);
  }

  function handleSelect(id: string) {
    workspace.setSelectedId(id);
    setDrawerOpen(true);
  }

  const sidebarProps = {
    courses: workspace.courses,
    googleConnections: workspace.googleConnections,
    hiddenCalendarIds: workspace.settings.hiddenCalendarIds,
    personalCalendarColor: workspace.settings.personalCalendarColor,
    colorScale: workspace.settings.colorScale,
    search: workspace.filters.search,
    onSearchChange: (search: string) =>
      workspace.setFilters({ ...workspace.filters, search }),
    view: workspace.view,
    onViewChange: workspace.setView,
    onAddEvent: () => openCreate(),
    onGoToday: workspace.goToday,
    onOpenSettings: () => workspace.setSettingsOpen(true),
    onToggleCalendar: (calendarId: string) =>
      void workspace.toggleCalendarVisibility(calendarId),
    onCourseColorChange: (courseId: string, color: string) =>
      void workspace.updateCourseColor(courseId, color),
    onPersonalColorChange: (color: string) =>
      void workspace.updatePersonalColor(color),
    onGoogleColorChange: (connectionId: string, color: string) =>
      void workspace.updateGoogleConnectionColor(connectionId, color),
    focusedCourseId: workspace.focusedCourseId,
    onFocusCourse: workspace.setFocusedCourseId,
  };

  const appearance = resolveCalendarAppearance(workspace.settings);

  return (
    <CalendarAppearanceProvider settings={workspace.settings}>
    <div className="flex min-h-[calc(100vh-57px)] flex-col lg:flex-row" style={{ backgroundColor: "var(--cal-bg)" }}>
      <div className="lg:hidden">
        <div
          className="flex items-center gap-2 border-b px-4 py-2 backdrop-blur-xl"
          style={{
            borderColor: appearance.gridLineColor,
            backgroundColor: appearance.headerBackground,
          }}
        >
          <button
            type="button"
            onClick={() => workspace.setSidebarOpen(!workspace.sidebarOpen)}
            className="rounded-lg border p-2"
            style={{
              borderColor: appearance.gridLineColor,
              color: appearance.textColor,
            }}
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold" style={{ color: appearance.textColor }}>
            Calendars
          </span>
        </div>
        {workspace.sidebarOpen ? (
          <div className="max-h-[min(50dvh,24rem)] overflow-y-auto border-b lg:max-h-none lg:overflow-visible">
            <CalendarSidebar open onToggle={() => workspace.setSidebarOpen(false)} {...sidebarProps} />
          </div>
        ) : null}
      </div>

      <div className="hidden lg:flex">
        <CalendarSidebar
          open={workspace.sidebarOpen}
          onToggle={() => workspace.setSidebarOpen(!workspace.sidebarOpen)}
          {...sidebarProps}
        />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <CalendarToolbar
          view={workspace.view}
          anchorDate={workspace.anchorDate}
          onPrev={workspace.goPrev}
          onNext={workspace.goNext}
          onToday={workspace.goToday}
          onOpenSettings={() => workspace.setSettingsOpen(true)}
          filters={workspace.filters}
          onFiltersChange={workspace.setFilters}
          loading={workspace.loading}
        />

        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          <div className="min-w-0 flex-1 overflow-y-auto transition-all duration-300">
            {workspace.error ? (
              <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {workspace.error}
              </p>
            ) : null}

            {workspace.loading && workspace.items.length === 0 ? (
              <CalendarGridSkeleton />
            ) : null}

            {!workspace.loading || workspace.items.length > 0 ? (
              <>
                {workspace.view === "month" ? (
                  <MonthView
                    anchorDate={workspace.anchorDate}
                    items={workspace.items}
                    selectedId={workspace.selectedId}
                    focusedCourseId={workspace.focusedCourseId}
                    onSelect={handleSelect}
                    onToggleComplete={handleToggleComplete}
                    onEventMove={handleEventMove}
                    onDayClick={(date) => {
                      workspace.setAnchorDate(date);
                      workspace.setView("day");
                    }}
                  />
                ) : null}

                {workspace.view === "week" ? (
                  <TimeGridView
                    days={buildWeekDays(workspace.anchorDate, weekStartsOnMonday)}
                    items={workspace.items}
                    selectedId={workspace.selectedId}
                    focusedCourseId={workspace.focusedCourseId}
                    onSelect={handleSelect}
                    onSlotClick={(date, hour) => openCreate(date, hour)}
                    onEventMove={handleEventMove}
                    onEventResize={handleEventResize}
                    onToggleComplete={handleToggleComplete}
                    hourStart={workspace.settings.workingHoursStart}
                    hourEnd={workspace.settings.workingHoursEnd}
                  />
                ) : null}

                {workspace.view === "day" ? (
                  <TimeGridView
                    days={[workspace.anchorDate]}
                    items={workspace.items}
                    selectedId={workspace.selectedId}
                    focusedCourseId={workspace.focusedCourseId}
                    onSelect={handleSelect}
                    onSlotClick={(date, hour) => openCreate(date, hour)}
                    onEventMove={handleEventMove}
                    onEventResize={handleEventResize}
                    onToggleComplete={handleToggleComplete}
                    hourStart={workspace.settings.workingHoursStart}
                    hourEnd={workspace.settings.workingHoursEnd}
                  />
                ) : null}

                {workspace.view === "agenda" ? (
                  <AgendaView
                    items={workspace.items}
                    selectedId={workspace.selectedId}
                    onSelect={handleSelect}
                    onToggleComplete={handleToggleComplete}
                  />
                ) : null}
              </>
            ) : null}
          </div>

          <div className="hidden w-80 shrink-0 xl:block">
            <EventDetailDrawer
              open={Boolean(workspace.selectedItem)}
              item={workspace.selectedItem}
              relatedItems={relatedItems}
              onClose={() => {
                setDrawerOpen(false);
                workspace.setSelectedId(null);
              }}
              onEdit={openEdit}
              onToggleComplete={async (completed) => {
                if (!workspace.selectedItem) return;
                await workspace.updateEvent(workspace.selectedItem.id, { completed });
              }}
              onReschedule={openEdit}
              onDelete={
                workspace.selectedItem &&
                (workspace.selectedItem.editable ||
                  workspace.selectedItem.source === "meeting")
                  ? () => void handleDelete(workspace.selectedItem!)
                  : undefined
              }
            />
            {workspace.settings.showTimeInsights ? (
              <CalendarTimeInsightsPanel insights={workspace.timeInsights} />
            ) : null}
            <CalendarAiScheduling
              compact
              onApproved={() => void workspace.loadCalendar()}
            />
          </div>
        </div>
      </main>

      {drawerOpen && workspace.selectedItem ? (
        <div className="xl:hidden">
          <EventDetailDrawer
            open
            item={workspace.selectedItem}
            relatedItems={relatedItems}
            onClose={() => {
              setDrawerOpen(false);
              workspace.setSelectedId(null);
            }}
            onEdit={openEdit}
            onToggleComplete={async (completed) => {
              if (!workspace.selectedItem) return;
              await workspace.updateEvent(workspace.selectedItem.id, { completed });
            }}
            onReschedule={openEdit}
            onDelete={() => void handleDelete(workspace.selectedItem!)}
          />
        </div>
      ) : null}

      <EventFormModal
        open={formOpen}
        courses={workspace.courses}
        initial={formInitial}
        onClose={() => {
          setFormOpen(false);
          setFormInitial(undefined);
        }}
        onSave={async (input) => {
          if (formInitial?.id) {
            await workspace.updateEvent(formInitial.id, input);
          } else {
            await workspace.createEvent(input);
          }
        }}
        onDelete={
          formInitial?.id &&
          workspace.allItems.find((i) => i.id === formInitial.id)?.editable
            ? async () => {
                if (!formInitial.id) return;
                await workspace.deleteEvent(formInitial.id);
                setFormOpen(false);
                setDrawerOpen(false);
              }
            : undefined
        }
      />

      <CalendarSettingsPanel
        open={workspace.settingsOpen}
        onClose={() => workspace.setSettingsOpen(false)}
        settings={workspace.settings}
        courses={workspace.courses}
        onSettingsChange={workspace.updateSettings}
        onImportComplete={() => void workspace.loadCalendar()}
      />

      <RecurrenceScopeDialog
        open={deleteScopeOpen}
        action="delete"
        onChoose={(scope) => void confirmScopedDelete(scope)}
        onCancel={() => {
          setDeleteScopeOpen(false);
          setPendingDelete(null);
        }}
      />
    </div>
    </CalendarAppearanceProvider>
  );
}
