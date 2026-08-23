"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Heart, Search, Sticker, Upload } from "lucide-react";

import { resolvePageImageSrc } from "@/lib/core/clip-art-catalog";
import {
  CLIP_ART_GROUP_LABELS,
  searchStickers,
  STICKER_CATALOG,
  STICKER_GROUPS_LIST,
  type StickerDefinition,
} from "@/lib/core/stickers/catalog";
import type { ClipArtGroup } from "@/lib/core/clip-art-catalog";
import {
  getElementFavorites,
  getRecentElements,
  recordRecentElement,
  toggleElementFavorite,
} from "@/lib/core/elements/storage";

export function StickersPanel({
  onInsert,
  compact = false,
}: {
  onInsert: (assetId: string) => void;
  compact?: boolean;
}) {
  const [group, setGroup] = useState<ClipArtGroup>("stickers");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"browse" | "favorites" | "recent" | "mine">("browse");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [imported, setImported] = useState<Array<{ id: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFavorites(getElementFavorites());
    setRecent(getRecentElements());
  }, []);

  const loadImported = useCallback(async () => {
    const res = await fetch("/api/customization/templates");
    if (!res.ok) return;
    const assets = (await res.json()) as Array<{ id: string; name: string; kind: string }>;
    setImported(assets.filter((a) => a.kind === "sticker"));
  }, []);

  useEffect(() => {
    void loadImported();
  }, [loadImported]);

  const catalogById = useMemo(() => {
    const map = new Map<string, StickerDefinition>();
    for (const item of STICKER_CATALOG) map.set(`sticker-${item.id}`, item);
    return map;
  }, []);

  const browseItems = useMemo(() => searchStickers(search, group), [search, group]);

  const favoriteItems = useMemo(
    () =>
      favorites
        .map((id) => catalogById.get(id))
        .filter((item): item is StickerDefinition => Boolean(item)),
    [favorites, catalogById],
  );

  const recentItems = useMemo(
    () =>
      recent
        .map((id) => catalogById.get(id))
        .filter((item): item is StickerDefinition => Boolean(item)),
    [recent, catalogById],
  );

  const displayed =
    tab === "favorites"
      ? favoriteItems
      : tab === "recent"
        ? recentItems
        : tab === "mine"
          ? imported.map((a) => ({
              id: a.id,
              name: a.name,
              group: "stickers" as ClipArtGroup,
              assetId: a.id,
              tags: ["imported"],
              src: "",
            }))
          : browseItems;

  function handleInsert(sticker: StickerDefinition | { assetId: string; id: string; name: string }) {
    const stickerId = "group" in sticker ? `sticker-${sticker.id}` : `imported-${sticker.id}`;
    recordRecentElement(stickerId);
    onInsert(sticker.assetId);
  }

  async function uploadSticker(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.[^.]+$/, ""));
      form.append("kind", "sticker");
      const res = await fetch("/api/customization/templates", { method: "POST", body: form });
      if (res.ok) {
        await loadImported();
        const created = (await res.json()) as { id: string };
        onInsert(created.id);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Stickers</p>
        {!compact ? (
          <p className="mt-0.5 text-[10px] text-stone-500">
            Decorative illustrations — separate from functional Elements.
          </p>
        ) : null}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {(
          [
            { id: "browse", label: "Browse", icon: Sticker },
            { id: "favorites", label: "Favorites", icon: Heart },
            { id: "recent", label: "Recent", icon: Clock },
            { id: "mine", label: "My Stickers", icon: Upload },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold ${
              tab === id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stickers…"
          className="w-full rounded-lg border border-stone-200 py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-orange-300"
        />
      </div>

      {tab === "browse" ? (
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {STICKER_GROUPS_LIST.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setGroup(key)}
              className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                group === key ? "bg-violet-500 text-white" : "bg-stone-100 text-stone-600"
              }`}
            >
              {CLIP_ART_GROUP_LABELS[key]}
            </button>
          ))}
        </div>
      ) : null}

      {tab === "mine" ? (
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-3 py-2.5 text-xs font-semibold">
          <Upload className="h-4 w-4 text-violet-500" />
          {uploading ? "Importing…" : "Import sticker PNG / JPG / SVG"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadSticker(file);
              e.target.value = "";
            }}
          />
        </label>
      ) : null}

      <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5">
        {displayed.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleInsert(item)}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-stone-100 bg-stone-50 p-1.5 hover:border-violet-200 hover:bg-violet-50/50"
            title={item.name}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                item.src
                  ? `/${item.src}`
                  : resolvePageImageSrc(item.assetId)
              }
              alt=""
              className="h-10 w-10 object-contain"
            />
            <span className="w-full truncate text-center text-[9px] font-semibold text-stone-600">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
