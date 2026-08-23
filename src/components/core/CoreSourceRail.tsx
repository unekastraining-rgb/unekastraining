"use client";

import { FileText, Highlighter } from "lucide-react";

interface MaterialOption {
  id: string;
  title: string;
  type: string;
  extractedText: string | null;
  filePath?: string | null;
}

export function CoreSourceRail({
  materials,
  selectedMaterialId,
  onSelectMaterial,
  onAnnotate,
  studioTopic,
  onStudioTopicChange,
}: {
  materials: MaterialOption[];
  selectedMaterialId: string | null;
  onSelectMaterial: (materialId: string | null) => void;
  onAnnotate: (materialId: string) => void;
  studioTopic: string;
  onStudioTopicChange: (value: string) => void;
}) {
  const selected = materials.find((material) => material.id === selectedMaterialId) ?? null;

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-orange-100 bg-white/90 lg:w-60 lg:border-b-0 lg:border-r">
      <div className="border-b border-orange-50 px-4 py-3">
        <p className="text-sm font-bold text-stone-900">Sources</p>
        <p className="mt-1 text-xs text-stone-500">
          Notebook-style grounding — pick a PDF or reading, then annotate or chat.
        </p>
        <input
          value={studioTopic}
          onChange={(event) => onStudioTopicChange(event.target.value)}
          placeholder="Topic focus (optional)"
          className="mt-3 w-full rounded-xl border border-orange-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="max-h-48 overflow-y-auto p-2 lg:max-h-none lg:flex-1">
        <button
          type="button"
          onClick={() => onSelectMaterial(null)}
          className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm ${
            !selectedMaterialId
              ? "bg-orange-100 font-semibold text-stone-900"
              : "text-stone-600 hover:bg-orange-50"
          }`}
        >
          All course materials
        </button>

        {materials.length === 0 ? (
          <p className="px-3 py-4 text-xs text-stone-500">
            Upload PDFs or readings on the course page to use source chat and ink.
          </p>
        ) : (
          materials.map((material) => {
            const isActive = selectedMaterialId === material.id;
            return (
              <div
                key={material.id}
                className={`mb-1 rounded-xl border px-3 py-2 ${
                  isActive
                    ? "border-orange-200 bg-orange-50"
                    : "border-transparent hover:bg-orange-50/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectMaterial(material.id)}
                  className="w-full text-left"
                >
                  <p className="text-sm font-semibold text-stone-900">{material.title}</p>
                  <p className="text-[11px] uppercase tracking-wide text-stone-500">
                    {material.type}
                  </p>
                </button>
                {material.filePath ? (
                  <button
                    type="button"
                    onClick={() => onAnnotate(material.id)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-stone-900 px-2.5 py-1 text-[11px] font-semibold text-white"
                  >
                    <Highlighter className="h-3 w-3" />
                    Annotate PDF
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {selected?.extractedText ? (
        <div className="hidden border-t border-orange-50 p-3 lg:block">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone-500">
            <FileText className="h-3.5 w-3.5" />
            Excerpt
          </div>
          <p className="max-h-40 overflow-y-auto text-xs leading-relaxed text-stone-600">
            {selected.extractedText.slice(0, 900)}
            {selected.extractedText.length > 900 ? "…" : ""}
          </p>
        </div>
      ) : null}
    </aside>
  );
}
