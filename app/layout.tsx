import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

import { GlobalSearchLauncher } from "@/components/hub/GlobalSearchLauncher";
import { AppThemeRoot } from "@/components/theme/AppThemeRoot";
import {
  computeThemeCssVariables,
  reconstructPaletteFromSettings,
} from "@/lib/customization/apply-palette";
import { getOrCreateUserPreferences } from "@/lib/preferences";
import { resolveThemeColors } from "@/lib/theme/templates";
import { DEFAULT_THEME_SETTINGS } from "@/lib/theme/types";
import { getCurrentUser } from "@/lib/user";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study Haul",
  description: "Your colorful academic hub — classes, deadlines, and study tools in one place.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const preferences = user
    ? await getOrCreateUserPreferences(user.id)
    : DEFAULT_THEME_SETTINGS;
  const themeVars = computeThemeCssVariables(
    resolveThemeColors(preferences),
    reconstructPaletteFromSettings(preferences),
  );

  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
      style={themeVars as CSSProperties}
    >
      <body className="min-h-full overflow-x-clip">
        <AppThemeRoot initialSettings={preferences}>
          {children}
          <GlobalSearchLauncher />
        </AppThemeRoot>
      </body>
    </html>
  );
}
