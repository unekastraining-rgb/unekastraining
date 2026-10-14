"use client";

import Link from "next/link";
import { CalendarDays, FolderOpen, LogOut } from "lucide-react";

import { hubTabs } from "./hubTabs";
import { StudyHaulSidebarTruck } from "./StudyHaulSidebarTruck";
import type { HubTab } from "./types";
import { useCompactHubNav } from "@/hooks/useCompactHubNav";
import { useIsClientMounted } from "@/hooks/useClientSnapshot";
import { useTapHandler } from "@/hooks/useTapHandler";

const mainTabs = hubTabs.filter((tab) => tab.id !== "settings");
const settingsTab = hubTabs.find((tab) => tab.id === "settings")!;

export function SidebarNav({
  active,
  onChange,
  variant = "sidebar",
}: {
  active: HubTab;
  onChange: (tab: HubTab) => void;
  /** `drawer` = always visible inside the mobile hamburger sheet */
  variant?: "sidebar" | "drawer";
}) {
  const compactNav = useCompactHubNav();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (variant === "sidebar" && compactNav) {
    return null;
  }

  const shellClass =
    variant === "drawer"
      ? "w-full shrink-0"
      : "hidden w-60 shrink-0 xl:block xl:w-72";

  return (
    <aside className={shellClass}>
      <nav
        className={
          variant === "drawer"
            ? "flex min-h-0 flex-col overflow-hidden rounded-2xl border p-2"
            : "sticky top-24 flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-[1.75rem] border p-2.5"
        }
        style={{
          background: "var(--sh-sidebar-surface)",
          borderColor: "var(--sh-border-subtle)",
          boxShadow: "var(--sh-elevation-1)",
        }}
      >
        <div className="space-y-1">
          {mainTabs.map((tab) => {
            if (tab.id === "hub") {
              return (
                <div key="hub-group">
                  <SidebarButton
                    icon={tab.icon}
                    label={tab.label}
                    description={tab.description}
                    isActive={active === "hub"}
                    onClick={() => onChange("hub")}
                  />
                  <SidebarLink
                    icon={CalendarDays}
                    label="Calendar"
                    description="Full schedule view"
                    href="/calendar"
                  />
                  <SidebarLink
                    icon={FolderOpen}
                    label="Resources"
                    description="School links & services"
                    href="/resources"
                  />
                </div>
              );
            }

            return (
              <SidebarButton
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                description={tab.description}
                isActive={active === tab.id}
                onClick={() => onChange(tab.id)}
              />
            );
          })}
        </div>

        <div
          className="mt-auto space-y-1 border-t pt-2"
          style={{ borderColor: "color-mix(in srgb, var(--sh-primary) 18%, transparent)" }}
        >
          <SidebarButton
            icon={settingsTab.icon}
            label={settingsTab.label}
            description={settingsTab.description}
            isActive={active === "settings"}
            onClick={() => onChange("settings")}
          />
          <StudyHaulSidebarTruck />
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3.5 rounded-full px-4 py-3 text-left text-stone-600 transition hover:bg-[var(--sh-warm-soft)] hover:text-[var(--sh-deep)]"
          >
            <span className="shrink-0" suppressHydrationWarning aria-hidden>
              <LogOut className="h-[1.375rem] w-[1.375rem] shrink-0 text-stone-400" />
            </span>
            <div>
              <p className="text-[0.9375rem] font-semibold">Sign out</p>
              <p className="text-xs text-stone-500">Leave Study Haul</p>
            </div>
          </button>
        </div>
      </nav>
    </aside>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  description,
  isActive,
  onClick,
}: {
  icon: typeof CalendarDays;
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const mounted = useIsClientMounted();
  const showActive = mounted && isActive;
  const tap = useTapHandler(onClick);

  return (
    <button
      type="button"
      {...tap}
      suppressHydrationWarning
      className={`flex w-full items-center gap-3.5 rounded-full px-4 py-3 text-left transition touch-manipulation ${
        showActive ? "nav-pill-active" : "text-stone-600 sidebar-nav-hover hover:text-stone-900"
      }`}
    >
      <span className="shrink-0" suppressHydrationWarning aria-hidden>
        <Icon
          className={`h-[1.375rem] w-[1.375rem] ${showActive ? "text-brand" : "text-stone-400"}`}
        />
      </span>
      <div className="min-w-0" suppressHydrationWarning>
        <p className="text-[0.9375rem] font-semibold leading-snug">{label}</p>
        <p className="text-xs leading-snug text-stone-500">{description}</p>
      </div>
    </button>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: typeof CalendarDays;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      suppressHydrationWarning
      className="flex w-full items-center gap-3.5 rounded-full px-4 py-3 text-left text-stone-600 transition sidebar-link-hover hover:text-stone-900"
    >
      <span className="shrink-0" suppressHydrationWarning aria-hidden>
        <Icon className="h-[1.375rem] w-[1.375rem] text-teal-600" />
      </span>
      <div className="min-w-0" suppressHydrationWarning>
        <p className="text-[0.9375rem] font-semibold leading-snug">{label}</p>
        <p className="text-xs leading-snug text-stone-500">{description}</p>
      </div>
    </Link>
  );
}
