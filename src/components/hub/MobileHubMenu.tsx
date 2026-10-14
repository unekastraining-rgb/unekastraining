"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Backpack,
  BookOpen,
  CalendarDays,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  X,
} from "lucide-react";

import { useCompactHubNav } from "@/hooks/useCompactHubNav";
import { useTapHandler } from "@/hooks/useTapHandler";
import { hubTabPath } from "@/lib/hub/tabs";

import type { HubTab } from "./types";

const MENU_LINKS: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  tab?: HubTab;
}> = [
  { href: "/dashboard", label: "Hub", icon: LayoutDashboard, tab: "hub" },
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/core", label: "Core", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/resources", label: "Resources", icon: FolderOpen },
  { href: hubTabPath("classes"), label: "My Courses", icon: GraduationCap, tab: "classes" },
  { href: hubTabPath("locker"), label: "Locker", icon: Backpack, tab: "locker" },
  { href: hubTabPath("chat"), label: "Chat", icon: MessageCircle, tab: "chat" },
  { href: hubTabPath("settings"), label: "Settings", icon: Settings, tab: "settings" },
];

/**
 * Phone + iPad replacement for the left sidebar — hamburger opens Study/Core/Hub links.
 * Portaled above hub chrome so touch stacking / ghost-clicks don't instantly close it.
 */
export function MobileHubMenu({
  active,
  onChange,
}: {
  active: HubTab;
  onChange: (tab: HubTab) => void;
}) {
  const compactNav = useCompactHubNav();
  const [open, setOpen] = useState(false);
  const openedAtRef = useRef(0);
  const tapOpen = useTapHandler(() => {
    openedAtRef.current = Date.now();
    setOpen(true);
  });
  const tapClose = useTapHandler(() => {
    if (Date.now() - openedAtRef.current < 450) return;
    setOpen(false);
  });

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const tapSignOut = useTapHandler(() => void signOut());

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!compactNav) return null;

  return (
    <div>
      <button
        type="button"
        {...tapOpen}
        className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-xl border border-brand bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm touch-manipulation hover:bg-brand-soft"
        aria-label="Open hub menu"
      >
        <Menu className="h-5 w-5" />
        <span className="sm:inline">Menu</span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[560]"
              role="dialog"
              aria-modal="true"
              data-hub-mobile-menu
            >
              <button
                type="button"
                className="absolute inset-0 bg-stone-900/40"
                aria-label="Close menu"
                {...tapClose}
              />
              <aside className="absolute inset-y-0 left-0 flex w-[min(100vw-3rem,20rem)] flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-brand/30 px-3 py-3">
                  <p className="text-sm font-bold text-stone-800">Study Haul</p>
                  <button
                    type="button"
                    {...tapClose}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-500 touch-manipulation hover:bg-stone-100"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                  {MENU_LINKS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.tab != null
                        ? active === item.tab && item.href.startsWith("/dashboard")
                        : false;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          if (item.tab) onChange(item.tab);
                          setOpen(false);
                        }}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold touch-manipulation ${
                          isActive
                            ? "bg-brand-soft text-stone-900"
                            : "text-stone-700 hover:bg-brand-soft"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t border-brand/30 p-2">
                  <button
                    type="button"
                    {...tapSignOut}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-600 touch-manipulation hover:bg-rose-50 hover:text-rose-700"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
