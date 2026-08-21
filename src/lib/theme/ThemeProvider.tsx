"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { UserThemeSettings } from "./types";
import { DEFAULT_THEME_SETTINGS } from "./types";
import { resolveThemeColors } from "./templates";
import { applyThemeCssVariables, reconstructPaletteFromSettings } from "@/lib/customization/apply-palette";

interface ThemeContextValue {
  settings: UserThemeSettings;
  colors: ReturnType<typeof resolveThemeColors>;
  updateSettings: (patch: Partial<UserThemeSettings>) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "study-haul-theme";

function readStoredSettings(): UserThemeSettings | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return null;
  }
}

export function ThemeProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: UserThemeSettings;
}) {
  const [settings, setSettings] = useState<UserThemeSettings>(() => {
    if (initialSettings) return initialSettings;
    return readStoredSettings() ?? DEFAULT_THEME_SETTINGS;
  });
  const [loading, setLoading] = useState(false);

  const colors = useMemo(() => resolveThemeColors(settings), [settings]);

  useEffect(() => {
    applyThemeCssVariables(
      colors,
      reconstructPaletteFromSettings(settings) ?? undefined,
    );
  }, [colors, settings]);

  const updateSettings = useCallback(
    async (patch: Partial<UserThemeSettings>) => {
      setLoading(true);
      const next = { ...settings, ...patch };
      setSettings(next);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        await fetch("/api/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      } catch (error) {
        console.error("Failed to save theme settings:", error);
      } finally {
        setLoading(false);
      }
    },
    [settings],
  );

  return (
    <ThemeContext.Provider value={{ settings, colors, updateSettings, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function useThemeOptional() {
  return useContext(ThemeContext);
}
