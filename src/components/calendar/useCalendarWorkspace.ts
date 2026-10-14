"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { applyToEventPalette } from "@/lib/calendar/color-scales";
import { resolveCalendarAppearance } from "@/lib/calendar/calendar-themes";
import {
  addDays,
  addMonths,
  getViewRange,
  startOfWeek,
} from "@/lib/calendar/date-utils";
import {
  DEFAULT_CALENDAR_SETTINGS,
  PERSONAL_CALENDAR_ID,
  googleCalendarId,
  type CalendarSettings,
} from "@/lib/calendar/settings";
import type { RecurrenceEditScope } from "@/lib/calendar/recurrence";
import { buildCalendarTimeInsights } from "@/lib/calendar/time-insights";
import { localDateKey } from "@/lib/calendar/types";
import type {
  CalendarEventInput,
  CalendarFilters,
  CalendarViewMode,
  WorkspaceCalendarItem,
  WorkspaceCourse,
} from "@/lib/calendar/workspace-types";
import { DEFAULT_EVENT_TYPES } from "@/lib/calendar/workspace-types";
import { runCalendarBackgroundSync } from "@/lib/calendar/client-sync";
import type { GoogleConnectionStatus } from "@/lib/calendar/client-sync";

export type GoogleCalendarConnection = GoogleConnectionStatus;

function resolveCalendarId(item: WorkspaceCalendarItem): string {
  if (item.courseId) return item.courseId;
  if (item.calendarConnectionId) return googleCalendarId(item.calendarConnectionId);
  if (item.externalSource === "google") return "google:imported";
  return PERSONAL_CALENDAR_ID;
}

function createDefaultFilters(courses: WorkspaceCourse[]): CalendarFilters {
  return {
    search: "",
    courseIds: new Set(courses.map((c) => c.id)),
    eventTypes: new Set(DEFAULT_EVENT_TYPES),
    showCompleted: true,
    showIncomplete: true,
    showOverdue: true,
    datePreset: "all",
  };
}

function withScaledColors(
  items: WorkspaceCalendarItem[],
  settings: CalendarSettings,
  courses: WorkspaceCourse[],
): WorkspaceCalendarItem[] {
  const courseColorMap = new Map(
    courses.map((course) => [course.id, course.color ?? "#ea580c"]),
  );

  const appearance = resolveCalendarAppearance(settings);
  const palette = appearance.eventPalette;

  return items.map((item) => {
    if (item.colorIsCustom) {
      return item;
    }

    const baseColor = item.courseId
      ? (courseColorMap.get(item.courseId) ?? item.color)
      : settings.personalCalendarColor;
    return {
      ...item,
      color: applyToEventPalette(item.color || baseColor, palette),
    };
  });
}

