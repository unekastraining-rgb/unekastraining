"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { startOfWeek } from "@/lib/calendar/date-utils";
import { workspaceItemsToHubEvents } from "@/lib/calendar/hub-adapters";
import { triggerGoogleSyncIfStale } from "@/lib/calendar/google-background-sync";
import { triggerLmsSyncIfStale } from "@/lib/lms/background-sync";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRange = useMemo(
    () => getHubFetchRange(anchorDate),
    [anchorDate],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        start: fetchRange.start.toISOString(),
        end: fetchRange.end.toISOString(),
      });
      const response = await fetch(`/api/calendar?${params}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? "Failed to load schedule");
      }
      setItems(data.data.items as WorkspaceCalendarItem[]);

      const statusResponse = await fetch("/api/calendar/google/status");
      const statusJson = await statusResponse.json();
      let shouldRefresh = false;
      if (statusJson.success) {
        const googleSynced = await triggerGoogleSyncIfStale(
          statusJson.connections ?? [],
        );
        if (googleSynced) shouldRefresh = true;
      }

      const lmsResponse = await fetch("/api/lms/connect");
      const lmsJson = await lmsResponse.json();
      if (lmsJson.success) {
        const lmsSynced = await triggerLmsSyncIfStale(lmsJson.connections ?? []);
        if (lmsSynced) shouldRefresh = true;
      }

      if (shouldRefresh) {
        const refresh = await fetch(`/api/calendar?${params}`);
        const refreshJson = await refresh.json();
        if (refreshJson.success) {
          setItems(refreshJson.data.items as WorkspaceCalendarItem[]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchRange.end, fetchRange.start]);

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
    void load();
  }, [load]);

  const events = useMemo(() => workspaceItemsToHubEvents(items), [items]);

  return { events, items, loading, error, refresh: load, moveEvent };
}

export type { CalendarEvent };
