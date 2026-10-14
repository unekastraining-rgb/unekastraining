/**
 * Haul writing document helpers — create, mutate, persist (localStorage).
 * Coexists with classic Haul page docs; does not migrate them.
 */

import {
  getHaulWritingType,
} from "@/lib/haul/writing/registry";
import type {
  HaulWritingDocument,
  HaulWritingMode,
  HaulWritingSectionContent,
} from "@/lib/haul/writing/types";
import {
  HAUL_WRITING_ACTIVE_KEY,
  HAUL_WRITING_STORAGE_KEY,
} from "@/lib/haul/writing/types";

export function createHaulWritingDocument(input: {
  writingTypeId: string;
  title?: string;
  mode?: HaulWritingMode;
  assignmentPrompt?: string;
}): HaulWritingDocument | null {
  const type = getHaulWritingType(input.writingTypeId);
  if (!type) return null;
  const now = new Date().toISOString();
  const sections: HaulWritingSectionContent[] = type.sections.map((s) => ({
    sectionId: s.id,
    title: s.title,
    body: "",
    fieldValues: Object.fromEntries(
      (s.fields ?? []).map((f) => [f.id, ""]),
    ),
  }));
  return {
    kind: "haul-writing-v1",
    id: crypto.randomUUID(),
    writingTypeId: type.id,
    title: input.title?.trim() || type.title,
    mode: input.mode ?? "write",
    assignmentPrompt: input.assignmentPrompt,
    sections,
    createdAt: now,
    updatedAt: now,
  };
}

export function isHaulWritingDocument(value: unknown): value is HaulWritingDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as HaulWritingDocument;
  return (
    doc.kind === "haul-writing-v1" &&
    typeof doc.id === "string" &&
    typeof doc.writingTypeId === "string" &&
    Array.isArray(doc.sections)
  );
}

export function loadHaulWritingDocuments(): HaulWritingDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HAUL_WRITING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHaulWritingDocument);
  } catch {
    return [];
  }
}

export function saveHaulWritingDocuments(docs: HaulWritingDocument[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HAUL_WRITING_STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // ignore quota
  }
}

export function upsertHaulWritingDocument(doc: HaulWritingDocument): void {
  const all = loadHaulWritingDocuments();
  const idx = all.findIndex((d) => d.id === doc.id);
  const next = { ...doc, updatedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  saveHaulWritingDocuments(all);
}

export function loadActiveHaulWritingId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(HAUL_WRITING_ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveHaulWritingId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!id) localStorage.removeItem(HAUL_WRITING_ACTIVE_KEY);
    else localStorage.setItem(HAUL_WRITING_ACTIVE_KEY, id);
  } catch {
    // ignore
  }
}

export function sectionHasContent(section: HaulWritingSectionContent): boolean {
  if (section.body.trim()) return true;
  return Object.values(section.fieldValues ?? {}).some((v) => v.trim().length > 0);
}

export function composeSectionPlainText(section: HaulWritingSectionContent): string {
  const fields = Object.entries(section.fieldValues ?? {})
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v.trim()}`);
  const parts = [...fields, section.body.trim()].filter(Boolean);
  return parts.join("\n\n");
}

/** Export writing as plain text without Haul scaffolding metadata. */
export function exportHaulWritingAsPlainText(doc: HaulWritingDocument): string {
  const type = getHaulWritingType(doc.writingTypeId);
  const lines = [`# ${doc.title}`, ""];
  if (doc.assignmentPrompt) {
    lines.push(`Assignment: ${doc.assignmentPrompt}`, "");
  }
  for (const s of doc.sections) {
    const def = type?.sections.find((x) => x.id === s.sectionId);
    lines.push(`## ${s.title}`);
    if (def?.fields?.length) {
      for (const f of def.fields) {
        const value = s.fieldValues?.[f.id]?.trim();
        if (value) {
          lines.push(`### ${f.label}`, value, "");
        }
      }
    }
    if (s.body.trim()) {
      lines.push(s.body.trim(), "");
    }
  }
  return lines.join("\n").trim() + "\n";
}

export function addRepeatableSection(
  doc: HaulWritingDocument,
  afterSectionId: string,
): HaulWritingDocument {
  const type = getHaulWritingType(doc.writingTypeId);
  const template = type?.sections.find((s) => s.id === afterSectionId && s.repeatable);
  if (!template) return doc;
  const siblings = doc.sections.filter((s) =>
    s.sectionId.startsWith(template.id.split("-")[0] + "-") ||
    s.sectionId === template.id,
  );
  const nextIndex = siblings.length + 1;
  const newId = `${template.id.split("-")[0]}-${nextIndex}-${crypto.randomUUID().slice(0, 6)}`;
  const insertAt = doc.sections.findIndex((s) => s.sectionId === afterSectionId);
  const newSection: HaulWritingSectionContent = {
    sectionId: newId,
    title: `${template.title.replace(/\d+/, String(nextIndex))}`,
    body: "",
    fieldValues: Object.fromEntries((template.fields ?? []).map((f) => [f.id, ""])),
  };
  const sections = [...doc.sections];
  sections.splice(insertAt + 1, 0, newSection);
  return { ...doc, sections, updatedAt: new Date().toISOString() };
}

export function removeWritingSection(
  doc: HaulWritingDocument,
  sectionId: string,
): HaulWritingDocument {
  if (doc.sections.length <= 1) return doc;
  return {
    ...doc,
    sections: doc.sections.filter((s) => s.sectionId !== sectionId),
    updatedAt: new Date().toISOString(),
  };
}

export function moveWritingSection(
  doc: HaulWritingDocument,
  sectionId: string,
  direction: -1 | 1,
): HaulWritingDocument {
  const idx = doc.sections.findIndex((s) => s.sectionId === sectionId);
  if (idx < 0) return doc;
  const target = idx + direction;
  if (target < 0 || target >= doc.sections.length) return doc;
  const sections = [...doc.sections];
  const [item] = sections.splice(idx, 1);
  sections.splice(target, 0, item!);
  return { ...doc, sections, updatedAt: new Date().toISOString() };
}
