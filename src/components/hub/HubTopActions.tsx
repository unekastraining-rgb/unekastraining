"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";

import { StudyHaulTruckMark } from "@/components/brand/StudyHaulTruckMark";
import { ClientIcon } from "@/components/ui/ClientIcon";
import { useIsClientMounted } from "@/hooks/useClientSnapshot";
import { hubTabPath } from "@/lib/hub/tabs";

/** Settings, animated truck, and sign out — shown top-right on all pages except the hub dashboard. */
export function HubTopActions() {
  const mounted = useIsClientMounted();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2" suppressHydrationWarning>
      <Link
        href={hubTabPath("settings")}
        data-hub-chrome
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-brand bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-brand-soft touch-manipulation sm:px-3"
        title="Settings"
      >
        <ClientIcon icon={Settings} className="h-3.5 w-3.5 text-brand" />
        <span className="hidden sm:inline">Settings</span>
      </Link>

      {mounted ? (
        <div
          aria-hidden
          className="hub-truck-lane-gradient relative hidden h-9 w-16 overflow-hidden rounded-full border border-brand sm:block"
        >
          <div className="absolute inset-x-2 top-1/2 border-t border-dashed border-brand/80" />
          <div className="absolute top-1/2 -translate-y-[58%] animate-[haul-truck-sidebar_7s_ease-in-out_infinite]">
            <StudyHaulTruckMark className="h-6 w-[4.25rem]" />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void signOut()}
        data-hub-chrome
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-brand bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-rose-50 hover:text-rose-700 touch-manipulation sm:px-3"
        title="Sign out"
      >
        <ClientIcon icon={LogOut} className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
