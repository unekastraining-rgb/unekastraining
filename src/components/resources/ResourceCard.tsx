"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";

import { ResourceIcon } from "@/components/resources/ResourceIcon";
import {
  RESOURCE_CATEGORY_LABELS,
  type ResourceRecord,
  type ResourcesLibrarySettings,
} from "@/lib/resources/types";

export function ResourceCard({
  resource,
  settings,
  layout,
  onOpen,
  onEdit,
  onDelete,
}: {
  resource: ResourceRecord;
  settings: ResourcesLibrarySettings;
  layout: ResourcesLibrarySettings["layout"];
  onOpen: (resource: ResourceRecord) => void;
  onEdit: (resource: ResourceRecord) => void;
  onDelete: (resource: ResourceRecord) => void;
}) {
  const accent = resource.accentColor ?? settings.accentColor ?? "var(--sh-primary)";

  if (layout === "list") {
    return (
      <div className="card-elevated flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        {settings.showIcons ? (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              background: "var(--sh-chip)",
              borderColor: "var(--sh-chip-border)",
              color: resource.accentColor ? accent : "var(--sh-primary)",
              ...(resource.accentColor
                ? { backgroundColor: `${accent}18`, borderColor: `${accent}33` }
                : {}),
            }}
          >
            <ResourceIcon icon={resource.icon} className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-heading font-semibold">{resource.title}</h3>
            <span className="chip py-0.5 text-[10px]">{RESOURCE_CATEGORY_LABELS[resource.category]}</span>
          </div>
          {settings.showDescriptions && resource.description ? (
            <p className="text-body mt-1 text-sm">{resource.description}</p>
          ) : null}
          {settings.showTags && resource.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span key={tag} className="chip py-0.5 text-[10px] font-medium">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpen(resource)}
            className="btn-primary inline-flex items-center gap-1 px-3 py-2 text-xs"
          >
            Open
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onEdit(resource)} className="btn-ghost px-3 py-2 text-xs">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(resource)} className="btn-ghost px-3 py-2 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        {settings.showIcons ? (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              background: "var(--sh-chip)",
              borderColor: "var(--sh-chip-border)",
              color: resource.accentColor ? accent : "var(--sh-primary)",
              ...(resource.accentColor
                ? { backgroundColor: `${accent}18`, borderColor: `${accent}33` }
                : {}),
            }}
          >
            <ResourceIcon icon={resource.icon} className="h-5 w-5" />
          </div>
        ) : null}
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(resource)}
            className="btn-ghost px-2.5 py-2"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(resource)}
            className="btn-ghost px-2.5 py-2"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 min-w-0 flex-1">
        <h3 className="text-heading text-lg font-bold">{resource.title}</h3>
        {settings.showDescriptions && resource.description ? (
          <p className="text-body mt-2 text-sm leading-relaxed">{resource.description}</p>
        ) : null}
        <p className="mt-3">
          <span className="chip py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {RESOURCE_CATEGORY_LABELS[resource.category]}
          </span>
        </p>
        {settings.showTags && resource.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resource.tags.map((tag) => (
              <span key={tag} className="chip py-0.5 text-[10px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onOpen(resource)}
        className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
      >
        Open
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
