"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Upload } from "lucide-react";

import { customCoverImageUrl } from "@/lib/core/page-templates";
import type { MediaAssetRecord } from "@/lib/customization/types";

type Target = "cover" | "background";

/**
 * Bring-your-own artwork for a notebook: upload a picture once, then apply it
 * as the cover or as the page background. Uses the same media asset store as
 * imported paper templates.
 */
export function NotebookImageImport({
  selectedCoverAssetId,
  selectedBackgroundAssetId,
  onApplyCover,
  onApplyBackground,
  compact = false,
}: {
  selectedCoverAssetId?: string | null;
  selectedBackgroundAssetId?: string | null;
  onApplyCover?: (assetId: string | null) => void;
  onApplyBackground?: (assetId: string | null) => void;
  compact?: boolean;
}) {
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<Target>(
    onApplyCover ? "cover" : "background",
  );

  const loadAssets = useCallback(async () => {
    const res = await fetch("/api/customization/templates?kind=background");
    if (res.ok) setAssets((await res.json()) as MediaAssetRecord[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void loadAssets();
  }, [loadAssets]);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.[^.]+$/, ""));
      form.append("kind", "background");
      const res = await fetch("/api/customization/templates", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not import that image.");
      }
      const asset = (await res.json()) as MediaAssetRecord;
      await loadAssets();
      apply(asset.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import that image.");
    } finally {
      setUploading(false);
    }
  }

  function apply(assetId: string | null) {
    if (target === "cover") onApplyCover?.(assetId);
    else onApplyBackground?.(assetId);
  }

  async function remove(assetId: string) {
    await fetch(`/api/customization/templates/${assetId}`, { method: "DELETE" });
    if (selectedCoverAssetId === assetId) onApplyCover?.(null);
    if (selectedBackgroundAssetId === assetId) onApplyBackground?.(null);
    await loadAssets();
  }

  const targets: Array<{ id: Target; label: string; enabled: boolean }> = [
    { id: "cover", label: "Cover", enabled: Boolean(onApplyCover) },
    { id: "background", label: "Page background", enabled: Boolean(onApplyBackground) },
  ];
  const cols = compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-5";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Apply to
        </span>
        {targets
          .filter((item) => item.enabled)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTarget(item.id)}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold touch-manipulation ${
                target === item.id
                  ? "bg-stone-900 text-white"
                  : "bg-orange-50 text-stone-600"
              }`}
            >
              {item.label}
            </button>
          ))}
      </div>

      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-xs font-semibold text-stone-600 touch-manipulation hover:bg-stone-100">
        <Upload className="h-4 w-4" />
        {uploading ? "Importing…" : "Import a picture (Hello Kitty, photo, art…)"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
      </label>

      {error ? <p className="text-[10px] font-semibold text-rose-600">{error}</p> : null}

      {assets.length === 0 ? (
        <p className="text-[10px] text-stone-400">
          No pictures yet — import one and it becomes a cover or page background.
        </p>
      ) : (
        <div className={`grid gap-2 ${cols}`}>
          {assets.map((asset) => {
            const selected =
              target === "cover"
                ? selectedCoverAssetId === asset.id
                : selectedBackgroundAssetId === asset.id;
            return (
              <div key={asset.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => apply(asset.id)}
                  title={asset.name}
                  className={`relative block aspect-[3/4] w-full overflow-hidden rounded-lg bg-stone-100 bg-cover bg-center shadow-sm ring-2 touch-manipulation ${
                    selected ? "ring-stone-900" : "ring-transparent"
                  }`}
                  style={{
                    backgroundImage: `url(${customCoverImageUrl(asset.id)})`,
                  }}
                >
                  <span className="absolute inset-y-0 left-0 w-1 bg-black/20" />
                </button>
                <button
                  type="button"
                  onClick={() => void remove(asset.id)}
                  className="inline-flex items-center gap-1 text-[9px] font-semibold text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(target === "cover" && selectedCoverAssetId) ||
      (target === "background" && selectedBackgroundAssetId) ? (
        <button
          type="button"
          onClick={() => apply(null)}
          className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-600"
        >
          {target === "cover" ? "Use preset cover" : "Use plain paper"}
        </button>
      ) : null}
    </div>
  );
}
