"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";

import type { AppNotification } from "@/lib/notifications";
import { useIsClientMounted } from "@/hooks/useClientSnapshot";
import { useTapHandler } from "@/hooks/useTapHandler";

export function HubNotifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const mounted = useIsClientMounted();
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/notifications", { credentials: "same-origin" });
    const data = await response.json();
    if (data.success) {
      setItems(data.data);
      setCount(data.unreadCount ?? 0);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  async function patchNotifications(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.success) {
        setItems(data.data);
        setCount(data.unreadCount ?? 0);
      }
    } finally {
      setBusy(false);
    }
  }

  async function dismissItem(event: React.MouseEvent, id: string) {
    event.preventDefault();
    event.stopPropagation();
    await patchNotifications({ dismiss: id });
  }

  async function markRead(id: string) {
    await patchNotifications({ read: id });
  }

  const toggleOpen = useTapHandler(() => setOpen((value) => !value));
  const tapMarkRead = useTapHandler(() => void patchNotifications({ markAllRead: true }));
  const tapDismissAll = useTapHandler(() => void patchNotifications({ dismissAll: true }));
  const tapClose = useTapHandler(() => setOpen(false));

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        {...toggleOpen}
        suppressHydrationWarning
        className="relative cursor-pointer rounded-xl border border-brand bg-white p-2.5 text-stone-600 transition touch-manipulation hover:bg-brand-soft"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <span className="shrink-0" suppressHydrationWarning aria-hidden>
          <Bell className="h-5 w-5" />
        </span>
        {mounted && count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[100] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-brand bg-white p-3 shadow-xl touch-manipulation">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-sm font-bold text-stone-900">Notifications</p>
            <div className="flex items-center gap-1">
              {items.length > 0 ? (
                <>
                  <button
                    type="button"
                    disabled={busy || count === 0}
                    {...tapMarkRead}
                    className="rounded px-2 py-1 text-[11px] font-semibold text-stone-500 transition touch-manipulation hover:bg-stone-100 disabled:opacity-40"
                  >
                    Mark read
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    {...tapDismissAll}
                    className="rounded px-2 py-1 text-[11px] font-semibold text-stone-500 transition touch-manipulation hover:bg-stone-100 disabled:opacity-40"
                  >
                    Clear all
                  </button>
                </>
              ) : null}
              <button
                type="button"
                {...tapClose}
                className="rounded p-1 text-stone-400 touch-manipulation hover:bg-stone-100"
              >
                <span className="shrink-0" suppressHydrationWarning aria-hidden>
                  <X className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
          {items.length === 0 ? (
            <p className="px-2 py-4 text-sm text-stone-500">All caught up.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="group relative">
                  <Link
                    href={item.href}
                    onClick={() => {
                      void markRead(item.id);
                      setOpen(false);
                    }}
                    className={`block rounded-xl border px-3 py-2.5 pr-9 text-sm transition hover:opacity-90 ${
                      item.severity === "high"
                        ? "border-rose-200 bg-rose-50"
                        : item.severity === "medium"
                          ? "border-amber-200 bg-amber-50"
                          : "border-brand bg-brand-soft/50"
                    } ${item.read ? "opacity-60" : ""}`}
                  >
                    <p className="font-semibold text-stone-900">{item.title}</p>
                    <p className="text-xs text-stone-600">{item.description}</p>
                  </Link>
                  <button
                    type="button"
                    onClick={(event) => void dismissItem(event, item.id)}
                    disabled={busy}
                    className="absolute right-2 top-2 rounded p-1 text-stone-400 opacity-0 transition hover:bg-white/80 group-hover:opacity-100"
                    aria-label={`Dismiss ${item.title}`}
                  >
                    <span className="shrink-0" suppressHydrationWarning aria-hidden>
                      <X className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
