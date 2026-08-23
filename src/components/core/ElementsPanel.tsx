"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Heart,
  Search,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";

import {
  ELEMENT_CATEGORIES,
  ELEMENTS_CATALOG,
  importedAssetToElement,
  searchElements,
  type ElementCategoryId,
  type ElementDefinition,
  type ElementRole,
} from "@/lib/core/elements/catalog";
import { resolvePageImageSrc } from "@/lib/core/clip-art-catalog";
import {
  getElementFavorites,
  getRecentElements,
  recordRecentElement,
  toggleElementFavorite,
} from "@/lib/core/elements/storage";

type ElementsTab = "browse" | "favorites" | "recent" | "mine";

function ElementPreview({ element }: { element: ElementDefinition }) {
  if (element.insertType === "clip-art" && element.assetId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvePageImageSrc(element.assetId)}
        alt=""
        className="h-10 w-10 object-contain"
      />
    );
  }

  const color = element.defaultColor ?? "#fef3c7";
  if (element.insertType === "text-stamp") {
    return (
      <div
        className="flex h-10 w-full items-center justify-center rounded-md border px-1 text-[8px] font-bold uppercase leading-tight"
        style={{ borderColor: color, backgroundColor: `${color}44`, color: "#44403c" }}
      >
        {element.defaultText ?? element.name}
      </div>
    );
  }

  if (element.decorationKind === "sticky") {
    return (
      <div
        className="h-10 w-10 rounded-md border border-yellow-200 shadow-sm"
        style={{ backgroundColor: color }}
      />
    );
  }

  if (element.decorationKind === "number_bubble") {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white"
        style={{ backgroundColor: color }}
      >
        {element.defaultText ?? "1"}
      </div>
    );
  }

  return (
    <div
      className="h-10 w-10 rounded-md border-2"
      style={{ borderColor: color, backgroundColor: `${color}33` }}
    />
  );
}

