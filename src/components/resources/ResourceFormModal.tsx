"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { ColorPicker } from "@/components/customization/ColorPicker";
import { ResourceIcon } from "@/components/resources/ResourceIcon";
import {
  RESOURCE_FILTER_OPTIONS,
  RESOURCE_ICON_OPTIONS,
  type ResourceCategory,
  type ResourceRecord,
} from "@/lib/resources/types";

export interface ResourceFormValues {
  title: string;
  url: string;
  description: string;
  category: ResourceCategory;
  tags: string;
  icon: string;
  accentColor: string;
}

const emptyForm: ResourceFormValues = {
  title: "",
  url: "",
  description: "",
  category: "other",
  tags: "",
  icon: "link",
  accentColor: "",
};

export function ResourceFormModal({
  open,
  initial,
  aiAvailable,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: ResourceRecord | null;
  aiAvailable: boolean;
  onClose: () => void;
  onSave: (values: ResourceFormValues) => Promise<void>;
  onEnhance?: never;
}) {
  const [form, setForm] = useState<ResourceFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        url: initial.url,
        description: initial.description ?? "",
        category: initial.category,
        tags: initial.tags.join(", "),
        icon: initial.icon,
        accentColor: initial.accentColor ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setAiSummary("");
  }, [open, initial]);

  if (!open) return null;

  async function handleEnhance() {
    if (!form.title.trim() && !form.url.trim()) return;
    setEnhancing(true);
    try {
      const response = await fetch("/api/resources/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          url: form.url,
          description: form.description,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error ?? "AI enhancement unavailable.");
        return;
      }
      setForm((current) => ({
        ...current,
        description: data.data.description || current.description,
        category: data.data.category || current.category,
        tags: data.data.tags?.length ? data.data.tags.join(", ") : current.tags,
      }));
      setAiSummary(data.data.summary ?? "");
    } finally {
      setEnhancing(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-brand bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {initial ? "Edit resource" : "Add resource"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Save school links and services in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-stone-600">Title *</span>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="input-brand mt-1 w-full px-3 py-2 text-sm"
              placeholder="University Library"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-stone-600">URL *</span>
            <input
              required
              type="url"
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              className="input-brand mt-1 w-full px-3 py-2 text-sm"
              placeholder="https://school.edu/library"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-stone-600">Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              className="input-brand mt-1 w-full px-3 py-2 text-sm"
              placeholder="Research databases, journals, and library services."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-stone-600">Category</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value as ResourceCategory,
                  }))
                }
                className="input-brand mt-1 w-full px-3 py-2 text-sm"
              >
                {RESOURCE_FILTER_OPTIONS.filter((item) => item.id !== "all").map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-stone-600">Tags</span>
              <input
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                className="input-brand mt-1 w-full px-3 py-2 text-sm"
                placeholder="Research, Databases, Books"
              />
            </label>
          </div>

          <div>
            <span className="text-xs font-semibold text-stone-600">Icon</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {RESOURCE_ICON_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, icon: option.id }))}
                  className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold ${
                    form.icon === option.id
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-stone-200 text-stone-600"
                  }`}
                >
                  <ResourceIcon icon={option.id} className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <ColorPicker
              compact
              label="Accent color"
              value={form.accentColor || "#ea580c"}
              onChange={(color) => setForm((current) => ({ ...current, accentColor: color }))}
            />
          </div>

          {aiAvailable ? (
            <div className="theme-ai-callout space-y-3">
              <p className="theme-ai-callout-label">Enhance with AI</p>
              <button
                type="button"
                onClick={() => void handleEnhance()}
                disabled={enhancing}
                className="btn-ai px-3 py-2 text-xs disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {enhancing ? "Enhancing…" : "Enhance with AI"}
              </button>
            </div>
          ) : null}

          {aiSummary ? (
            <p className="theme-ai-callout-label rounded-xl border border-brand bg-brand-soft px-3 py-2 text-xs normal-case tracking-normal">
              {aiSummary}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : initial ? "Save changes" : "Add resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
