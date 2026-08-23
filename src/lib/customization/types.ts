/** User content colors — separate from app UI theme (ThemeProvider). */

export interface UserPalette {
  id: string;
  name: string;
  colors: string[];
  builtin?: false;
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BuiltinPalette {
  id: string;
  name: string;
  colors: string[];
  categoryId: string;
  builtin: true;
}

export type ColorPalette = UserPalette | BuiltinPalette;

export interface PaletteCategory {
  id: string;
  name: string;
  group: "seasonal" | "mood" | "family" | "academic" | "special";
}

export interface CustomizationState {
  recentColors: string[];
  favoriteColors: string[];
  userPalettes: UserPalette[];
  favoritePaletteIds: string[];
  recentTemplateAssetIds: string[];
  favoriteTemplateAssetIds: string[];
}

export const DEFAULT_CUSTOMIZATION: CustomizationState = {
  recentColors: [],
  favoriteColors: [],
  userPalettes: [],
  favoritePaletteIds: [],
  recentTemplateAssetIds: [],
  favoriteTemplateAssetIds: [],
};

export type MediaAssetKind = "template" | "background" | "sticker" | "element" | "palette_source";

export interface MediaAssetRecord {
  id: string;
  name: string;
  kind: MediaAssetKind;
  mimeType: string;
  category: string;
  metadataJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const MAX_RECENT_COLORS = 24;
export const MAX_FAVORITE_COLORS = 48;
