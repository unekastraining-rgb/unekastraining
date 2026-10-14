"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Menu } from "lucide-react";

import { ClientIcon } from "@/components/ui/ClientIcon";
import { useTapHandler } from "@/hooks/useTapHandler";
import { getStudyCapability } from "@/lib/study/capability-registry";

type MenuItem = { href: string; label: string };

/**
 * Bundle M — capability destinations come from the registry when present.
 * Hub chrome / account destinations remain menu-local (not StudyCapabilities).
 */
function buildMenuItems(): MenuItem[] {
  const cap = (id: string, labelOverride?: string): MenuItem | null => {
    const c = getStudyCapability(id);
    if (!c) return null;
    return { href: c.directPath, label: labelOverride ?? c.label };
  };

  const fromRegistry = [
    cap("games"),
    cap("practice", "Practice"),
    cap("six", "Six Techniques"),
    cap("planner"),
    cap("quizzes"),
    cap("flashcards"),
    cap("haul", "The Haul"),
  ].filter((item): item is MenuItem => Boolean(item));

  /** Intentional chrome / navigation — not parallel capability catalogs. */
  const hubChrome: MenuItem[] = [
    { href: "/dashboard", label: "Hub" },
    { href: "/dashboard?tab=classes", label: "My Courses" },
    { href: "/dashboard?tab=locker", label: "Locker" },
    { href: "/dashboard?tab=chat", label: "Chat" },
    { href: "/study", label: "Study" },
    { href: "/study/learning-habits", label: "Learning & Habits" },
  ];

  const afterCapabilities: MenuItem[] = [
    { href: "/core", label: "Core" },
    { href: "/calendar", label: "Calendar" },
    { href: "/resources", label: "Resources" },
    { href: "/courses", label: "Add / manage classes" },
    { href: "/dashboard?tab=settings", label: "Settings" },
  ];

  return [...hubChrome, ...fromRegistry, ...afterCapabilities];
}

const MENU_ITEMS = buildMenuItems();

/** Always-visible sections menu — Classes, Locker, Chat, The Haul, etc. */
export function HubSectionsMenu({
  className = "",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const openedAtRef = useRef(0);
  const tapToggle = useTapHandler(() => {
    setOpen((value) => {
      const next = !value;
      if (next) openedAtRef.current = Date.now();
      return next;
    });
  });

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setCoords(null);
      return;
    }
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (Date.now() - openedAtRef.current < 450) return;
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-hub-sections-menu]")) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        data-hub-chrome
        aria-expanded={open}
        aria-haspopup="menu"
        {...tapToggle}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-brand bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 touch-manipulation hover:bg-brand-soft"
      >
        <ClientIcon icon={Menu} className="h-4 w-4" />
        Menu
        <ClientIcon
          icon={ChevronDown}
          className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              role="menu"
              data-hub-sections-menu
              className="fixed z-[560] w-56 overflow-hidden rounded-2xl border border-brand bg-white py-1 shadow-xl"
              style={{ top: coords.top, right: coords.right }}
            >
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  data-hub-chrome
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-stone-700 touch-manipulation hover:bg-brand-soft"
                >
                  {item.label}
                </Link>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
