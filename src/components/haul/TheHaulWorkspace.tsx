"use client";

import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import {
  Download,
  FileText,
  LayoutTemplate,
  PenLine,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";

import { HaulWritingWorkspace } from "@/components/haul/HaulWritingWorkspace";
import { ClientIcon } from "@/components/ui/ClientIcon";
import { useTapHandler } from "@/hooks/useTapHandler";
import {
  createHaulWritingDocument,
  loadActiveHaulWritingId,
  loadHaulWritingDocuments,
  setActiveHaulWritingId,
  upsertHaulWritingDocument,
} from "@/lib/haul/writing/document";
import {
  HAUL_WRITING_CATEGORY_LABELS,
  listHaulWritingTypes,
  listHaulWritingTypesByCategory,
  suggestHaulWritingTypeFromAssignment,
} from "@/lib/haul/writing/registry";
import type {
  HaulWritingDocument,
  HaulWritingMode,
} from "@/lib/haul/writing/types";

type HaulBlock = {
  id: string;
  type: "heading" | "text" | "todo" | "divider";
  text: string;
  done?: boolean;
};

type HaulDoc = {
  title: string;
  blocks: HaulBlock[];
  updatedAt: string;
};

type HaulView =
  | { kind: "landing" }
  | { kind: "pages" }
  | { kind: "writing"; document: HaulWritingDocument };

const STORAGE_KEY = "study-haul-the-haul-v1";

const STARTER_TEMPLATES: Array<{
  id: string;
  label: string;
  hint: string;
  build: () => HaulDoc;
}> = [
  {
    id: "blank",
    label: "Blank page",
    hint: "Empty canvas — build it your way",
    build: () => ({
      title: "Untitled",
      updatedAt: new Date().toISOString(),
      blocks: [{ id: crypto.randomUUID(), type: "text", text: "" }],
    }),
  },
  {
    id: "weekly",
    label: "Weekly planner",
    hint: "Goals, tasks, and notes for the week",
    build: () => ({
      title: "This week",
      updatedAt: new Date().toISOString(),
      blocks: [
        { id: crypto.randomUUID(), type: "heading", text: "Top goals" },
        {
          id: crypto.randomUUID(),
          type: "todo",
          text: "Biggest academic win",
          done: false,
        },
        {
          id: crypto.randomUUID(),
          type: "todo",
          text: "One thing to catch up",
          done: false,
        },
        { id: crypto.randomUUID(), type: "divider", text: "" },
        { id: crypto.randomUUID(), type: "heading", text: "Daily notes" },
        { id: crypto.randomUUID(), type: "text", text: "" },
      ],
    }),
  },
  {
    id: "exam",
    label: "Exam prep board",
    hint: "Topics, practice, and weak spots",
    build: () => ({
      title: "Exam prep",
      updatedAt: new Date().toISOString(),
      blocks: [
        { id: crypto.randomUUID(), type: "heading", text: "Must know" },
        { id: crypto.randomUUID(), type: "todo", text: "Topic 1", done: false },
        { id: crypto.randomUUID(), type: "todo", text: "Topic 2", done: false },
        { id: crypto.randomUUID(), type: "heading", text: "Practice" },
        {
          id: crypto.randomUUID(),
          type: "text",
          text: "Questions I missed…",
        },
        { id: crypto.randomUUID(), type: "heading", text: "Weak spots" },
        { id: crypto.randomUUID(), type: "text", text: "" },
      ],
    }),
  },
  {
    id: "project",
    label: "Project tracker",
    hint: "Milestones and next steps",
    build: () => ({
      title: "Project",
      updatedAt: new Date().toISOString(),
      blocks: [
        { id: crypto.randomUUID(), type: "heading", text: "Outcome" },
        {
          id: crypto.randomUUID(),
          type: "text",
          text: "What done looks like…",
        },
        { id: crypto.randomUUID(), type: "heading", text: "Milestones" },
        { id: crypto.randomUUID(), type: "todo", text: "Draft", done: false },
        { id: crypto.randomUUID(), type: "todo", text: "Review", done: false },
        { id: crypto.randomUUID(), type: "todo", text: "Submit", done: false },
      ],
    }),
  },
];

function loadDoc(): HaulDoc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HaulDoc;
      if (parsed?.blocks?.length) return parsed;
    }
  } catch {
    // ignore
  }
  return STARTER_TEMPLATES[0]!.build();
}

