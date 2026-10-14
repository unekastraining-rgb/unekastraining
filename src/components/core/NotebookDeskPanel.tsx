"use client";

import { useMemo, useState } from "react";
import { Bell, Plus, Star, StickyNote, Trash2 } from "lucide-react";

import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import {
  DESK_COLORS,
  createDeskItem,
  deskFilter,
  reminderIsOverdue,
  removeDeskItem,
  upsertDeskItem,
  type NotebookDeskItem,
  type NotebookDeskItemKind,
  type NotebookDeskState,
} from "@/lib/core/notebook-desk";

type DeskFilter = "all" | NotebookDeskItemKind | "important" | "due";

const FILTERS: Array<{ id: DeskFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "quick", label: "Quick notes" },
  { id: "reminder", label: "Reminders" },
  { id: "concept", label: "Important" },
  { id: "due", label: "Due soon" },
];

function formatWhen(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotebookDeskPanel({
  desk,
  onChange,
  onPinToPage,
}: {
  desk: NotebookDeskState;
  onChange: (desk: NotebookDeskState) => void;
  onPinToPage: (item: NotebookDeskItem) => void;
}) {
  const [filter, setFilter] = useState<DeskFilter>("all");
  const [draftKind, setDraftKind] = useState<NotebookDeskItemKind>("quick");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState<string>(DESK_COLORS[0]);
  const [reminderAt, setReminderAt] = useState("");
  const [important, setImportant] = useState(false);

  const visible = useMemo(() => deskFilter(desk.items, filter), [desk.items, filter]);

  function addCard() {
    if (!title.trim() && !body.trim()) return;
    const item = createDeskItem({
      kind: draftKind,
      title: title.trim() || (draftKind === "concept" ? "Concept" : "Quick note"),
      body: body.trim(),
      color,
      important: important || draftKind === "concept",
      reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
    });
    onChange(upsertDeskItem(desk, item));
    setTitle("");
    setBody("");
    setReminderAt("");
    setImportant(false);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Notebook desk
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Quick notes, reminders, and important concepts — like a pocket notes app sitting on
          this notebook. They do not replace your pages.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((item) => (
          <CoreChromeAction
            key={item.id}
            onActivate={() => setFilter(item.id)}
            pressed={filter === item.id}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              filter === item.id
                ? "bg-stone-900 text-white"
                : "bg-orange-50 text-stone-600"
            }`}
          >
            {item.label}
          </CoreChromeAction>
        ))}
      </div>

      <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-3">
        <div className="flex flex-wrap gap-1">
          {(
            [
              { id: "quick", label: "Quick note" },
              { id: "reminder", label: "Reminder" },
              { id: "concept", label: "Important" },
            ] as const
          ).map((item) => (
            <CoreChromeAction
              key={item.id}
              onActivate={() => {
                setDraftKind(item.id);
                if (item.id === "concept") setImportant(true);
              }}
              pressed={draftKind === item.id}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                draftKind === item.id ? "bg-teal-600 text-white" : "bg-white text-stone-600"
              }`}
            >
              {item.label}
            </CoreChromeAction>
          ))}
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={
            draftKind === "concept" ? "Term or concept" : "Title"
          }
          className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={draftKind === "concept" ? "Definition / why it matters" : "Note…"}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm"
        />
        {draftKind === "reminder" ? (
          <input
            type="datetime-local"
            value={reminderAt}
            onChange={(event) => setReminderAt(event.target.value)}
            className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm"
          />
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {DESK_COLORS.map((swatch) => (
            <CoreChromeAction
              key={swatch}
              onActivate={() => setColor(swatch)}
              pressed={color === swatch}
              aria-label={`Color ${swatch}`}
              className={`h-5 w-5 rounded-full border ${
                color === swatch ? "border-stone-900 ring-2 ring-stone-900/20" : "border-stone-200"
              }`}
            >
              <span className="block h-full w-full rounded-full" style={{ background: swatch }} />
            </CoreChromeAction>
          ))}
          <CoreChromeAction
            onActivate={() => setImportant((value) => !value)}
            pressed={important}
            className={`ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${
              important ? "bg-amber-100 text-amber-800" : "bg-white text-stone-500"
            }`}
          >
            <Star className="h-3 w-3" />
            Star
          </CoreChromeAction>
        </div>
        <CoreChromeAction
          onActivate={addCard}
          className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Add to desk
        </CoreChromeAction>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-orange-200 px-3 py-6 text-center text-xs text-stone-500">
          Nothing here yet. Add a quick note, set a reminder, or star a concept.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => {
            const overdue = reminderIsOverdue(item);
            return (
              <li
                key={item.id}
                className="rounded-2xl border border-stone-200 p-3 shadow-sm"
                style={{ background: item.color }}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      {item.kind === "reminder"
                        ? "Reminder"
                        : item.kind === "concept"
                          ? "Important"
                          : "Quick note"}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-stone-900">{item.title || "Untitled"}</p>
                    {item.body ? (
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-stone-700">
                        {item.body}
                      </p>
                    ) : null}
                    {item.reminderAt ? (
                      <p
                        className={`mt-2 inline-flex items-center gap-1 text-[10px] font-semibold ${
                          overdue ? "text-rose-700" : "text-stone-600"
                        }`}
                      >
                        <Bell className="h-3 w-3" />
                        {overdue ? "Overdue · " : ""}
                        {formatWhen(item.reminderAt)}
                      </p>
                    ) : null}
                  </div>
                  {item.important ? <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" /> : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <CoreChromeAction
                    onActivate={() => onPinToPage(item)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-semibold text-stone-700"
                  >
                    <StickyNote className="h-3 w-3" />
                    Pin to page
                  </CoreChromeAction>
                  <CoreChromeAction
                    onActivate={() =>
                      onChange(
                        upsertDeskItem(desk, { ...item, important: !item.important }),
                      )
                    }
                    className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-semibold text-stone-700"
                  >
                    {item.important ? "Unstar" : "Star"}
                  </CoreChromeAction>
                  <CoreChromeAction
                    onActivate={() => onChange(removeDeskItem(desk, item.id))}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-semibold text-rose-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </CoreChromeAction>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
