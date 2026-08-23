"use client";

import { GripVertical } from "lucide-react";

import { TransformableElement } from "@/components/core/canvas/TransformableElement";
import { CANVAS_ELEMENT_BASE_Z, nextCanvasElementZIndex } from "@/lib/core/canvas-layer";
import { getFormatDefinition } from "@/lib/core/format-catalog";
import { ensureBlockPositions } from "@/lib/core/block-layout";
import type { CompositeSection, NoteDocument } from "@/lib/core/note-types";
import { removeCompositeSection } from "@/lib/core/section-format-data";
import { FormatBlockEditor } from "@/components/core/CompositeFormatSections";

export function PageFormatBlocksLayer({
  sections,
  doc,
  setDoc,
  selectedIds,
  onSelect,
  editable = true,
}: {
  sections: CompositeSection[];
  doc: NoteDocument;
  setDoc: (updater: (current: NoteDocument) => NoteDocument) => void;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  editable?: boolean;
}) {
  const positioned = ensureBlockPositions(sections);
  const selectedSet = new Set(selectedIds);

  function bringToFront(id: string) {
    const next = nextCanvasElementZIndex(doc);
    patchSections(
      positioned.map((section) =>
        section.id === id ? { ...section, zIndex: next } : section,
      ),
    );
  }

  function handleSelect(id: string, options?: { shiftKey?: boolean }) {
    if (options?.shiftKey) {
      if (selectedSet.has(id)) {
        onSelect(selectedIds.filter((entry) => entry !== id));
      } else {
        onSelect([...selectedIds, id]);
        bringToFront(id);
      }
      return;
    }
    onSelect([id]);
    bringToFront(id);
  }

  function patchSections(next: CompositeSection[]) {
    setDoc((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        compositeSections: next,
        activeFormat: "BLANK",
      },
    }));
  }

  function patchSection(id: string, patch: Partial<CompositeSection>) {
    patchSections(
      positioned.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    );
  }

  return (
    <>
      {positioned.map((section) => {
        const def = getFormatDefinition(section.formatId);
        const blockX = section.x ?? 32;
        const blockY = section.y ?? 32;
        const blockW = section.width ?? 320;
        const blockH = section.height ?? 280;

        return (
          <TransformableElement
            key={section.id}
            rect={{
              x: blockX,
              y: blockY,
              width: blockW,
              height: blockH,
            }}
            selected={selectedSet.has(section.id)}
            editable={editable}
            zIndex={section.zIndex ?? CANVAS_ELEMENT_BASE_Z}
            onSelect={(options) => handleSelect(section.id, options)}
            onChange={(patch) => {
              patchSection(section.id, {
                x: patch.x ?? blockX,
                y: patch.y ?? blockY,
                width: patch.width ?? blockW,
                height: patch.height ?? blockH,
              });
            }}
            onDelete={() => {
              setDoc((current) => removeCompositeSection(current, section.id));
              if (selectedSet.has(section.id)) {
                onSelect(selectedIds.filter((entry) => entry !== section.id));
              }
            }}
            onLayerForward={() =>
              patchSection(section.id, {
                zIndex: (section.zIndex ?? CANVAS_ELEMENT_BASE_Z) + 1,
              })
            }
            onLayerBackward={() =>
              patchSection(section.id, {
                zIndex: Math.max(
                  CANVAS_ELEMENT_BASE_Z,
                  (section.zIndex ?? CANVAS_ELEMENT_BASE_Z) - 1,
                ),
              })
            }
          >
            <div
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 shadow-md backdrop-blur-sm"
              data-format-block={section.id}
            >
              <div className="flex shrink-0 cursor-move items-center gap-2 border-b border-stone-100 bg-stone-50/80 px-2 py-1.5">
                <span className="rounded p-1 text-stone-400" aria-hidden>
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-stone-800">
                    {def.emoji} {section.title || def.label}
                  </p>
                </div>
              </div>
              <div
                className="min-h-0 flex-1 overflow-auto p-2"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <FormatBlockEditor section={section} doc={doc} setDoc={setDoc} />
              </div>
            </div>
          </TransformableElement>
        );
      })}
    </>
  );
}
