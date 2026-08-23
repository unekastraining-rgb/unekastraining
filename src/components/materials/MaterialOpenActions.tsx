"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, NotebookPen, PanelTopOpen } from "lucide-react";

import { MaterialPreviewModal } from "@/components/materials/MaterialPreviewModal";
import {
  getMaterialOpenPreference,
  openMaterialInCore,
  openMaterialPreview,
  setMaterialOpenPreference,
  type MaterialOpenMode,
  type MaterialPreviewPayload,
} from "@/lib/materials/client";

export function MaterialOpenActions({
  materialId,
  courseId: _courseId,
  title,
  type,
  subtitle,
  className = "",
}: {
  materialId: string;
  courseId: string;
  title: string;
  type: string;
  subtitle?: string;
  className?: string;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<MaterialPreviewPayload | null>(null);
  const [openingCore, setOpeningCore] = useState(false);
  const [openingPreview, setOpeningPreview] = useState(false);

  async function handleOpenInCore() {
    setOpeningCore(true);
    try {
      setMaterialOpenPreference("core");
      const { coreHref } = await openMaterialInCore(materialId);
      setPreview(null);
      router.push(coreHref);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not open workbook.");
    } finally {
      setOpeningCore(false);
    }
  }

  async function handleOpenPreview() {
    setOpeningPreview(true);
    try {
      setMaterialOpenPreference("popup");
      const material = await openMaterialPreview(materialId);
      setPreview(material);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not open preview.");
    } finally {
      setOpeningPreview(false);
    }
  }

  async function handlePrimaryOpen() {
    const preference = getMaterialOpenPreference();
    if (preference === "core") {
      await handleOpenInCore();
    } else {
      await handleOpenPreview();
    }
  }

  return (
    <>
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border border-orange-100 px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50/50 ${className}`}
      >
        <button
          type="button"
          onClick={() => void handlePrimaryOpen()}
          disabled={openingCore || openingPreview}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block truncate font-medium text-stone-900">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs text-stone-500">{subtitle}</span>
          ) : null}
          <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wider text-stone-400">
            {type.replaceAll("_", " ")}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <ActionChip
            label="Quick view"
            icon={PanelTopOpen}
            active={getMaterialOpenPreference() === "popup"}
            loading={openingPreview}
            onClick={() => void handleOpenPreview()}
          />
          <ActionChip
            label="Core workbook"
            icon={NotebookPen}
            active={getMaterialOpenPreference() === "core"}
            loading={openingCore}
            onClick={() => void handleOpenInCore()}
          />
        </div>
      </div>

      {preview ? (
        <MaterialPreviewModal
          material={preview}
          openingCore={openingCore}
          onClose={() => setPreview(null)}
          onOpenInCore={() => void handleOpenInCore()}
        />
      ) : null}
    </>
  );
}

function ActionChip({
  label,
  icon: Icon,
  active,
  loading,
  onClick,
}: {
  label: string;
  icon: typeof ExternalLink;
  active: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-semibold transition disabled:opacity-60 ${
        active
          ? "border-teal-200 bg-teal-50 text-teal-800"
          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
