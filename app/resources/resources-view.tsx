"use client";

import { useMemo, useState } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";

import { ResourceCard } from "@/components/resources/ResourceCard";
import {
  ResourceFormModal,
  type ResourceFormValues,
} from "@/components/resources/ResourceFormModal";
import { ResourceLibrarySettingsPanel } from "@/components/resources/ResourceLibrarySettingsPanel";
import { confirmDelete } from "@/lib/confirm-delete";
import { filterResources } from "@/lib/resources/search";
import {
  RESOURCE_FILTER_OPTIONS,
  RESOURCE_SORT_OPTIONS,
  type ResourceCategory,
  type ResourceRecord,
  type ResourcesLibrarySettings,
  type ResourceSort,
} from "@/lib/resources/types";

export function ResourcesView({
  initialResources,
  initialSettings,
  aiAvailable,
}: {
  initialResources: ResourceRecord[];
  initialSettings: ResourcesLibrarySettings;
  aiAvailable: boolean;
}) {
  const [resources, setResources] = useState(initialResources);
  const [settings, setSettings] = useState(initialSettings);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ResourceCategory>("all");
  const [sort, setSort] = useState<ResourceSort>("az");
  const [showSettings, setShowSettings] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceRecord | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResults, setAiResults] = useState<ResourceRecord[] | null>(null);
  const [discovering, setDiscovering] = useState(false);

  const displayed = useMemo(() => {
    if (aiResults) return aiResults;
    return filterResources(resources, { query, category, sort });
  }, [resources, query, category, sort, aiResults]);

  async function persistSettings(patch: Partial<ResourcesLibrarySettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await fetch("/api/resources/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function saveResource(values: ResourceFormValues) {
    const payload = {
      title: values.title.trim(),
      url: values.url.trim(),
      description: values.description.trim() || null,
      category: values.category,
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      icon: values.icon,
      accentColor: values.accentColor || null,
    };

    const response = await fetch(
      editing ? `/api/resources/${editing.id}` : "/api/resources",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();
    if (!data.success) {
      alert(data.error ?? "Failed to save resource.");
      return;
    }

    setResources((current) => {
      if (editing) {
        return current.map((item) => (item.id === editing.id ? data.data : item));
      }
      return [...current, data.data];
    });
    setAiResults(null);
  }

  async function deleteResource(resource: ResourceRecord) {
    if (!confirmDelete(resource.title)) return;
    const response = await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!data.success) {
      alert(data.error ?? "Failed to delete resource.");
      return;
    }
    setResources((current) => current.filter((item) => item.id !== resource.id));
    setAiResults(null);
  }

  async function openResource(resource: ResourceRecord) {
    void fetch(`/api/resources/${resource.id}/open`, { method: "POST" });
    setResources((current) =>
      current.map((item) =>
        item.id === resource.id
          ? {
              ...item,
              openCount: item.openCount + 1,
              lastOpenedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    window.open(resource.url, "_blank", "noopener,noreferrer");
  }

  async function runAiDiscovery() {
    if (!aiQuestion.trim()) return;
    setDiscovering(true);
    try {
      const response = await fetch("/api/resources/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: aiQuestion }),
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error ?? "Could not search resources.");
        return;
      }
      setAiResults(data.data ?? []);
      if (data.searchTerms?.length) {
        setQuery(data.searchTerms.join(" "));
      }
    } finally {
      setDiscovering(false);
    }
  }

  const isDarkShell = settings.appearance === "dark";

  return (
    <div
      className={
        isDarkShell
          ? "min-h-screen bg-stone-950 text-stone-100"
          : "page-canvas min-h-screen overflow-x-clip"
      }
    >
      <div className="resources-shell">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="theme-eyebrow">
              <FolderOpen className="h-3.5 w-3.5" />
              Resource Library
            </div>
            <h1 className="text-heading mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Your school resources
            </h1>
            <p className="text-body mt-2 max-w-xl text-sm leading-relaxed sm:text-base">
              One organized place for tutoring, library links, student services, and every portal
              your school spreads across different websites.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowSettings((current) => !current)}
              className="btn-ghost"
            >
              <Settings2 className="h-4 w-4" />
              Customize
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Resource
            </button>
          </div>
        </header>

        {showSettings ? (
          <section className="surface-elevated p-5">
            <ResourceLibrarySettingsPanel settings={settings} onChange={persistSettings} />
          </section>
        ) : null}

        <section className="resources-toolbar space-y-5">
          <div className="resources-search">
            <Search className="h-4 w-4 shrink-0 text-brand" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setAiResults(null);
              }}
              placeholder="Search resources… tutoring, library, financial aid"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {RESOURCE_FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setCategory(option.id);
                  setAiResults(null);
                }}
                className={`chip ${category === option.id ? "chip-active" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div
            className="flex flex-wrap items-center gap-3 border-t pt-4"
            style={{ borderColor: "var(--sh-border-subtle)" }}
          >
            <label className="text-body text-xs font-semibold uppercase tracking-wider">
              Sort
            </label>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ResourceSort)}
              className="input-brand px-3 py-2 text-xs font-semibold"
            >
              {RESOURCE_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {aiResults ? (
              <button
                type="button"
                onClick={() => setAiResults(null)}
                className="chip text-brand"
              >
                Clear smart results
              </button>
            ) : null}
          </div>

          {aiAvailable ? (
            <div className="theme-ai-callout resources-ai-panel">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="theme-ai-callout-label">Optional AI discovery</p>
                <Sparkles className="h-4 w-4 text-brand" />
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={aiQuestion}
                  onChange={(event) => setAiQuestion(event.target.value)}
                  placeholder='Ask: "Where can I find tutoring for a research paper?"'
                  className="input-brand min-w-0 flex-1 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void runAiDiscovery()}
                  disabled={discovering}
                  className="btn-ai inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {discovering ? "Searching…" : "Ask AI"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <p className="text-body text-xs font-semibold uppercase tracking-wider">
          {displayed.length} resource{displayed.length === 1 ? "" : "s"}
        </p>

        {displayed.length === 0 ? (
          <div className="resources-empty">
            <div className="resources-empty-icon">
              <FolderOpen className="h-6 w-6" />
            </div>
            <p className="text-heading mt-4 text-lg font-bold">No resources yet</p>
            <p className="text-body mx-auto mt-2 max-w-md text-sm leading-relaxed">
              Add your library, tutoring center, student portal, and other school links to build your
              personal resource library.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="btn-primary mt-5 px-5 py-2.5 text-sm"
            >
              Add your first resource
            </button>
          </div>
        ) : settings.layout === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayed.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                settings={settings}
                layout="grid"
                onOpen={openResource}
                onEdit={(item) => {
                  setEditing(item);
                  setFormOpen(true);
                }}
                onDelete={deleteResource}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                settings={settings}
                layout="list"
                onOpen={openResource}
                onEdit={(item) => {
                  setEditing(item);
                  setFormOpen(true);
                }}
                onDelete={deleteResource}
              />
            ))}
          </div>
        )}
      </div>

      <ResourceFormModal
        open={formOpen}
        initial={editing}
        aiAvailable={aiAvailable}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={saveResource}
      />
    </div>
  );
}
