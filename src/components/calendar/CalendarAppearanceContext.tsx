"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  resolveCalendarAppearance,
  type CalendarAppearance,
} from "@/lib/calendar/calendar-themes";
import type { CalendarSettings } from "@/lib/calendar/settings";

const CalendarAppearanceContext = createContext<CalendarAppearance | null>(null);

export function CalendarAppearanceProvider({
  settings,
  children,
}: {
  settings: CalendarSettings;
  children: ReactNode;
}) {
  const appearance = resolveCalendarAppearance(settings);
  return (
    <CalendarAppearanceContext.Provider value={appearance}>
      <div
        className="calendar-themed flex min-h-0 flex-1 flex-col"
        style={
          {
            "--cal-bg": appearance.backgroundColor,
            "--cal-accent": appearance.accentColor,
            "--cal-text": appearance.textColor,
            "--cal-muted": appearance.mutedTextColor,
            "--cal-grid": appearance.gridLineColor,
            "--cal-header-bg": appearance.headerBackground,
            "--cal-event-fill": appearance.eventFillOpacity,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </CalendarAppearanceContext.Provider>
  );
}

export function useCalendarAppearance(): CalendarAppearance {
  const context = useContext(CalendarAppearanceContext);
  if (!context) {
    return resolveCalendarAppearance({
      defaultView: "week",
      weekStartsOn: "monday",
      workingHoursStart: 7,
      workingHoursEnd: 22,
      defaultEventDurationMinutes: 60,
      colorScale: "pastel",
      themeId: "coursicle-classic",
      backgroundColor: null,
      accentColor: null,
      customEventPalette: null,
      personalCalendarColor: "#6366f1",
      hiddenCalendarIds: [],
      showTimeInsights: true,
      googleWriteEnabled: true,
      defaultGoogleConnectionId: null,
    });
  }
  return context;
}
