import type { PageDecoration, PageImage, PageTextBox } from "@/lib/core/note-types";

export type CanvasItemKind = "decoration" | "image" | "textbox";

export interface CanvasClipboardItem {
  kind: CanvasItemKind;
  decoration?: PageDecoration;
  image?: PageImage;
  textBox?: PageTextBox;
}

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function newGroupId() {
  return randomId("grp");
}

export function cloneDecoration(item: PageDecoration, offset = 16): PageDecoration {
  return {
    ...item,
    id: randomId("dec"),
    x: item.x + offset,
    y: item.y + offset,
    groupId: undefined,
  };
}

export function cloneImage(item: PageImage, offset = 16): PageImage {
  return {
    ...item,
    id: randomId("img"),
    x: item.x + offset,
    y: item.y + offset,
    groupId: undefined,
  };
}

export function cloneTextBox(item: PageTextBox, offset = 16): PageTextBox {
  return {
    ...item,
    id: randomId("tb"),
    x: item.x + offset,
    y: item.y + offset,
    groupId: undefined,
  };
}

export function itemToClipboard(
  kind: CanvasItemKind,
  item: PageDecoration | PageImage | PageTextBox,
): CanvasClipboardItem {
  if (kind === "decoration") return { kind, decoration: { ...(item as PageDecoration) } };
  if (kind === "image") return { kind, image: { ...(item as PageImage) } };
  return { kind, textBox: { ...(item as PageTextBox) } };
}

export function clipboardToDocumentItems(
  items: CanvasClipboardItem[],
  offset = 16,
): {
  decorations: PageDecoration[];
  images: PageImage[];
  textBoxes: PageTextBox[];
} {
  const decorations: PageDecoration[] = [];
  const images: PageImage[] = [];
  const textBoxes: PageTextBox[] = [];

  for (const entry of items) {
    if (entry.kind === "decoration" && entry.decoration) {
      decorations.push(cloneDecoration(entry.decoration, offset));
    } else if (entry.kind === "image" && entry.image) {
      images.push(cloneImage(entry.image, offset));
    } else if (entry.kind === "textbox" && entry.textBox) {
      textBoxes.push(cloneTextBox(entry.textBox, offset));
    }
  }

  return { decorations, images, textBoxes };
}

export function resolveSelectionItems(
  selectedIds: string[],
  doc: {
    decorations?: PageDecoration[];
    pageImages?: PageImage[];
    pageTextBoxes?: PageTextBox[];
  },
): CanvasClipboardItem[] {
  const items: CanvasClipboardItem[] = [];
  for (const id of selectedIds) {
    const decoration = doc.decorations?.find((d) => d.id === id);
    if (decoration) {
      items.push({ kind: "decoration", decoration });
      continue;
    }
    const image = doc.pageImages?.find((i) => i.id === id);
    if (image) {
      items.push({ kind: "image", image });
      continue;
    }
    const textBox = doc.pageTextBoxes?.find((t) => t.id === id);
    if (textBox) items.push({ kind: "textbox", textBox });
  }
  return items;
}

export function applyGroupId(
  selectedIds: string[],
  groupId: string,
  doc: {
    decorations?: PageDecoration[];
    pageImages?: PageImage[];
    pageTextBoxes?: PageTextBox[];
  },
) {
  const idSet = new Set(selectedIds);
  return {
    decorations:
      doc.decorations?.map((d) => (idSet.has(d.id) ? { ...d, groupId } : d)) ?? [],
    pageImages:
      doc.pageImages?.map((i) => (idSet.has(i.id) ? { ...i, groupId } : i)) ?? [],
    pageTextBoxes:
      doc.pageTextBoxes?.map((t) => (idSet.has(t.id) ? { ...t, groupId } : t)) ?? [],
  };
}

export function clearGroupId(
  selectedIds: string[],
  doc: {
    decorations?: PageDecoration[];
    pageImages?: PageImage[];
    pageTextBoxes?: PageTextBox[];
  },
) {
  const idSet = new Set(selectedIds);
  const groupIds = new Set<string>();
  for (const id of selectedIds) {
    const g =
      doc.decorations?.find((d) => d.id === id)?.groupId ??
      doc.pageImages?.find((i) => i.id === id)?.groupId ??
      doc.pageTextBoxes?.find((t) => t.id === id)?.groupId;
    if (g) groupIds.add(g);
  }

  function strip<T extends { id: string; groupId?: string }>(items: T[] | undefined) {
    return (
      items?.map((item) => {
        if (idSet.has(item.id)) return { ...item, groupId: undefined };
        if (item.groupId && groupIds.has(item.groupId)) return { ...item, groupId: undefined };
        return item;
      }) ?? []
    );
  }

  return {
    decorations: strip(doc.decorations),
    pageImages: strip(doc.pageImages),
    pageTextBoxes: strip(doc.pageTextBoxes),
  };
}

/** Collect all item ids sharing a group with the given item. */
export function idsInSameGroup(
  itemId: string,
  doc: {
    decorations?: PageDecoration[];
    pageImages?: PageImage[];
    pageTextBoxes?: PageTextBox[];
  },
): string[] {
  const groupId =
    doc.decorations?.find((d) => d.id === itemId)?.groupId ??
    doc.pageImages?.find((i) => i.id === itemId)?.groupId ??
    doc.pageTextBoxes?.find((t) => t.id === itemId)?.groupId;
  if (!groupId) return [itemId];

  const ids: string[] = [];
  for (const d of doc.decorations ?? []) {
    if (d.groupId === groupId) ids.push(d.id);
  }
  for (const i of doc.pageImages ?? []) {
    if (i.groupId === groupId) ids.push(i.id);
  }
  for (const t of doc.pageTextBoxes ?? []) {
    if (t.groupId === groupId) ids.push(t.id);
  }
  return ids.length > 0 ? ids : [itemId];
}
