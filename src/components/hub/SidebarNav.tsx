"use client";

import Link from "next/link";
import { CalendarDays, FolderOpen, LogOut } from "lucide-react";

import { hubTabs } from "./hubTabs";
import { StudyHaulSidebarTruck } from "./StudyHaulSidebarTruck";
import type { HubTab } from "./types";

const mainTabs = hubTabs.filter((tab) => tab.id !== "settings");
const settingsTab = hubTabs.find((tab) => tab.id === "settings")!;

export function SidebarNav({
  active,
  onChange,
}: {
  active: HubTab;
  onChange: (tab: HubTab) => void;
}) {
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="hidden w-60 shrink-0 lg:w-64 xl:w-72 md:block">
      <nav
        className="sticky top-24 flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-[1.75rem] border p-2.5"
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
            <LogOut className="h-[1.375rem] w-[1.375rem] shrink-0 text-stone-400" />
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3.5 rounded-full px-4 py-3 text-left transition ${
        isActive ? "nav-pill-active" : "text-stone-600 hover:bg-[var(--sh-primary-soft)]/60 hover:text-stone-900"
      }`}
    >
      <Icon
        className={`h-[1.375rem] w-[1.375rem] shrink-0 ${isActive ? "text-[var(--sh-primary)]" : "text-stone-400"}`}
      />
      <div className="min-w-0">
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
      className="flex w-full items-center gap-3.5 rounded-full px-4 py-3 text-left text-stone-600 transition hover:bg-[var(--sh-accent-soft)]/70 hover:text-stone-900"
    >
      <Icon className="h-[1.375rem] w-[1.375rem] shrink-0 text-[var(--sh-accent)]" />
      <div className="min-w-0">
        <p className="text-[0.9375rem] font-semibold leading-snug">{label}</p>
        <p className="text-xs leading-snug text-stone-500">{description}</p>
      </div>
    </Link>
  );
}
