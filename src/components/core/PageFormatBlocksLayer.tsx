"use client";

import { useEffect, useRef } from "react";

import { TransformableElement } from "@/components/core/canvas/TransformableElement";
import { CANVAS_ELEMENT_BASE_Z, nextCanvasElementZIndex } from "@/lib/core/canvas-layer";
import { getFormatDefinition } from "@/lib/core/format-catalog";
import {
  ensureBlockPositions,
  rectsOverlap,
} from "@/lib/core/block-layout";
import { reflowSectionsToRegions } from "@/lib/core/study-page-plan";
import { hasLockedStudyTemplateLayout } from "@/lib/core/study-templates";
import type { CompositeSection, NoteDocument } from "@/lib/core/note-types";
import { removeCompositeSection } from "@/lib/core/section-format-data";
import { FormatBlockEditor } from "@/components/core/CompositeFormatSections";

function sectionRect(section: CompositeSection) {
  return {
    x: section.x ?? 0,
    y: section.y ?? 0,
    width: section.width ?? 0,
    height: section.height ?? 0,
  };
}

function sectionsOverlap(sections: CompositeSection[]): boolean {
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      if (rectsOverlap(sectionRect(sections[i]!), sectionRect(sections[j]!), 4)) {
        return true;
      }
    }
  }
  return false;
}

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
  const repairKey = positioned
    .map((section) => `${section.id}:${section.x}:${section.y}:${section.width}:${section.height}`)
    .join("|");
  const lastRepairKey = useRef("");

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

  useEffect(() => {
    if (lastRepairKey.current === repairKey) return;
    if (hasLockedStudyTemplateLayout(doc) || positioned.length < 2 || !sectionsOverlap(positioned)) {
      lastRepairKey.current = repairKey;
      return;
    }
    lastRepairKey.current = repairKey;
    patchSections(reflowSectionsToRegions(positioned, positioned[0]?.y ?? 48));
  }, [repairKey, doc.metadata?.studyTemplateId]);

  return (
    <>
      {positioned.map((section) => {
        const def = getFormatDefinition(section.formatId);
        const blockX = section.x ?? 32;
        const blockY = section.y ?? 32;
        const blockW = section.width ?? 300;
        const blockH = section.height ?? 140;
        const isActive = selectedSet.has(section.id);

        return (
          <TransformableElement
            key={section.id}
            elementId={section.id}
            dragFromHandleOnly
            quietChrome
            rect={{
              x: blockX,
              y: blockY,
              width: blockW,
              height: blockH,
            }}
            selected={isActive}
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
              className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-sm ${
                isActive
                  ? ""
                  : "outline outline-1 outline-dashed outline-transparent hover:outline-stone-300/80"
              }`}
              data-format-block={section.id}
              onPointerDown={(event) => {
                if (!editable) return;
                if (!isActive) {
                  event.stopPropagation();
                  handleSelect(section.id, { shiftKey: event.shiftKey });
                }
              }}
            >
              <p
                className={`shrink-0 truncate px-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  isActive ? "mb-1 text-stone-500" : "mb-0.5 text-stone-400/80"
                }`}
              >
                {section.title || def.label}
              </p>
              <div className="min-h-0 min-w-0 flex-1 overflow-auto break-words [overflow-wrap:anywhere]">
                <FormatBlockEditor
                  section={section}
                  doc={doc}
                  setDoc={setDoc}
                  bare
                  selected={isActive}
                />
              </div>
            </div>
          </TransformableElement>
        );
      })}
    </>
  );
}
