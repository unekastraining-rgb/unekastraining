"use client";

import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

import { ClientIcon } from "@/components/ui/ClientIcon";
import { useTapHandler } from "@/hooks/useTapHandler";
import { useTheme } from "@/lib/theme/ThemeProvider";

export function GradeSchoolModeToggle() {
  const { settings, updateSettings } = useTheme();
  const router = useRouter();
  const on = settings.elementaryMode;

  const onTap = useTapHandler(() => {
    void (async () => {
      const next = !on;
      await updateSettings({ elementaryMode: next });
      if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
        router.refresh();
      }
    })();
  });

  return (
    <button
      type="button"
      {...onTap}
      role="switch"
      aria-checked={on}
      suppressHydrationWarning
      aria-label={on ? "Grade school mode on" : "Turn on grade school mode"}
      title={on ? "Grade school mode on — click for standard hub" : "Turn on grade school mode"}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition touch-manipulation sm:pr-3 ${
        on
          ? "border-teal-300 bg-teal-50 text-teal-800 shadow-sm shadow-teal-100 hover:bg-teal-100"
          : "border-brand bg-white text-stone-500 hover:bg-brand-soft"
      }`}
    >
      <ClientIcon
        icon={GraduationCap}
        className={`h-5 w-5 shrink-0 ${on ? "text-teal-700" : "text-stone-500"}`}
      />
      {on ? (
        <span className="hidden text-sm font-semibold sm:inline">Grade school</span>
      ) : null}
      <span
        aria-hidden
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? "bg-teal-500" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