export function useCalendarWorkspace(
  initialCourses: WorkspaceCourse[],
  options?: {
    initialDate?: string;
    initialView?: CalendarViewMode;
  },
) {
  const [courses, setCourses] = useState(initialCourses);
  const [items, setItems] = useState<WorkspaceCalendarItem[]>([]);
  const itemsRef = useRef(items);
  // eslint-disable-next-line react-hooks/refs -- mirror items for async fetch guards
  itemsRef.current = items;
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<CalendarSettings>(
    DEFAULT_CALENDAR_SETTINGS,
  );
  const [view, setView] = useState<CalendarViewMode>(
    options?.initialView ?? DEFAULT_CALENDAR_SETTINGS.defaultView,
  );
  const [anchorDate, setAnchorDate] = useState(() => {
    if (options?.initialDate) {
      const parsed = new Date(`${options.initialDate}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  const [filters, setFilters] = useState<CalendarFilters>(() =>
    createDefaultFilters(initialCourses),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedCourseId, setFocusedCourseId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [googleConnections, setGoogleConnections] = useState<GoogleCalendarConnection[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("settings") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setSettingsOpen(true);
    }
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarOpen(true);
    }
  }, []);

  const weekStartsOnMonday = settings.weekStartsOn === "monday";

  const viewRange = useMemo(
    () => getViewRange(view, anchorDate, weekStartsOnMonday),
    [view, anchorDate, weekStartsOnMonday],
  );

  const fetchRangeKey = useMemo(() => {
    const start = new Date(viewRange.start);
    start.setDate(start.getDate() - 14);
    const end = new Date(viewRange.end);
    end.setDate(end.getDate() + 14);
    return `${start.toISOString()}|${end.toISOString()}`;
  }, [viewRange]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- stable settings loader; options.initialView is the only external input
  const loadSettings = useCallback(async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4_000);
    try {
      const response = await fetch("/api/calendar/settings", {
        credentials: "same-origin",
        signal: controller.signal,
      });
      const json = await response.json();
      if (json.success) {
        setSettings(json.settings);
        if (!options?.initialView) {
          setView(json.settings.defaultView);
        }
      }
    } catch {
      // Fall back to defaults — calendar still loads.
    } finally {
      window.clearTimeout(timeout);
    }
  }, [options?.initialView]);

  const loadGenerationRef = useRef(0);

  const loadCalendar = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    setError(null);
    const showInitialSpinner =
      !hasLoadedOnceRef.current && itemsRef.current.length === 0;
    if (showInitialSpinner) setLoading(true);

    const [startIso, endIso] = fetchRangeKey.split("|");
    const params = new URLSearchParams({
      start: startIso,
      end: endIso,
    });

    const loadingWatchdog = window.setTimeout(() => {
      if (generation === loadGenerationRef.current) {
        setLoading(false);
        hasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
      }
    }, 12_000);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(`/api/calendar?${params}`, {
        credentials: "same-origin",
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const json = await response.json();

      if (generation !== loadGenerationRef.current) return;

      if (!json.success) {
        throw new Error(json.error ?? "Failed to load calendar");
      }

      setItems(json.data.items);
      setCourses(json.data.courses);
      hasLoadedOnceRef.current = true;
      setHasLoadedOnce(true);

      // Sync Google/LMS after the grid is visible — never blocks loading state.
      window.setTimeout(() => {
        void runCalendarBackgroundSync({
          params,
          onGoogleConnections: setGoogleConnections,
          onData: (data) => {
            if (generation !== loadGenerationRef.current) return;
            setItems(data.items);
            setCourses(data.courses);
          },
        });
      }, 250);
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "Calendar took too long to load. Tap Retry."
          : err instanceof Error
            ? err.message
            : "Failed to load calendar",
      );
      setHasLoadedOnce(true);
      hasLoadedOnceRef.current = true;
    } finally {
      window.clearTimeout(loadingWatchdog);
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [fetchRangeKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    // Load events immediately; settings apply when they arrive (colors/filters).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void loadCalendar();
  }, [loadCalendar]);

  const scaledItems = useMemo(
    () => withScaledColors(items, settings, courses),
    [items, settings, courses],
  );

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const hidden = new Set(settings.hiddenCalendarIds);

    return scaledItems.filter((item) => {
      const calendarId = resolveCalendarId(item);
      if (hidden.has(calendarId)) return false;

      if (search) {
        const haystack = [
          item.title,
          item.description ?? "",
          item.courseTitle ?? "",
          item.eventType,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (item.courseId && filters.courseIds.size > 0) {
        if (!filters.courseIds.has(item.courseId)) return false;
      }

      if (!filters.eventTypes.has(item.eventType)) return false;

      const statusMatch =
        (item.completed && filters.showCompleted) ||
        (!item.completed && filters.showIncomplete) ||
        (item.overdue && filters.showOverdue);

      if (!statusMatch) return false;

      if (filters.datePreset !== "all") {
        const itemStart = new Date(item.startAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filters.datePreset === "today") {
          if (localDateKey(itemStart) !== localDateKey(today)) return false;
        } else if (filters.datePreset === "week") {
          const weekStart = startOfWeek(today, weekStartsOnMonday);
          const weekEnd = addDays(weekStart, 6);
          weekEnd.setHours(23, 59, 59, 999);
          if (itemStart < weekStart || itemStart > weekEnd) return false;
        } else if (filters.datePreset === "month") {
          if (
            itemStart.getMonth() !== today.getMonth() ||
            itemStart.getFullYear() !== today.getFullYear()
          ) {
            return false;
          }
        } else if (filters.datePreset === "custom") {
          if (filters.customStart) {
            const start = new Date(filters.customStart);
            start.setHours(0, 0, 0, 0);
            if (itemStart < start) return false;
          }
          if (filters.customEnd) {
            const end = new Date(filters.customEnd);
            end.setHours(23, 59, 59, 999);
            if (itemStart > end) return false;
          }
        }
      }

      const itemStart = new Date(item.startAt);
      const itemEnd = item.endAt ? new Date(item.endAt) : itemStart;
      return itemEnd >= viewRange.start && itemStart <= viewRange.end;
    });
  }, [scaledItems, filters, viewRange, settings.hiddenCalendarIds, weekStartsOnMonday]);

  const timeInsights = useMemo(
    () =>
      buildCalendarTimeInsights(
        filteredItems,
        settings.workingHoursEnd - settings.workingHoursStart,
        view === "week" ? 7 : view === "day" ? 1 : 30,
      ),
    [filteredItems, settings.workingHoursEnd, settings.workingHoursStart, view],
  );

  const selectedItem = useMemo(
    () => scaledItems.find((item) => item.id === selectedId) ?? null,
    [scaledItems, selectedId],
  );

  const updateSettings = useCallback(async (patch: Partial<CalendarSettings>) => {
    const response = await fetch("/api/calendar/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(patch),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error ?? "Failed to save settings");
    setSettings(json.settings);
    if (patch.defaultView) setView(patch.defaultView);
  }, []);

  const toggleCalendarVisibility = useCallback(
    async (calendarId: string) => {
      const hidden = new Set(settings.hiddenCalendarIds);
      if (hidden.has(calendarId)) hidden.delete(calendarId);
      else hidden.add(calendarId);
      await updateSettings({ hiddenCalendarIds: Array.from(hidden) });
    },
    [settings.hiddenCalendarIds, updateSettings],
  );

  const updateCourseColor = useCallback(
    async (courseId: string, color: string) => {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ color }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error ?? "Failed to update color");
      setCourses((current) =>
        current.map((course) =>
          course.id === courseId ? { ...course, color } : course,
        ),
      );
      await loadCalendar();
    },
    [loadCalendar],
  );

  const updatePersonalColor = useCallback(
    async (color: string) => {
      await updateSettings({ personalCalendarColor: color });
    },
    [updateSettings],
  );

  const updateGoogleConnectionColor = useCallback(
    async (connectionId: string, color: string) => {
      const response = await fetch("/api/calendar/google/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ connectionId, color }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error ?? "Failed to update color");
      setGoogleConnections((current) =>
        current.map((connection) =>
          connection.id === connectionId ? { ...connection, color } : connection,
        ),
      );
      await loadCalendar();
    },
    [loadCalendar],
  );

  const createEvent = useCallback(async (input: CalendarEventInput) => {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error ?? "Failed to create event");
    await loadCalendar();
    setSelectedId(json.data.id);
    return json.data as WorkspaceCalendarItem;
  }, [loadCalendar]);

  const updateEvent = useCallback(
    async (id: string, updates: Partial<CalendarEventInput>) => {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error("Event not found");

      const previousItems = items;
      const optimistic: WorkspaceCalendarItem = {
        ...item,
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {}),
        ...(updates.startAt !== undefined ? { startAt: updates.startAt } : {}),
        ...(updates.endAt !== undefined ? { endAt: updates.endAt } : {}),
        ...(updates.allDay !== undefined ? { allDay: updates.allDay } : {}),
        ...(updates.completed !== undefined ? { completed: updates.completed } : {}),
        ...(updates.color !== undefined ? { color: updates.color ?? item.color } : {}),
        ...(updates.location !== undefined ? { location: updates.location } : {}),
      };
      setItems((current) => current.map((entry) => (entry.id === id ? optimistic : entry)));

      try {
        const response = await fetch("/api/calendar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            source: item.source,
            sourceId: item.sourceId,
            editScope:
              updates.editScope ?? (item.isRecurrenceOccurrence ? "single" : "series"),
            occurrenceAt: updates.occurrenceAt ?? item.occurrenceAt,
            ...updates,
          }),
        });
        const json = await response.json();
        if (!json.success) throw new Error(json.error ?? "Failed to update event");
        setItems((current) =>
          current.map((entry) => (entry.id === id ? json.data : entry)),
        );
        return json.data as WorkspaceCalendarItem;
      } catch (error) {
        setItems(previousItems);
        throw error;
      }
    },
    [items],
  );

  const deleteEvent = useCallback(
    async (
      id: string,
      options?: { editScope?: RecurrenceEditScope; occurrenceAt?: string },
    ) => {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error("Event not found");
      if (!item.editable && item.source !== "meeting") {
        throw new Error("This item cannot be deleted");
      }

      const response = await fetch("/api/calendar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          source: item.source,
          sourceId: item.sourceId,
          editScope: options?.editScope ?? (item.isRecurrenceOccurrence ? "single" : "series"),
          occurrenceAt: options?.occurrenceAt ?? item.occurrenceAt,
        }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error ?? "Failed to delete event");
      setSelectedId(null);
      await loadCalendar();
    },
    [items, loadCalendar],
  );

  const goToday = useCallback(() => setAnchorDate(new Date()), []);

  const goPrev = useCallback(() => {
    setAnchorDate((current) => {
      if (view === "month") return addMonths(current, -1);
      if (view === "week") return addDays(current, -7);
      return addDays(current, -1);
    });
  }, [view]);

  const goNext = useCallback(() => {
    setAnchorDate((current) => {
      if (view === "month") return addMonths(current, 1);
      if (view === "week") return addDays(current, 7);
      return addDays(current, 1);
    });
  }, [view]);

  return {
    courses,
    items: filteredItems,
    allItems: scaledItems,
    loading: loading && !hasLoadedOnce,
    hasLoadedOnce,
    error,
    settings,
    settingsOpen,
    setSettingsOpen,
    view,
    setView,
    anchorDate,
    setAnchorDate,
    filters,
    setFilters,
    selectedId,
    setSelectedId,
    selectedItem,
    focusedCourseId,
    setFocusedCourseId,
    sidebarOpen,
    setSidebarOpen,
    viewRange,
    timeInsights,
    googleConnections,
    loadCalendar,
    refresh: loadCalendar,
    updateSettings,
    toggleCalendarVisibility,
    updateCourseColor,
    updatePersonalColor,
    updateGoogleConnectionColor,
    createEvent,
    updateEvent,
    deleteEvent,
    goToday,
    goPrev,
    goNext,
  };
}
