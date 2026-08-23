"use client";

import { useCallback, useEffect, useState } from "react";
import { FileImage, Star, Trash2, Upload } from "lucide-react";

import { PAGE_TEMPLATES } from "@/lib/core/page-templates";
import type { MediaAssetRecord } from "@/lib/customization/types";

type Section = "builtin" | "imported" | "favorites" | "recent";

export function TemplateLibrary({
  onSelectBuiltin,
  onSelectImported,
  selectedBuiltinId,
  selectedImportedId,
}: {
  onSelectBuiltin?: (templateId: string) => void;
  onSelectImported?: (assetId: string) => void;
  selectedBuiltinId?: string;
  selectedImportedId?: string;
}) {
  const [section, setSection] = useState<Section>("builtin");
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadAssets = useCallback(async () => {
    const res = await fetch("/api/customization/templates?kind=template");
    if (res.ok) {
      setAssets((await res.json()) as MediaAssetRecord[]);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  async function uploadTemplate(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name.replace(/\.[^.]+$/, ""));
      form.append("kind", "template");
      const res = await fetch("/api/customization/templates", { method: "POST", body: form });
      if (res.ok) await loadAssets();
    } finally {
      setUploading(false);
    }
  }

  async function deleteAsset(id: string) {
    await fetch(`/api/customization/templates/${id}`, { method: "DELETE" });
    await loadAssets();
  }

  const sections: { id: Section; label: string }[] = [
    { id: "builtin", label: "Built-in" },
    { id: "imported", label: "Imported" },
    { id: "favorites", label: "Favorites" },
    { id: "recent", label: "Recent" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
              section === s.id ? "bg-teal-600 text-white" : "bg-orange-50 text-stone-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs font-semibold text-stone-600 hover:bg-stone-100">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : "Import PNG, JPG, or PDF template"}
        <input
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadTemplate(file);
          }}
        />
      </label>

      {section === "builtin" ? (
        <div className="grid grid-cols-2 gap-2">
          {PAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectBuiltin?.(template.id)}
              className={`rounded-xl border p-2 text-left ${
                selectedBuiltinId === template.id
                  ? "border-stone-900 ring-1 ring-stone-900"
                  : "border-orange-100"
              }`}
            >
              <div className={`mb-2 h-16 rounded-lg ${template.paperClass}`} />
              <p className="text-[10px] font-semibold text-stone-800">{template.label}</p>
            </button>
          ))}
        </div>
      ) : null}

      {section === "imported" || section === "favorites" || section === "recent" ? (
        <div className="space-y-2">
          {assets.length === 0 ? (
            <p className="text-xs text-stone-400">No imported templates yet.</p>
          ) : (
            assets.map((asset) => (
              <div
                key={asset.id}
                className={`flex items-center gap-2 rounded-xl border px-2 py-2 ${
                  selectedImportedId === asset.id
                    ? "border-stone-900 bg-stone-50"
                    : "border-stone-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectImported?.(asset.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {asset.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/customization/templates/${asset.id}`}
                      alt={asset.name}
                      className="h-12 w-10 rounded object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-12 w-10 items-center justify-center rounded bg-red-50 text-red-500">
                      <FileImage className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-stone-800">{asset.name}</p>
                    <p className="text-[10px] text-stone-400">{asset.mimeType}</p>
                  </div>
                </button>
                <button type="button" className="rounded p-1 hover:bg-stone-100">
                  <Star className="h-3.5 w-3.5 text-stone-400" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteAsset(asset.id)}
                  className="rounded p-1 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
