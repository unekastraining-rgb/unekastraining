"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CustomizationState, UserPalette } from "@/lib/customization/types";

interface CustomizationContextValue {
  state: CustomizationState;
  loading: boolean;
  recordColor: (color: string) => Promise<void>;
  toggleFavorite: (color: string) => Promise<void>;
  removeRecent: (color: string) => Promise<void>;
  savePalette: (palette: Omit<UserPalette, "id"> & { id?: string }) => Promise<void>;
  deletePalette: (id: string) => Promise<void>;
  toggleFavoritePalette: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CustomizationContext = createContext<CustomizationContextValue | null>(null);

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CustomizationState>({
    recentColors: [],
    favoriteColors: [],
    userPalettes: [],
    favoritePaletteIds: [],
    recentTemplateAssetIds: [],
    favoriteTemplateAssetIds: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/customization");
    if (res.ok) {
      const data = (await res.json()) as CustomizationState;
      setState(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch("/api/customization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = (await res.json()) as CustomizationState;
      setState(data);
    }
  }

  const recordColor = useCallback(async (color: string) => {
    await patch({ action: "recordColor", color });
  }, []);

  const toggleFavorite = useCallback(async (color: string) => {
    await patch({ action: "toggleFavoriteColor", color });
  }, []);

  const removeRecent = useCallback(async (color: string) => {
    await patch({ action: "removeRecentColor", color });
  }, []);

  const savePalette = useCallback(
    async (palette: Omit<UserPalette, "id"> & { id?: string }) => {
      await patch({ action: "upsertPalette", palette });
    },
    [],
  );

  const deletePalette = useCallback(async (id: string) => {
    await patch({ action: "deletePalette", paletteId: id });
  }, []);

  const toggleFavoritePalette = useCallback(async (id: string) => {
    await patch({ action: "toggleFavoritePalette", paletteId: id });
  }, []);

  const value = useMemo(
    () => ({
      state,
      loading,
      recordColor,
      toggleFavorite,
      removeRecent,
      savePalette,
      deletePalette,
      toggleFavoritePalette,
      refresh,
    }),
    [
      state,
      loading,
      recordColor,
      toggleFavorite,
      removeRecent,
      savePalette,
      deletePalette,
      toggleFavoritePalette,
      refresh,
    ],
  );

  return (
    <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const ctx = useContext(CustomizationContext);
  if (!ctx) {
    throw new Error("useCustomization must be used within CustomizationProvider");
  }
  return ctx;
}

export function useCustomizationOptional() {
  return useContext(CustomizationContext);
}
