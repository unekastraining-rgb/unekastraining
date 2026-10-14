"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { SelectCheckbox } from "@/components/ui/SelectCheckbox";
import { MaterialLearningPanel } from "@/components/materials/MaterialLearningPanel";
import { MaterialOpenActions } from "@/components/materials/MaterialOpenActions";
import { confirmDeleteMany } from "@/lib/confirm-delete";
import { useSelectableIds } from "@/lib/selection/use-selectable-ids";

export type MaterialsListItem = {
  id: string;
  title: string;
  type: string;
  courseId: string;
  courseLabel: string;
  subtitle?: string;
};

/**
 * Materials list with select-one / select-all / bulk delete.
 * `variant="page"` includes learning panels; `variant="locker"` is compact rows.
 */
export function MaterialsSelectableList({
  materials,
  variant = "page",
}: {
  materials: MaterialsListItem[];
  variant?: "page" | "locker";
}) {
  const router = useRouter();
  const [items, setItems] = useState(materials);
  const ids = useMemo(() => items.map((m) => m.id), [items]);
  const selection = useSelectableIds(ids);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setItems(materials);
  }, [materials]);

  useEffect(() => {
    selection.pruneTo(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);

  async function deleteSelected() {
    const selected = selection.selectedIds;
    if (selected.length === 0) return;
    if (
      !confirmDeleteMany(selected.length, {
        noun: "material",
        detail: "Notes linked to these stay, but files and extracted text will be removed",
      })
    ) {
      return;
    }
    setBulkDeleting(true);
    try {
      const response = await fetch("/api/materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Could not delete materials.");
      }
      setItems((prev) => prev.filter((m) => !selected.includes(m.id)));
      selection.clear();
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete materials.");
    } finally {
      setBulkDeleting(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <BulkSelectionBar
        totalCount={items.length}
        selectedCount={selection.selectedCount}
        allSelected={selection.allSelected}
        someSelected={selection.someSelected}
        onToggleAll={selection.toggleAll}
        onClear={selection.clear}
        onDeleteSelected={() => void deleteSelected()}
        deleting={bulkDeleting}
        noun="material"
      />
      {variant === "page" ? (
        <ul className="space-y-4" data-materials-list>
          {items.map((material) => (
            <li
              key={material.id}
              className={`rounded-xl border bg-white p-4 ${
                selection.isSelected(material.id)
                  ? "border-[var(--sh-primary,#ea580c)] ring-2 ring-orange-200"
                  : "border-stone-200"
              }`}
              data-material-row
              data-material-id={material.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <SelectCheckbox
                    checked={selection.isSelected(material.id)}
                    onChange={() => selection.toggle(material.id)}
                    label={`Select ${material.title}`}
                    className="-ml-2 -mt-1"
                  />
                  <div>
                    <h2 className="text-base font-semibold text-stone-900">
                      {material.title}
                    </h2>
                    <p className="text-xs text-stone-500">
                      {material.courseLabel} · {material.type}
                    </p>
                  </div>
                </div>
                <MaterialOpenActions
                  materialId={material.id}
                  courseId={material.courseId}
                  title={material.title}
                  type={material.type}
                  onDeleted={() => {
                    setItems((prev) => prev.filter((m) => m.id !== material.id));
                    selection.clear();
                  }}
                />
              </div>
              <MaterialLearningPanel
                materialId={material.id}
                courseId={material.courseId}
                title={material.title}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="min-w-0 space-y-2">
          {items.map((material) => (
            <div
              key={material.id}
              className={`flex min-w-0 items-start gap-2 rounded-xl ${
                selection.isSelected(material.id)
                  ? "ring-2 ring-[var(--sh-primary,#ea580c)] ring-offset-1"
                  : ""
              }`}
            >
              <SelectCheckbox
                checked={selection.isSelected(material.id)}
                onChange={() => selection.toggle(material.id)}
                label={`Select ${material.title}`}
                className="mt-1 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <MaterialOpenActions
                  materialId={material.id}
                  courseId={material.courseId}
                  title={material.title}
                  type={material.type}
                  subtitle={material.subtitle}
                  onDeleted={() => {
                    setItems((prev) => prev.filter((m) => m.id !== material.id));
                    selection.clear();
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