/**
 * The Haul — guided writing + existing Notion-style pages.
 * Additive enhancement: writing types coexist with page/block foundation.
 */
export function TheHaulWorkspace() {
  const [view, setView] = useState<HaulView>({ kind: "landing" });
  const [doc, setDoc] = useState<HaulDoc | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<HaulWritingMode>("write");
  const [assignment, setAssignment] = useState("");
  const [recentWriting, setRecentWriting] = useState<HaulWritingDocument[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    setDoc(loadDoc());
    setRecentWriting(loadHaulWritingDocuments());
    const activeId = loadActiveHaulWritingId();
    if (activeId) {
      const found = loadHaulWritingDocuments().find((d) => d.id === activeId);
      if (found) setView({ kind: "writing", document: found });
    }
  }, []);

  useEffect(() => {
    if (!doc) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch {
      // ignore
    }
  }, [doc]);

  const openWriting = (typeId: string, writingMode: HaulWritingMode = mode) => {
    const created = createHaulWritingDocument({
      writingTypeId: typeId,
      mode: writingMode,
      assignmentPrompt: assignment.trim() || undefined,
    });
    if (!created) return;
    upsertHaulWritingDocument(created);
    setActiveHaulWritingId(created.id);
    setRecentWriting(loadHaulWritingDocuments());
    setView({ kind: "writing", document: created });
  };

  const tapTemplates = useTapHandler(() => setPickerOpen((value) => !value));
  const tapAddText = useTapHandler(() => {
    setDoc((current) => {
      if (!current) return current;
      return {
        ...current,
        updatedAt: new Date().toISOString(),
        blocks: [
          ...current.blocks,
          { id: crypto.randomUUID(), type: "text", text: "" },
        ],
      };
    });
  });
  const tapAddTodo = useTapHandler(() => {
    setDoc((current) => {
      if (!current) return current;
      return {
        ...current,
        updatedAt: new Date().toISOString(),
        blocks: [
          ...current.blocks,
          { id: crypto.randomUUID(), type: "todo", text: "", done: false },
        ],
      };
    });
  });
  const tapExport = useTapHandler(() => {
    if (!doc) return;
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${doc.title.replace(/\s+/g, "-").toLowerCase() || "the-haul"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });
  const tapImport = useTapHandler(() => fileRef.current?.click());

  if (view.kind === "writing") {
    return (
      <HaulWritingWorkspace
        document={view.document}
        onBack={() => {
          setActiveHaulWritingId(null);
          setRecentWriting(loadHaulWritingDocuments());
          setView({ kind: "landing" });
        }}
        onChange={(next) => {
          setView({ kind: "writing", document: next });
          setRecentWriting(loadHaulWritingDocuments());
        }}
      />
    );
  }

  if (view.kind === "pages") {
    if (!doc) {
      return (
        <div className="px-6 py-16 text-center text-sm text-stone-500">
          Loading The Haul…
        </div>
      );
    }
    return (
      <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => setView({ kind: "landing" })}
            className="text-sm font-semibold text-stone-600 hover:text-stone-900"
          >
            ← Haul home
          </button>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Pages · focused editor
          </p>
        </div>
        <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 md:px-6">
          <HaulPageEditor
            doc={doc}
            setDoc={setDoc}
            pickerOpen={pickerOpen}
            setPickerOpen={setPickerOpen}
            tapTemplates={tapTemplates}
            tapImport={tapImport}
            tapExport={tapExport}
            tapAddText={tapAddText}
            tapAddTodo={tapAddTodo}
            fileRef={fileRef}
          />
        </div>
      </div>
    );
  }

  const categories = ["academic", "school", "professional", "creative"] as const;

  return (
    <div
      data-haul-landing
      className="grid min-h-[calc(100dvh-5.5rem)] w-full grid-cols-1 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]"
    >
      {/* Left rail — purpose, mode, assignment, recent, pages */}
      <aside className="flex flex-col border-b border-stone-200 bg-white lg:border-b-0 lg:border-r">
        <div className="space-y-5 px-5 py-6 lg:px-6 lg:py-8">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              The Haul
            </p>
            <h1 className="mt-2 font-serif text-3xl text-stone-900 sm:text-4xl">
              Write. Learn. Improve.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Where you go when you need to write something — learn the type,
              draft with structure, improve with help.
            </p>
          </header>

          <section>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              What are you working on?
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {(
                [
                  ["learn", "Learn to Write"],
                  ["write", "Write"],
                  ["improve", "Improve"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`min-h-11 rounded-lg px-3 py-2 text-left text-sm font-semibold touch-manipulation ${
                    mode === id
                      ? "bg-stone-900 text-white"
                      : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Assignment (optional)
            </label>
            <textarea
              value={assignment}
              onChange={(e) => setAssignment(e.target.value)}
              rows={3}
              placeholder='e.g. "Write a 5-paragraph argumentative essay…"'
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-orange-300 focus:bg-white"
            />
            {assignment.trim() ? (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-orange-700 underline-offset-2 hover:underline"
                onClick={() => {
                  const suggestion = suggestHaulWritingTypeFromAssignment(assignment);
                  if (suggestion) openWriting(suggestion.typeId, mode);
                }}
              >
                Suggest template from assignment
              </button>
            ) : null}
          </section>

          {recentWriting.length > 0 ? (
            <section>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Recent writing
              </p>
              <ul className="mt-2 space-y-1">
                {recentWriting.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveHaulWritingId(item.id);
                        setView({ kind: "writing", document: item });
                      }}
                      className="flex w-full min-h-11 flex-col items-start rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-left touch-manipulation hover:bg-stone-100"
                    >
                      <span className="text-sm font-semibold text-stone-900">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {listHaulWritingTypes().find((t) => t.id === item.writingTypeId)
                          ?.title ?? item.writingTypeId}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="border-t border-stone-100 pt-4">
            <p className="text-xs font-bold text-stone-900">Pages & planners</p>
            <p className="mt-1 text-xs text-stone-500">
              Existing Haul pages, templates, import/export — unchanged.
            </p>
            <button
              type="button"
              onClick={() => setView({ kind: "pages" })}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-50"
            >
              <ClientIcon icon={FileText} className="h-4 w-4" />
              Open page editor
            </button>
          </section>
        </div>
      </aside>

      {/* Primary stage — writing type catalog */}
      <main className="min-h-0 overflow-y-auto bg-stone-50/80 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            What are you trying to write?
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Choose a writing type to open a guided workspace — not a blank page.
          </p>
        </div>
        <div className="grid gap-8 xl:grid-cols-2">
          {categories.map((category) => {
            const types = listHaulWritingTypesByCategory(category);
            return (
              <section key={category}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                  {HAUL_WRITING_CATEGORY_LABELS[category]}
                </h3>
                <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
                  {types.map((type) => (
                    <li key={type.id}>
                      <button
                        type="button"
                        onClick={() => openWriting(type.id, mode)}
                        className="flex w-full min-h-11 items-start justify-between gap-3 px-4 py-3 text-left touch-manipulation hover:bg-stone-50"
                      >
                        <span>
                          <span className="block text-sm font-bold text-stone-900">
                            {type.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-stone-500">
                            {type.description}
                          </span>
                        </span>
                        <ClientIcon
                          icon={PenLine}
                          className="mt-1 h-4 w-4 shrink-0 text-orange-500"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function HaulPageEditor({
  doc,
  setDoc,
  pickerOpen,
  setPickerOpen,
  tapTemplates,
  tapImport,
  tapExport,
  tapAddText,
  tapAddTodo,
  fileRef,
}: {
  doc: HaulDoc;
  setDoc: Dispatch<SetStateAction<HaulDoc | null>>;
  pickerOpen: boolean;
  setPickerOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  tapTemplates: ReturnType<typeof useTapHandler>;
  tapImport: ReturnType<typeof useTapHandler>;
  tapExport: ReturnType<typeof useTapHandler>;
  tapAddText: ReturnType<typeof useTapHandler>;
  tapAddTodo: ReturnType<typeof useTapHandler>;
  fileRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
            The Haul · Pages
          </p>
          <h1 className="mt-1 text-3xl font-black text-stone-900">
            Your page, your layout
          </h1>
          <p className="mt-2 max-w-xl text-sm text-stone-600">
            Planners, boards, and checklists. Start from a template or import a
            saved Haul page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            {...tapTemplates}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand bg-white px-3 py-2 text-xs font-bold text-stone-700 touch-manipulation hover:bg-brand-soft"
          >
            <ClientIcon icon={LayoutTemplate} className="h-4 w-4" />
            Templates
          </button>
          <button
            type="button"
            {...tapImport}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand bg-white px-3 py-2 text-xs font-bold text-stone-700 touch-manipulation hover:bg-brand-soft"
          >
            <ClientIcon icon={Upload} className="h-4 w-4" />
            Import
          </button>
          <button
            type="button"
            {...tapExport}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand bg-white px-3 py-2 text-xs font-bold text-stone-700 touch-manipulation hover:bg-brand-soft"
          >
            <ClientIcon icon={Download} className="h-4 w-4" />
            Export
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const parsed = JSON.parse(String(reader.result)) as HaulDoc;
                  if (!parsed?.blocks || !Array.isArray(parsed.blocks)) {
                    throw new Error("Invalid Haul file");
                  }
                  setDoc({
                    title: parsed.title || "Imported",
                    blocks: parsed.blocks,
                    updatedAt: new Date().toISOString(),
                  });
                  setPickerOpen(false);
                } catch {
                  window.alert(
                    "Could not import that file. Use a The Haul JSON export.",
                  );
                }
              };
              reader.readAsText(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {pickerOpen ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {STARTER_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                setDoc(template.build());
                setPickerOpen(false);
              }}
              className="rounded-2xl border border-brand bg-white p-4 text-left touch-manipulation hover:bg-brand-soft/40"
            >
              <p className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <ClientIcon icon={Sparkles} className="h-4 w-4 text-orange-500" />
                {template.label}
              </p>
              <p className="mt-1 text-xs text-stone-500">{template.hint}</p>
            </button>
          ))}
        </div>
      ) : null}

      <div className="rounded-3xl border border-brand bg-white p-5 shadow-sm sm:p-8">
        <input
          value={doc.title}
          onChange={(event) =>
            setDoc((current) =>
              current
                ? {
                    ...current,
                    title: event.target.value,
                    updatedAt: new Date().toISOString(),
                  }
                : current,
            )
          }
          className="w-full bg-transparent text-2xl font-black text-stone-900 outline-none placeholder:text-stone-300 sm:text-3xl"
          placeholder="Page title"
        />
        <div className="mt-6 space-y-3">
          {doc.blocks.map((block) => (
            <HaulBlockRow
              key={block.id}
              block={block}
              onChange={(next) => {
                setDoc((current) => {
                  if (!current) return current;
                  return {
                    ...current,
                    updatedAt: new Date().toISOString(),
                    blocks: current.blocks.map((item) =>
                      item.id === block.id ? next : item,
                    ),
                  };
                });
              }}
              onRemove={() => {
                setDoc((current) => {
                  if (!current) return current;
                  return {
                    ...current,
                    updatedAt: new Date().toISOString(),
                    blocks: current.blocks.filter((item) => item.id !== block.id),
                  };
                });
              }}
            />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-brand pt-4">
          <button
            type="button"
            {...tapAddText}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-dashed border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 touch-manipulation hover:bg-stone-50"
          >
            <ClientIcon icon={Plus} className="h-3.5 w-3.5" />
            Text
          </button>
          <button
            type="button"
            {...tapAddTodo}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-dashed border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 touch-manipulation hover:bg-stone-50"
          >
            <ClientIcon icon={Plus} className="h-3.5 w-3.5" />
            To-do
          </button>
        </div>
      </div>
    </>
  );
}

function HaulBlockRow({
  block,
  onChange,
  onRemove,
}: {
  block: HaulBlock;
  onChange: (next: HaulBlock) => void;
  onRemove: () => void;
}) {
  if (block.type === "divider") {
    return <hr className="border-stone-200" />;
  }

  if (block.type === "todo") {
    return (
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={Boolean(block.done)}
          onChange={(event) => onChange({ ...block, done: event.target.checked })}
          className="mt-2.5 h-4 w-4 rounded border-stone-300"
          aria-label="Mark done"
        />
        <input
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          className={`min-h-11 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-2 text-sm outline-none focus:border-brand ${
            block.done ? "text-stone-400 line-through" : "text-stone-800"
          }`}
          placeholder="To-do"
        />
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <input
        value={block.text}
        onChange={(event) => onChange({ ...block, text: event.target.value })}
        className={`min-h-11 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-2 outline-none focus:border-brand ${
          block.type === "heading"
            ? "text-lg font-bold text-stone-900"
            : "text-sm text-stone-800"
        }`}
        placeholder={block.type === "heading" ? "Heading" : "Type anything…"}
      />
      <button
        type="button"
        onClick={onRemove}
        className="mt-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-stone-400 hover:bg-stone-100 hover:text-stone-700"
      >
        Remove
      </button>
    </div>
  );
}
