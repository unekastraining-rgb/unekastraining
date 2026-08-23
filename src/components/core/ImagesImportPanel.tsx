"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";

export function ImagesImportPanel({
  onInsert,
  compact = false,
}: {
  onInsert: (assetId: string) => void;
  compact?: boolean;
}) {
  const [assets, setAssets] = useState<
    Array<{ id: string; name: string; kind: string; mimeType: string }>
  >([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/customization/templates");
    if (res.ok) setAssets(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.[^.]+$/, ""));
      form.append("kind", "background");
      const res = await fetch("/api/customization/templates", { method: "POST", body: form });
      if (res.ok) {
        await load();
        const created = (await res.json()) as { id: string };
        onInsert(created.id);
      }
    } finally {
      setUploading(false);
    }
  }

  const images = assets.filter(
    (a) => a.kind === "background" || (a.kind !== "sticker" && a.mimeType.startsWith("image/")),
  );

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Images</p>
        {!compact ? (
          <p className="mt-0.5 text-[10px] text-stone-500">
            Import photos and illustrations onto your notebook page.
          </p>
        ) : null}
      </div>

      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 px-4 py-6 transition hover:border-orange-300 hover:bg-orange-50/70">
        <Upload className="h-8 w-8 text-orange-500" />
        <span className="text-sm font-semibold text-stone-800">
          {uploading ? "Importing…" : "Import image"}
        </span>
        <span className="text-[10px] text-stone-500">PNG, JPEG, or WebP</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </label>

      {images.length > 0 ? (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Your images
          </p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onInsert(asset.id)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-stone-100 bg-stone-50"
                title={asset.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/customization/templates/${asset.id}`}
                  alt={asset.name}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[8px] font-semibold text-white">
                  {asset.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-1 text-[10px] text-stone-400">
          <ImagePlus className="h-3 w-3" />
          No imported images yet — use the button above to add one.
        </p>
      )}
    </div>
  );
}
