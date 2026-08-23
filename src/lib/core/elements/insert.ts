import type { ElementDefinition } from "@/lib/core/elements/catalog";
import { nextCanvasElementZIndex } from "@/lib/core/canvas-layer";
import { createDecoration, createPageImage } from "@/lib/core/notebook-pages";
import type { NoteDocument } from "@/lib/core/note-types";

export function insertElementDefinition(
  doc: NoteDocument,
  element: ElementDefinition,
  position?: { x: number; y: number },
): { doc: NoteDocument; insertedId: string } {
  const x = position?.x ?? 80 + Math.random() * 40;
  const y = position?.y ?? 120 + Math.random() * 40;
  const zIndex = nextCanvasElementZIndex(doc);

  if (element.insertType === "clip-art" && element.assetId) {
    const image = createPageImage(element.assetId, x, y);
    image.zIndex = zIndex;
    if (element.defaultSize) {
      image.width = element.defaultSize.w;
      image.height = element.defaultSize.h;
    }
    return {
      doc: {
        ...doc,
        pageImages: [...(doc.pageImages ?? []), image],
      },
      insertedId: image.id,
    };
  }

  const decoration = createDecoration(
    element.decorationKind ?? "shape_rect",
    x,
    y,
    element.defaultColor ?? "#fef3c7",
    {
      w: element.defaultSize?.w,
      h: element.defaultSize?.h,
      text: element.defaultText,
      number:
        element.decorationKind === "number_bubble" && element.defaultText
          ? Number(element.defaultText)
          : undefined,
    },
  );
  if (element.insertType === "text-stamp" && element.defaultText) {
    decoration.text = element.defaultText;
  }
  decoration.zIndex = zIndex;

  return {
    doc: {
      ...doc,
      decorations: [...(doc.decorations ?? []), decoration],
    },
    insertedId: decoration.id,
  };
}
