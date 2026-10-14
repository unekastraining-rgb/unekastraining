"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Backpack,
  BookOpen,
  CalendarDays,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Settings,
} from "lucide-react";

import { useCompactHubNav } from "@/hooks/useCompactHubNav";
import { hubTabPath } from "@/lib/hub/tabs";

import type { HubTab } from "./types";

type MobileNavItem =
  | { id: "hub"; label: string; icon: typeof LayoutDashboard; href: string }
  | { id: "study"; label: string; icon: typeof BookOpen; href: string }
  | { id: "calendar"; label: string; icon: typeof CalendarDays; href: string }
  | { id: "resources"; label: string; icon: typeof FolderOpen; href: string }
  | { id: "core"; label: string; icon: typeof FileText; href: string }
  | { id: HubTab; label: string; icon: typeof GraduationCap; href: string; tab: HubTab }
  | { id: "settings"; label: string; icon: typeof Settings; href: string; tab: "settings" };

const mobileNavItems: MobileNavItem[] = [
  { id: "hub", label: "Hub", icon: LayoutDashboard, href: "/dashboard" },
  { id: "study", label: "Study", icon: BookOpen, href: "/study" },
  { id: "core", label: "Core", icon: FileText, href: "/core" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { id: "resources", label: "Resources", icon: FolderOpen, href: "/resources" },
  {
    id: "classes",
    label: "My Courses",
    icon: GraduationCap,
    href: hubTabPath("classes"),
    tab: "classes",
  },
  {
    id: "locker",
    label: "Locker",
    icon: Backpack,
    href: hubTabPath("locker"),
    tab: "locker",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageCircle,
    href: hubTabPath("chat"),
    tab: "chat",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: hubTabPath("settings"),
    tab: "settings",
  },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: HubTab;
  onChange: (tab: HubTab) => void;
}) {
  const compactNav = useCompactHubNav();
  const pathname = usePathname();
  const urlTab = active;
  const coreActive = pathname.startsWith("/core");
  const studyActive = pathname.startsWith("/study");
  const resourcesActive = pathname.startsWith("/resources");
  const calendarActive = pathname.startsWith("/calendar");
  const onDashboard = pathname.startsWith("/dashboard");

  if (!compactNav) return null;

  return (
    <nav
      data-hub-chrome
      className="fixed inset-x-0 bottom-0 z-50 border-t"
      style={{
        borderColor: "var(--sh-border)",
        background: "var(--sh-surface-card, #fffaf5)",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-start gap-0 overflow-x-auto px-1 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === "core"
              ? coreActive
              : item.id === "study"
                ? studyActive
                : item.id === "resources"
                  ? resourcesActive
                  : item.id === "calendar"
                    ? calendarActive
                    : item.id === "hub"
                      ? onDashboard && urlTab === "hub"
                      : onDashboard && "tab" in item && urlTab === item.tab;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                if (item.id === "hub") onChange("hub");
                else if ("tab" in item) onChange(item.tab);
              }}
              className={`flex min-h-11 min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2 transition touch-manipulation ${
                isActive ? "nav-pill-active" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""}`} />
              <span className="max-w-full truncate text-[10px] font-semibold tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