export function ElementsPanel({
  onInsert,
  compact = false,
}: {
  onInsert: (element: ElementDefinition) => void;
  compact?: boolean;
}) {
  const [tab, setTab] = useState<ElementsTab>("browse");
  const [category, setCategory] = useState<ElementCategoryId | "all">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | ElementRole>("all");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [imported, setImported] = useState<Array<{ id: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFavorites(getElementFavorites());
    setRecent(getRecentElements());
  }, []);

  const loadImported = useCallback(async () => {
    const res = await fetch("/api/customization/templates?kind=element");
    if (!res.ok) return;
    const assets = (await res.json()) as Array<{ id: string; name: string; kind: string }>;
    setImported(assets.filter((asset) => asset.kind === "element"));
  }, []);

  useEffect(() => {
    void loadImported();
  }, [loadImported]);

  const catalogById = useMemo(() => {
    const map = new Map<string, ElementDefinition>();
    for (const item of ELEMENTS_CATALOG) map.set(item.id, item);
    for (const asset of imported) {
      const element = importedAssetToElement(asset);
      map.set(element.id, element);
    }
    return map;
  }, [imported]);

  const importedElements = useMemo(
    () => imported.map((asset) => importedAssetToElement(asset)),
    [imported],
  );

  const browseItems = useMemo(() => {
    const cat = category === "all" ? undefined : category;
    const role = roleFilter === "all" ? undefined : roleFilter;
    return searchElements(search, cat, role);
  }, [search, category, roleFilter]);

  const favoriteItems = useMemo(
    () =>
      favorites
        .map((id) => catalogById.get(id))
        .filter((item): item is ElementDefinition => Boolean(item)),
    [favorites, catalogById],
  );

  const recentItems = useMemo(
    () =>
      recent
        .map((id) => catalogById.get(id))
        .filter((item): item is ElementDefinition => Boolean(item)),
    [recent, catalogById],
  );

  const mineItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return importedElements;
    return importedElements.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.includes(q)),
    );
  }, [importedElements, search]);

  const displayedItems = useMemo(() => {
    if (tab === "favorites") return favoriteItems;
    if (tab === "recent") return recentItems;
    if (tab === "mine") return mineItems;
    return browseItems;
  }, [tab, favoriteItems, recentItems, mineItems, browseItems]);

  function handleInsert(element: ElementDefinition) {
    recordRecentElement(element.id);
    onInsert(element);
  }

  function handleFavorite(event: React.MouseEvent, id: string) {
    event.stopPropagation();
    setFavorites(toggleElementFavorite(id));
  }

  async function uploadElement(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.[^.]+$/, ""));
      form.append("kind", "element");
      const res = await fetch("/api/customization/templates", { method: "POST", body: form });
      if (res.ok) {
        await loadImported();
        const created = (await res.json()) as { id: string; name: string };
        handleInsert(importedAssetToElement(created));
      }
    } finally {
      setUploading(false);
    }
  }

  const tabs: Array<{ id: ElementsTab; label: string; icon: typeof Star }> = [
    { id: "browse", label: "Browse", icon: Sparkles },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "recent", label: "Recent", icon: Clock },
    { id: "mine", label: "My Elements", icon: Upload },
  ];

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Elements Library
        </p>
        {!compact ? (
          <p className="mt-0.5 text-[10px] text-stone-500">
            Functional objects, shapes, stamps, and callouts — use Stickers for decorative art.
          </p>
        ) : null}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold ${
              tab === id
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
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
          placeholder="Search elements… flower, exam, arrow, important"
          className="w-full rounded-lg border border-stone-200 py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {tab === "browse" ? (
        <>
          <div className="flex gap-1">
            {(
              [
                { id: "all", label: "All" },
                { id: "visual", label: "Visual" },
                { id: "text", label: "Text stamps" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRoleFilter(id)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${
                  roleFilter === id
                    ? "bg-orange-500 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="-mx-1 flex max-h-24 flex-wrap gap-1 overflow-y-auto px-1">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${
              category === "all"
                ? "bg-orange-500 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All
          </button>
          {(Object.entries(ELEMENT_CATEGORIES) as [ElementCategoryId, string][]).map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                  category === id
                    ? "bg-orange-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        </>
      ) : null}

      {tab === "mine" ? (
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-orange-200 bg-orange-50/40 px-3 py-2.5 text-xs font-semibold">
          <Upload className="h-4 w-4 text-orange-500" />
          {uploading ? "Importing…" : "Import element PNG / JPG / SVG"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadElement(file);
              e.target.value = "";
            }}
          />
        </label>
      ) : null}

      <p className="text-[10px] font-medium text-stone-400">
        {displayedItems.length} element{displayedItems.length === 1 ? "" : "s"}
      </p>

      <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5">
        {displayedItems.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => handleInsert(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleInsert(item);
            }}
            className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-stone-100 bg-stone-50 p-1.5 transition hover:border-orange-200 hover:bg-orange-50/50"
            title={item.name}
          >
            <button
              type="button"
              onClick={(e) => handleFavorite(e, item.id)}
              className="absolute right-0.5 top-0.5 rounded p-0.5 opacity-0 transition group-hover:opacity-100"
              title={favorites.includes(item.id) ? "Remove favorite" : "Add favorite"}
            >
              <Star
                className={`h-3 w-3 ${
                  favorites.includes(item.id)
                    ? "fill-amber-400 text-amber-400"
                    : "text-stone-300"
                }`}
              />
            </button>
            <ElementPreview element={item} />
            <span className="w-full truncate text-center text-[9px] font-semibold text-stone-600">
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {displayedItems.length === 0 ? (
        <p className="text-center text-[10px] text-stone-400">
          {tab === "favorites"
            ? "Star elements to add them to favorites."
            : tab === "recent"
              ? "Recently used elements appear here."
              : tab === "mine"
                ? "Import PNG, JPG, or SVG files to build your personal Elements folder."
                : "No matches — try another search or category."}
        </p>
      ) : null}
    </div>
  );
}
