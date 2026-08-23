"use client";

import { useEffect, useRef } from "react";

import type { AppNotification } from "@/lib/notifications";

const SEEN_KEY = "study-haul-notified-ids";

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>) {
  const trimmed = [...ids].slice(-100);
  localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
}

export function DesktopNotificationWatcher({
  enabled,
}: {
  enabled: boolean;
}) {
  const seenRef = useRef<Set<string>>(readSeen());

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    async function poll() {
      if (Notification.permission !== "granted") return;

      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (!data.success) return;

      const items = data.data as AppNotification[];
      for (const item of items) {
        if (item.severity === "low") continue;
        if (seenRef.current.has(item.id)) continue;

        seenRef.current.add(item.id);
        writeSeen(seenRef.current);

        try {
          const notification = new Notification(item.title, {
            body: item.description,
            tag: item.id,
          });

          notification.onclick = () => {
            window.focus();
            window.location.assign(item.href);
            notification.close();
          };
        } catch {
          // ignore blocked notifications
        }
      }
    }

    void poll();
    const interval = window.setInterval(() => void poll(), 2 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [enabled]);

  return null;
}

export async function requestDesktopNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported" as const;
  }
  if (Notification.permission === "granted") return "granted" as const;
  if (Notification.permission === "denied") return "denied" as const;
  const result = await Notification.requestPermission();
  return result;
}
