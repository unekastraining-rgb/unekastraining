"use client";

import {
  Calendar,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
} from "lucide-react";

import { ColorPickerPopover } from "@/components/calendar/ColorPickerPopover";
import { useCalendarAppearance } from "@/components/calendar/CalendarAppearanceContext";
import type { ColorScaleId } from "@/lib/calendar/color-scales";
import { PERSONAL_CALENDAR_ID } from "@/lib/calendar/settings";
import type {
  CalendarViewMode,
  WorkspaceCourse,
} from "@/lib/calendar/workspace-types";
import type { GoogleCalendarConnection } from "@/components/calendar/useCalendarWorkspace";

interface CalendarSidebarProps {
  open: boolean;
  onToggle: () => void;
  courses: WorkspaceCourse[];
  googleConnections?: GoogleCalendarConnection[];
  hiddenCalendarIds: string[];
  personalCalendarColor: string;
  colorScale: ColorScaleId;
  search: string;
  onSearchChange: (value: string) => void;
  view: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  onAddEvent: () => void;
  onGoToday: () => void;
  onOpenSettings: () => void;
  onToggleCalendar: (calendarId: string) => void;
  onCourseColorChange: (courseId: string, color: string) => void;
  onPersonalColorChange: (color: string) => void;
  onGoogleColorChange?: (connectionId: string, color: string) => void;
  focusedCourseId?: string | null;
  onFocusCourse?: (courseId: string | null) => void;
}

export function CalendarSidebar({
  open,
  onToggle,
  courses,
  googleConnections = [],
  hiddenCalendarIds,
  personalCalendarColor,
  colorScale,
  search,
  onSearchChange,
  view,
  onViewChange,
  onAddEvent,
  onGoToday,
  onOpenSettings,
  onToggleCalendar,
  onCourseColorChange,
  onPersonalColorChange,
  onGoogleColorChange,
  focusedCourseId,
  onFocusCourse,
}: CalendarSidebarProps) {
  const appearance = useCalendarAppearance();

  if (!open) {
    return (
      <div
        className="hidden shrink-0 border-r p-2 lg:block"
        style={{
          borderColor: appearance.gridLineColor,
          backgroundColor: appearance.isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.7)",
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl border p-2 transition hover:opacity-80"
          style={{
            borderColor: appearance.gridLineColor,
            color: appearance.textColor,
          }}
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="flex w-full shrink-0 flex-col border-r backdrop-blur-md lg:w-72 xl:w-80"
      style={{
        borderColor: appearance.gridLineColor,
        backgroundColor: appearance.isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.72)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: appearance.gridLineColor }}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" style={{ color: appearance.accentColor }} />
          <span className="font-bold" style={{ color: appearance.textColor }}>
            Calendar
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-orange-50"
            aria-label="Calendar settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-lg p-1.5 text-stone-500 hover:bg-orange-50 lg:inline-flex"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events…"
            className="w-full rounded-xl border border-orange-200/80 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-stone-800 placeholder:text-muted-soft outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <button
          type="button"
          onClick={onAddEvent}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
          style={{
            backgroundColor: appearance.accentColor,
            boxShadow: `0 4px 14px ${appearance.accentColor}40`,
          }}
        >
          <Plus className="h-4 w-4" />
          Create
        </button>

        <section>
          <SectionTitle title="View" />
          <div className="mt-2 grid grid-cols-2 gap-1">
            {(["month", "week", "day", "agenda"] as CalendarViewMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onViewChange(mode)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition ${
                    view === mode
                      ? "bg-orange-100 text-orange-800 ring-1 ring-orange-200"
                      : "text-stone-600 hover:bg-orange-50"
                  }`}
                >
                  {mode}
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            onClick={onGoToday}
            className="mt-2 w-full rounded-lg border border-orange-200 py-1.5 text-xs font-semibold text-stone-700 hover:bg-orange-50"
          >
            Today
          </button>
        </section>

        <section>
          <SectionTitle title="My calendars" />
          <div className="mt-2 space-y-1">
            <CalendarRow
              id={PERSONAL_CALENDAR_ID}
              title="Personal"
              color={personalCalendarColor}
              colorScale={colorScale}
              visible={!hiddenCalendarIds.includes(PERSONAL_CALENDAR_ID)}
              focused={false}
              onToggle={() => onToggleCalendar(PERSONAL_CALENDAR_ID)}
              onColorChange={onPersonalColorChange}
            />
            {courses.map((course) => (
              <CalendarRow
                key={course.id}
                id={course.id}
                title={course.title}
                color={course.color ?? "#ea580c"}
                colorScale={colorScale}
                visible={!hiddenCalendarIds.includes(course.id)}
                focused={focusedCourseId === course.id}
                onToggle={() => onToggleCalendar(course.id)}
                onColorChange={(color) => onCourseColorChange(course.id, color)}
                onFocus={() =>
                  onFocusCourse?.(
                    focusedCourseId === course.id ? null : course.id,
                  )
                }
              />
            ))}
          </div>
        </section>

        {googleConnections.length > 0 ? (
          <section>
            <SectionTitle title="Google calendars" />
            <div className="mt-2 space-y-1">
              {googleConnections.map((connection) => {
                const calendarId = `google:${connection.id}`;
                return (
                  <CalendarRow
                    key={connection.id}
                    id={calendarId}
                    title={connection.calendarName ?? "Google Calendar"}
                    color={connection.color ?? "#4285f4"}
                    colorScale={colorScale}
                    visible={!hiddenCalendarIds.includes(calendarId)}
                    focused={false}
                    onToggle={() => onToggleCalendar(calendarId)}
                    onColorChange={(color) =>
                      onGoogleColorChange?.(connection.id, color)
                    }
                  />
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  );
}

function CalendarRow({
  title,
  color,
  colorScale,
  visible,
  focused,
  onToggle,
  onColorChange,
  onFocus,
}: {
  id: string;
  title: string;
  color: string;
  colorScale: ColorScaleId;
  visible: boolean;
  focused: boolean;
  onToggle: () => void;
  onColorChange: (color: string) => void;
  onFocus?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
        focused ? "bg-orange-100/80 ring-1 ring-orange-200" : "hover:bg-orange-50/80"
      }`}
    >
      <input
        type="checkbox"
        checked={visible}
        onChange={onToggle}
        className="rounded border-orange-200 text-orange-600"
      />
      <ColorPickerPopover
        color={color}
        onChange={onColorChange}
      >
        <span
          className="block h-3 w-3 rounded-full ring-1 ring-black/5"
          style={{ backgroundColor: color }}
        />
      </ColorPickerPopover>
      <button
        type="button"
        onClick={onFocus}
        disabled={!onFocus}
        className={`min-w-0 flex-1 truncate text-left ${
          focused ? "font-semibold text-stone-900" : "text-stone-700"
        } ${onFocus ? "" : "cursor-default"}`}
      >
        {title}
      </button>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
      {title}
    </h3>
  );
}
