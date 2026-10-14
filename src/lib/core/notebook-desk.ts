import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import { createDecoration } from "@/lib/core/notebook-pages";
import { nextCanvasElementZIndex } from "@/lib/core/canvas-layer";
import type { NoteDocument } from "@/lib/core/note-types";

export type NotebookDeskItemKind = "quick" | "reminder" | "concept";

export interface NotebookDeskItem {
  id: string;
  kind: NotebookDeskItemKind;
  title: string;
  body: string;
  color: string;
  important: boolean;
  reminderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotebookDeskState {
  items: NotebookDeskItem[];
}

export const DESK_COLORS = [
  "#fef9c3",
  "#ffedd5",
  "#dcfce7",
  "#dbeafe",
  "#f3e8ff",
  "#fce7f3",
  "#ffffff",
] as const;

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyNotebookDesk(): NotebookDeskState {
  return { items: [] };
}

export function normalizeNotebookDesk(raw: unknown): NotebookDeskState {
  if (!raw || typeof raw !== "object") return emptyNotebookDesk();
  const items = Array.isArray((raw as NotebookDeskState).items)
    ? (raw as NotebookDeskState).items
    : [];
  return {
    items: items
      .map((item): NotebookDeskItem => ({
        id: String(item?.id ?? rid("desk")),
        kind:
          item?.kind === "reminder" || item?.kind === "concept"
            ? item.kind
            : "quick",
        title: String(item?.title ?? "").trim(),
        body: String(item?.body ?? "").trim(),
        color: String(item?.color ?? DESK_COLORS[0]),
        important: Boolean(item?.important),
        reminderAt: item?.reminderAt ? String(item.reminderAt) : null,
        createdAt: String(item?.createdAt ?? new Date().toISOString()),
        updatedAt: String(item?.updatedAt ?? new Date().toISOString()),
      }))
      .filter((item) => item.title || item.body),
  };
}

export function createDeskItem(
  patch: Partial<NotebookDeskItem> & { kind?: NotebookDeskItemKind },
): NotebookDeskItem {
  const now = new Date().toISOString();
  return {
    id: rid("desk"),
    kind: patch.kind ?? "quick",
    title: (patch.title ?? "").trim(),
    body: (patch.body ?? "").trim(),
    color: patch.color ?? DESK_COLORS[0],
    important: patch.important ?? patch.kind === "concept",
    reminderAt: patch.reminderAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertDeskItem(
  desk: NotebookDeskState | undefined,
  item: NotebookDeskItem,
): NotebookDeskState {
  const current = normalizeNotebookDesk(desk);
  const index = current.items.findIndex((entry) => entry.id === item.id);
  const next = { ...item, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    const items = [...current.items];
    items[index] = next;
    return { items };
  }
  return { items: [next, ...current.items] };
}

export function removeDeskItem(
  desk: NotebookDeskState | undefined,
  id: string,
): NotebookDeskState {
  const current = normalizeNotebookDesk(desk);
  return { items: current.items.filter((item) => item.id !== id) };
}

export function deskFromDocument(doc: NoteDocument): NotebookDeskState {
  return normalizeNotebookDesk(doc.metadata?.notebookDesk);
}

export function withNotebookDesk(
  doc: NoteDocument,
  desk: NotebookDeskState,
): NoteDocument {
  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      notebookDesk: desk,
    },
  };
}

function conceptKey(title: string) {
  return title.trim().toLowerCase();
}

/** Merge study-extract terms into Important concepts without duplicating. */
export function mergeDeskFromExtract(
  desk: NotebookDeskState | undefined,
  extract: ChapterStudyExtract,
): NotebookDeskState {
  const current = normalizeNotebookDesk(desk);
  const existing = new Set(
    current.items
      .filter((item) => item.kind === "concept")
      .map((item) => conceptKey(item.title)),
  );
  const additions: NotebookDeskItem[] = [];

  for (const definition of extract.definitions) {
    const title = definition.term.trim();
    if (!title || existing.has(conceptKey(title))) continue;
    existing.add(conceptKey(title));
    additions.push(
      createDeskItem({
        kind: "concept",
        title,
        body: definition.definition.trim(),
        important: true,
        color: "#dbeafe",
      }),
    );
  }

  for (const fact of extract.mustKnow.slice(0, 8)) {
    const title = fact.trim().slice(0, 72);
    if (!title || existing.has(conceptKey(title))) continue;
    existing.add(conceptKey(title));
    additions.push(
      createDeskItem({
        kind: "concept",
        title,
        body: fact.trim(),
        important: true,
        color: "#fef9c3",
      }),
    );
  }

  if (additions.length === 0) return current;
  return { items: [...additions, ...current.items] };
}

export function pinDeskItemToPage(
  doc: NoteDocument,
  item: NotebookDeskItem,
): NoteDocument {
  const decoration = createDecoration("sticky", 72, 96, item.color, {
    w: 180,
    h: 140,
    text: [item.title, item.body].filter(Boolean).join("\n"),
  });
  decoration.zIndex = nextCanvasElementZIndex(doc);
  return {
    ...doc,
    decorations: [...(doc.decorations ?? []), decoration],
  };
}

export function deskFilter(
  items: NotebookDeskItem[],
  filter: "all" | NotebookDeskItemKind | "important" | "due",
): NotebookDeskItem[] {
  const now = Date.now();
  if (filter === "all") return items;
  if (filter === "important") return items.filter((item) => item.important);
  if (filter === "due") {
    return items.filter((item) => {
      if (!item.reminderAt) return false;
      const at = Date.parse(item.reminderAt);
      return Number.isFinite(at) && at <= now + 24 * 60 * 60 * 1000;
    });
  }
  return items.filter((item) => item.kind === filter);
}

export function reminderIsOverdue(item: NotebookDeskItem): boolean {
  if (!item.reminderAt) return false;
  const at = Date.parse(item.reminderAt);
  return Number.isFinite(at) && at < Date.now();
}
