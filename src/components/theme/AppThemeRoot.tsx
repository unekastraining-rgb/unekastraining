"use client";

import { TouchChromeGuard } from "@/components/TouchChromeGuard";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import type { UserThemeSettings } from "@/lib/theme/types";

export function AppThemeRoot({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: UserThemeSettings;
}) {
  return (
    <ThemeProvider initialSettings={initialSettings}>
      <TouchChromeGuard />
      {children}
    </ThemeProvider>
  );
}
