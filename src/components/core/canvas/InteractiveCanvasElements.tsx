"use client";

import { TransformableElement } from "@/components/core/canvas/TransformableElement";
import { CANVAS_ELEMENT_BASE_Z } from "@/lib/core/canvas-layer";
import { resolvePageImageSrc } from "@/lib/core/clip-art-catalog";
import { idsInSameGroup } from "@/lib/core/canvas-clipboard";
import type { PageDecoration, PageImage, PageTextBox } from "@/lib/core/note-types";

function DecorationBody({ item }: { item: PageDecoration }) {
  const fill = item.color;
  const fillAlpha = item.fillOpacity ?? 0.15;
  const border = item.borderColor ?? item.color;

  switch (item.kind) {
    case "sticky":
      return (
        <div
          className="relative h-full w-full rounded-xl border border-yellow-200/80 shadow-md"
          style={{ backgroundColor: fill, opacity: item.opacity ?? 1 }}
        >
          <textarea
            value={item.text ?? ""}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={() => {}}
            className="h-full w-full resize-none bg-transparent p-3 text-sm text-stone-800 outline-none"
            placeholder="Note…"
            readOnly
          />
        </div>
      );
    case "text_stamp":
    case "banner":
      return (
        <div
          className="flex h-full w-full items-center justify-center rounded-lg border-2 px-2 text-center text-xs font-bold uppercase tracking-wide shadow-sm"
          style={{
            borderColor: border,
            backgroundColor: `${fill}${Math.round(fillAlpha * 255).toString(16).padStart(2, "0")}`,
            color: border,
            opacity: item.opacity ?? 1,
          }}
        >
          {item.text ?? "Label"}
        </div>
      );
    case "circle":
    case "ellipse":
      return (
        <div
          className="h-full w-full rounded-full border-2 shadow-sm"
          style={{
            borderColor: border,
            backgroundColor: `${fill}33`,
            opacity: item.opacity ?? 1,
          }}
        />
      );
    case "triangle":
      return (
        <div
          className="h-full w-full"
          style={{
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            backgroundColor: fill,
            opacity: item.opacity ?? 1,
          }}
        />
      );
    case "hexagon":
      return (
        <div
          className="h-full w-full"
          style={{
            clipPath:
              "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
            backgroundColor: fill,
            opacity: item.opacity ?? 1,
          }}
        />
      );
    case "star_shape":
      return (
        <div
          className="h-full w-full"
          style={{
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            backgroundColor: fill,
            opacity: item.opacity ?? 1,
          }}
        />
      );
    case "diamond_shape":
      return (
        <div
          className="h-full w-full"
          style={{
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            backgroundColor: fill,
            opacity: item.opacity ?? 1,
          }}
        />
      );
    case "arrow":
      return (
        <div className="flex h-full items-center" style={{ color: fill }}>
          <div className="h-0.5 flex-1 bg-current" />
          <div className="ml-[-2px] h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-current" />
        </div>
      );
    case "line":
      return (
        <div
          className="h-full w-full"
          style={{ borderBottom: `3px solid ${fill}`, opacity: item.opacity ?? 1 }}
        />
      );
    case "dot":
      return (
        <div className="h-full w-full rounded-full" style={{ backgroundColor: fill }} />
      );
    case "number_bubble":
      return (
        <div
          className="flex h-full w-full items-center justify-center rounded-full text-sm font-black text-white shadow"
          style={{ backgroundColor: fill }}
        >
          {item.number ?? 1}
        </div>
      );
    case "color_block":
      return (
        <div
          className="h-full w-full rounded-xl border border-white/50 shadow-inner"
          style={{ backgroundColor: fill }}
        />
      );
    default:
      return (
        <div
          className="h-full w-full rounded-lg border-2"
          style={{ borderColor: border, backgroundColor: `${fill}22` }}
        />
      );
  }
}

function applyGroupMove(
  anchorId: string,
  dx: number,
  dy: number,
  images: PageImage[],
  decorations: PageDecoration[],
  textBoxes: PageTextBox[],
) {
  const memberIds = new Set(
    idsInSameGroup(anchorId, {
      decorations,
      pageImages: images,
      pageTextBoxes: textBoxes,
    }),
  );
  if (memberIds.size <= 1) return null;

  return {
    images: images.map((entry) =>
      memberIds.has(entry.id) ? { ...entry, x: entry.x + dx, y: entry.y + dy } : entry,
    ),
    decorations: decorations.map((entry) =>
      memberIds.has(entry.id) ? { ...entry, x: entry.x + dx, y: entry.y + dy } : entry,
    ),
    textBoxes: textBoxes.map((entry) =>
      memberIds.has(entry.id) ? { ...entry, x: entry.x + dx, y: entry.y + dy } : entry,
    ),
  };
}

