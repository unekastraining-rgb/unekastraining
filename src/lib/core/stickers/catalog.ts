/**
 * Decorative sticker library — separate from functional Elements.
 */

import {
  CLIP_ART_GROUP_LABELS,
  CLIP_ART_GROUPS,
  SITE_CLIP_ART,
  toSiteAssetId,
  type ClipArtGroup,
  type SiteClipArtItem,
} from "@/lib/core/clip-art-catalog";

const STICKER_GROUPS = new Set<ClipArtGroup>([
  "stickers",
  "decorative",
  "animated",
  "expressive",
]);

export interface StickerDefinition {
  id: string;
  name: string;
  group: ClipArtGroup;
  assetId: string;
  tags: string[];
  src: string;
}

function toSticker(item: SiteClipArtItem): StickerDefinition {
  return {
    id: item.id,
    name: item.label,
    group: item.group,
    assetId: toSiteAssetId(item),
    tags: [item.label.toLowerCase(), ...(item.tags ?? []), item.group],
    src: item.src,
  };
}

export const STICKER_CATALOG: StickerDefinition[] = SITE_CLIP_ART.filter((item) =>
  STICKER_GROUPS.has(item.group),
).map(toSticker);

export const STICKER_GROUPS_LIST = CLIP_ART_GROUPS.filter((g) => STICKER_GROUPS.has(g));

export function searchStickers(query: string, group?: ClipArtGroup): StickerDefinition[] {
  const q = query.trim().toLowerCase();
  return STICKER_CATALOG.filter((item) => {
    if (group && item.group !== group) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.includes(q) || q.includes(tag))
    );
  });
}

export { CLIP_ART_GROUP_LABELS };
