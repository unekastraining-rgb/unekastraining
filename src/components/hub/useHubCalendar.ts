"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { startOfWeek } from "@/lib/calendar/date-utils";
import { runCalendarBackgroundSync } from "@/lib/calendar/client-sync";
import { workspaceItemsToHubEvents } from "@/lib/calendar/hub-adapters";
import { localDateKey } from "@/lib/calendar/types";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

function getHubFetchRange(anchorDate: Date) {
  const weekStart = startOfWeek(anchorDate);
  const start = new Date(weekStart);
  start.setDate(start.getDate() - 7);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 28);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function useHubCalendar(anchorDate: Date) {
  const [items, setItems] = useState<WorkspaceCalendarItem[]>([]);
  const itemsRef = useRef(items);
  // eslint-disable-next-line react-hooks/refs -- mirror items for async fetch guards
  itemsRef.current = items;
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const anchorKey = localDateKey(anchorDate);

  const fetchRangeKey = useMemo(() => {
    const anchor = new Date(`${anchorKey}T12:00:00`);
    const { start, end } = getHubFetchRange(anchor);
    return `${start.toISOString()}|${end.toISOString()}`;
  }, [anchorKey]);

  const loadGenerationRef = useRef(0);

  const load = useCallback(async () => {
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
      const data = await response.json();

      if (generation !== loadGenerationRef.current) return;

      if (!data.success) {
        throw new Error(data.error ?? "Failed to load schedule");
      }

      setItems(data.data.items as WorkspaceCalendarItem[]);
      hasLoadedOnceRef.current = true;
      setHasLoadedOnce(true);

      window.setTimeout(() => {
        void runCalendarBackgroundSync({
          params,
          onData: (next) => {
            if (generation !== loadGenerationRef.current) return;
            setItems(next.items);
          },
        });
      }, 250);
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "Calendar took too long to load. Pull to refresh or try again."
          : err instanceof Error
            ? err.message
            : "Failed to load schedule",
      );
      hasLoadedOnceRef.current = true;
      setHasLoadedOnce(true);
      setItems([]);
    } finally {
      window.clearTimeout(loadingWatchdog);
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [fetchRangeKey]);

  const moveEvent = useCallback(
    async (id: string, startAt: string, endAt: string | null) => {
      const item = items.find((entry) => entry.id === id);
      if (!item?.editable) return false;

      const previous = items;
      setItems((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, startAt, endAt } : entry,
        ),
      );

      const { moveHubEvent } = await import("@/lib/calendar/hub-event-actions");
      const success = await moveHubEvent(item, startAt, endAt);
      if (!success) {
        setItems(previous);
        return false;
      }

      return true;
    },
    [items],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void load();
  }, [load]);

  const events = useMemo(() => workspaceItemsToHubEvents(items), [items]);

  return {
    events,
    items,
    loading: loading && !hasLoadedOnce,
    hasLoadedOnce,
    error,
    refresh: load,
    moveEvent,
  };
}

export type { CalendarEvent };