export function InteractiveCanvasElements({
  images,
  decorations,
  textBoxes,
  selectedIds,
  editable,
  onSelect,
  onImagesChange,
  onDecorationsChange,
  onTextBoxesChange,
  onDecorationTextChange,
  resolveNextZIndex,
}: {
  images: PageImage[];
  decorations: PageDecoration[];
  textBoxes: PageTextBox[];
  selectedIds: string[];
  editable: boolean;
  onSelect: (ids: string[]) => void;
  onImagesChange: (images: PageImage[]) => void;
  onDecorationsChange: (decorations: PageDecoration[]) => void;
  onTextBoxesChange: (textBoxes: PageTextBox[]) => void;
  onDecorationTextChange?: (id: string, text: string) => void;
  resolveNextZIndex?: () => number;
}) {
  const selectedSet = new Set(selectedIds);

  function maxStackZ(): number {
    return Math.max(
      CANVAS_ELEMENT_BASE_Z,
      ...images.map((item) => item.zIndex ?? CANVAS_ELEMENT_BASE_Z),
      ...decorations.map((item) => item.zIndex ?? CANVAS_ELEMENT_BASE_Z),
      ...textBoxes.map((item) => item.zIndex ?? CANVAS_ELEMENT_BASE_Z),
    );
  }

  function bringToFront(id: string) {
    const next = resolveNextZIndex?.() ?? maxStackZ() + 1;
    if (images.some((item) => item.id === id)) {
      onImagesChange(
        images.map((item) => (item.id === id ? { ...item, zIndex: next } : item)),
      );
      return;
    }
    if (decorations.some((item) => item.id === id)) {
      onDecorationsChange(
        decorations.map((item) => (item.id === id ? { ...item, zIndex: next } : item)),
      );
      return;
    }
    if (textBoxes.some((item) => item.id === id)) {
      onTextBoxesChange(
        textBoxes.map((item) => (item.id === id ? { ...item, zIndex: next } : item)),
      );
    }
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

  function bumpLayer(
    id: string,
    kind: "image" | "decoration" | "textbox",
    direction: 1 | -1,
  ) {
    const current =
      kind === "image"
        ? (images.find((i) => i.id === id)?.zIndex ?? CANVAS_ELEMENT_BASE_Z)
        : kind === "textbox"
          ? (textBoxes.find((t) => t.id === id)?.zIndex ?? CANVAS_ELEMENT_BASE_Z)
          : (decorations.find((d) => d.id === id)?.zIndex ?? CANVAS_ELEMENT_BASE_Z);
    const next = Math.max(1, current + direction);
    if (kind === "image") {
      onImagesChange(
        images.map((entry) => (entry.id === id ? { ...entry, zIndex: next } : entry)),
      );
    } else if (kind === "textbox") {
      onTextBoxesChange(
        textBoxes.map((entry) => (entry.id === id ? { ...entry, zIndex: next } : entry)),
      );
    } else {
      onDecorationsChange(
        decorations.map((entry) => (entry.id === id ? { ...entry, zIndex: next } : entry)),
      );
    }
  }

  function duplicateImage(image: PageImage) {
    const copy: PageImage = {
      ...image,
      id: `img_${Math.random().toString(36).slice(2, 9)}`,
      x: image.x + 16,
      y: image.y + 16,
      groupId: undefined,
      zIndex: resolveNextZIndex?.() ?? maxStackZ() + 1,
    };
    onImagesChange([...images, copy]);
    onSelect([copy.id]);
  }

  function duplicateDecoration(item: PageDecoration) {
    const copy: PageDecoration = {
      ...item,
      id: `dec_${Math.random().toString(36).slice(2, 9)}`,
      x: item.x + 16,
      y: item.y + 16,
      groupId: undefined,
      zIndex: resolveNextZIndex?.() ?? maxStackZ() + 1,
    };
    onDecorationsChange([...decorations, copy]);
    onSelect([copy.id]);
  }

  function duplicateTextBox(box: PageTextBox) {
    const copy: PageTextBox = {
      ...box,
      id: `tb_${Math.random().toString(36).slice(2, 9)}`,
      x: box.x + 16,
      y: box.y + 16,
      groupId: undefined,
      zIndex: resolveNextZIndex?.() ?? maxStackZ() + 1,
    };
    onTextBoxesChange([...textBoxes, copy]);
    onSelect([copy.id]);
  }

  function commitMove(
    anchorId: string,
    nextX: number,
    nextY: number,
    kind: "image" | "decoration" | "textbox",
  ) {
    const source =
      kind === "image"
        ? images.find((entry) => entry.id === anchorId)
        : kind === "textbox"
          ? textBoxes.find((entry) => entry.id === anchorId)
          : decorations.find((entry) => entry.id === anchorId);
    if (!source) return;

    const dx = nextX - source.x;
    const dy = nextY - source.y;
    const grouped = applyGroupMove(anchorId, dx, dy, images, decorations, textBoxes);
    if (grouped) {
      onImagesChange(grouped.images);
      onDecorationsChange(grouped.decorations);
      onTextBoxesChange(grouped.textBoxes);
      return;
    }

    if (kind === "image") {
      onImagesChange(
        images.map((entry) =>
          entry.id === anchorId ? { ...entry, x: nextX, y: nextY } : entry,
        ),
      );
    } else if (kind === "textbox") {
      onTextBoxesChange(
        textBoxes.map((entry) =>
          entry.id === anchorId ? { ...entry, x: nextX, y: nextY } : entry,
        ),
      );
    } else {
      onDecorationsChange(
        decorations.map((entry) =>
          entry.id === anchorId ? { ...entry, x: nextX, y: nextY } : entry,
        ),
      );
    }
  }

  function removeFromSelection(id: string) {
    onSelect(selectedIds.filter((entry) => entry !== id));
  }

  return (
    <>
      {images.map((image) => (
        <TransformableElement
          key={image.id}
          rect={{
            x: image.x,
            y: image.y,
            width: image.width,
            height: image.height ?? image.width,
            rotation: image.rotation,
            locked: image.locked,
          }}
          selected={selectedSet.has(image.id)}
          editable={editable}
          zIndex={image.zIndex ?? CANVAS_ELEMENT_BASE_Z}
          onSelect={(options) => handleSelect(image.id, options)}
          onChange={(patch) => {
            if (patch.x !== undefined || patch.y !== undefined) {
              commitMove(
                image.id,
                patch.x ?? image.x,
                patch.y ?? image.y,
                "image",
              );
              return;
            }
            onImagesChange(
              images.map((entry) =>
                entry.id === image.id
                  ? {
                      ...entry,
                      width: patch.width ?? entry.width,
                      height: patch.height ?? entry.height ?? entry.width,
                      rotation: patch.rotation ?? entry.rotation,
                      locked: patch.locked ?? entry.locked,
                    }
                  : entry,
              ),
            );
          }}
          onDuplicate={() => duplicateImage(image)}
          onDelete={() => {
            onImagesChange(images.filter((entry) => entry.id !== image.id));
            if (selectedSet.has(image.id)) removeFromSelection(image.id);
          }}
          onToggleLock={() =>
            onImagesChange(
              images.map((entry) =>
                entry.id === image.id ? { ...entry, locked: !entry.locked } : entry,
              ),
            )
          }
          onLayerForward={() => bumpLayer(image.id, "image", 1)}
          onLayerBackward={() => bumpLayer(image.id, "image", -1)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvePageImageSrc(image.assetId)}
            alt=""
            className="pointer-events-none h-full w-full object-contain"
            draggable={false}
            style={{ opacity: image.opacity ?? 1 }}
          />
        </TransformableElement>
      ))}

      {decorations.map((item) => (
        <TransformableElement
          key={item.id}
          rect={{
            x: item.x,
            y: item.y,
            width: item.w,
            height: item.h,
            rotation: item.rotation,
            locked: item.locked,
          }}
          selected={selectedSet.has(item.id)}
          editable={editable}
          zIndex={item.zIndex ?? CANVAS_ELEMENT_BASE_Z}
          onSelect={(options) => handleSelect(item.id, options)}
          onChange={(patch) => {
            if (patch.x !== undefined || patch.y !== undefined) {
              commitMove(item.id, patch.x ?? item.x, patch.y ?? item.y, "decoration");
              return;
            }
            onDecorationsChange(
              decorations.map((entry) =>
                entry.id === item.id
                  ? {
                      ...entry,
                      w: patch.width ?? entry.w,
                      h: patch.height ?? entry.h,
                      rotation: patch.rotation ?? entry.rotation,
                      locked: patch.locked ?? entry.locked,
                    }
                  : entry,
              ),
            );
          }}
          onDuplicate={() => duplicateDecoration(item)}
          onDelete={() => {
            onDecorationsChange(decorations.filter((entry) => entry.id !== item.id));
            if (selectedSet.has(item.id)) removeFromSelection(item.id);
          }}
          onToggleLock={() =>
            onDecorationsChange(
              decorations.map((entry) =>
                entry.id === item.id ? { ...entry, locked: !entry.locked } : entry,
              ),
            )
          }
          onLayerForward={() => bumpLayer(item.id, "decoration", 1)}
          onLayerBackward={() => bumpLayer(item.id, "decoration", -1)}
        >
          {item.kind === "sticky" ? (
            <div
              className="relative h-full w-full rounded-xl border border-yellow-200/80 shadow-md"
              style={{ backgroundColor: item.color, opacity: item.opacity ?? 1 }}
            >
              <div
                className="absolute inset-x-0 top-0 z-10 flex h-6 cursor-move items-center justify-center rounded-t-xl"
                aria-hidden
              >
                <div className="h-1 w-8 rounded-full bg-black/15" />
              </div>
              <textarea
                value={item.text ?? ""}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => onDecorationTextChange?.(item.id, e.target.value)}
                className="h-full w-full resize-none bg-transparent px-3 pb-3 pt-7 text-sm outline-none"
                style={{ color: item.textColor ?? "#44403c" }}
                placeholder="Note…"
              />
            </div>
          ) : item.kind === "text_stamp" || item.kind === "banner" ? (
            <div
              className="flex h-full w-full items-center justify-center rounded-lg border-2 px-2 text-center text-xs font-bold uppercase tracking-wide shadow-sm"
              style={{
                borderColor: item.borderColor ?? item.color,
                backgroundColor: item.color,
                color: item.textColor ?? item.borderColor ?? "#44403c",
                opacity: item.opacity ?? 1,
              }}
            >
              {item.text ?? "Label"}
            </div>
          ) : (
            <DecorationBody item={item} />
          )}
        </TransformableElement>
      ))}

      {textBoxes.map((box) => (
        <TransformableElement
          key={box.id}
          rect={{
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            rotation: box.rotation,
            locked: box.locked,
          }}
          selected={selectedSet.has(box.id)}
          editable={editable}
          zIndex={box.zIndex ?? CANVAS_ELEMENT_BASE_Z}
          onSelect={(options) => handleSelect(box.id, options)}
          onChange={(patch) => {
            if (patch.x !== undefined || patch.y !== undefined) {
              commitMove(box.id, patch.x ?? box.x, patch.y ?? box.y, "textbox");
              return;
            }
            onTextBoxesChange(
              textBoxes.map((entry) =>
                entry.id === box.id
                  ? {
                      ...entry,
                      width: patch.width ?? entry.width,
                      height: patch.height ?? entry.height,
                      rotation: patch.rotation ?? entry.rotation,
                      locked: patch.locked ?? entry.locked,
                    }
                  : entry,
              ),
            );
          }}
          onDuplicate={() => duplicateTextBox(box)}
          onDelete={() => {
            onTextBoxesChange(textBoxes.filter((entry) => entry.id !== box.id));
            if (selectedSet.has(box.id)) removeFromSelection(box.id);
          }}
          onToggleLock={() =>
            onTextBoxesChange(
              textBoxes.map((entry) =>
                entry.id === box.id ? { ...entry, locked: !entry.locked } : entry,
              ),
            )
          }
          onLayerForward={() => bumpLayer(box.id, "textbox", 1)}
          onLayerBackward={() => bumpLayer(box.id, "textbox", -1)}
        >
          <div
            className="flex h-full flex-col overflow-hidden rounded-xl border border-stone-200/80 shadow-sm backdrop-blur-sm"
            style={{
              backgroundColor: box.backgroundColor ?? "rgba(255,255,255,0.92)",
              opacity: box.opacity ?? 1,
            }}
          >
            <div
              className="flex h-6 shrink-0 cursor-move items-center justify-center border-b border-stone-200/60 bg-stone-50/80"
              aria-hidden
            >
              <div className="h-1 w-8 rounded-full bg-stone-300" />
            </div>
            <textarea
              value={box.text}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(event) =>
                onTextBoxesChange(
                  textBoxes.map((entry) =>
                    entry.id === box.id ? { ...entry, text: event.target.value } : entry,
                  ),
                )
              }
              placeholder="Type here..."
              className="h-full w-full flex-1 resize-none bg-transparent p-3 text-sm outline-none"
              style={{ color: box.color ?? "#44403c" }}
            />
          </div>
        </TransformableElement>
      ))}
    </>
  );
}
