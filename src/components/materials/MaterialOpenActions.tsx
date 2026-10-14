"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  Layers,
  MessageCircle,
  NotebookPen,
  PanelTopOpen,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

import { MaterialPreviewModal } from "@/components/materials/MaterialPreviewModal";
import {
  getMaterialOpenPreference,
  openMaterialPreview,
  setMaterialOpenPreference,
  type MaterialOpenMode,
  type MaterialPreviewPayload,
} from "@/lib/materials/client";
import { coreCourseHref } from "@/lib/study/core-href";
import { withLearningFocus } from "@/lib/study/learning-focus";
import {
  blurtingHref,
  coreStudyGuideHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
  studyHaulHref,
  teachMeHref,
} from "@/lib/study/loop-hrefs";
import { buildPracticeItemHref, listSupportedPracticeLandscape } from "@/lib/study/practice-landscape";

export function MaterialOpenActions({
  materialId,
  courseId,
  title,
  type,
  subtitle,
  className = "",
  onDeleted,
}: {
  materialId: string;
  courseId: string;
  title: string;
  type: string;
  subtitle?: string;
  className?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<MaterialPreviewPayload | null>(null);
  const [openingCore, setOpeningCore] = useState(false);
  const [openingPreview, setOpeningPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openPreference, setOpenPreference] = useState<MaterialOpenMode>("popup");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setOpenPreference(getMaterialOpenPreference());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (menuRootRef.current?.contains(target)) return;
      if (target.closest?.("[data-material-actions-menu]")) return;
      setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function handleOpenInCore() {
    setOpeningCore(true);
    try {
      setMaterialOpenPreference("core");
      setOpenPreference("core");
      setPreview(null);
      router.push(
        coreCourseHref({
          courseId,
          materialId,
          import: true,
        }),
      );
    } finally {
      setOpeningCore(false);
    }
  }

  async function handleOpenPreview() {
    setOpeningPreview(true);
    try {
      setMaterialOpenPreference("popup");
      setOpenPreference("popup");
      const material = await openMaterialPreview(materialId);
      setPreview(material);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not open preview.");
    } finally {
      setOpeningPreview(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${title}"? Notes linked to this material stay, but the file and extracted text will be removed.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Could not delete this material.");
      }
      onDeleted?.();
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete material.");
    } finally {
      setDeleting(false);
    }
  }

  async function handlePrimaryOpen() {
    if (openPreference === "core") {
      handleOpenInCore();
    } else {
      await handleOpenPreview();
    }
  }

  const busy = openingCore || openingPreview || deleting;
  const flashcardsHref = `/flashcards?${new URLSearchParams({
    courseId,
    materialId,
    topic: title,
  }).toString()}`;
  const teachMeFromMaterial = withLearningFocus(
    teachMeHref(courseId, materialId, title),
    "teach",
  );
  const tutorMeFromMaterial = withLearningFocus(
    teachMeHref(courseId, materialId, title),
    "tutor",
  );
  const practiceFromMaterial = withLearningFocus(
    `/study/six/hands-on-practice?courseId=${encodeURIComponent(courseId)}&materialId=${encodeURIComponent(materialId)}&topic=${encodeURIComponent(title)}`,
    "practice",
  );
  const codingItem = listSupportedPracticeLandscape().find(
    (item) => item.activityKey === "coding",
  );
  const codingPracticeHref = codingItem
    ? buildPracticeItemHref(codingItem, {
        courseId,
        topic: title,
        materialId,
      })
    : `/study/activities/coding?courseId=${encodeURIComponent(courseId)}&materialId=${encodeURIComponent(materialId)}&topic=${encodeURIComponent(title)}`;
  const studyHaulFromMaterial = studyHaulHref(courseId, title);
  const studyGuideFromMaterial = coreStudyGuideHref({
    courseId,
    topic: title,
    materialId,
  });

  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen || !actionsButtonRef.current) {
      setMenuCoords(null);
      return;
    }
    function place() {
      const rect = actionsButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuCoords({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [menuOpen]);

  return (
    <>
      <div
        data-hub-chrome
        className={`relative flex min-w-0 items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 transition hover:border-orange-200 hover:bg-orange-50/50 touch-manipulation ${
          menuOpen ? "z-[40]" : "z-0"
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => void handlePrimaryOpen()}
          disabled={busy}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block truncate text-sm font-medium text-stone-900">{title}</span>
          <span className="block truncate text-[11px] text-stone-500">
            {subtitle ? `${subtitle} · ` : ""}
            {type.replaceAll("_", " ")}
          </span>
        </button>

        <div ref={menuRootRef} className="relative shrink-0">
          <button
            ref={actionsButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Actions for ${title}`}
            onClick={() => setMenuOpen((value) => !value)}
            disabled={busy}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60 touch-manipulation"
          >
            Actions
            <ChevronDown className={`h-3.5 w-3.5 transition ${menuOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {menuOpen && menuCoords && typeof document !== "undefined"
        ? createPortal(
            <div
              role="menu"
              data-material-actions-menu
              className="fixed z-[480] w-56 overflow-hidden rounded-2xl border border-orange-100 bg-white py-1 shadow-xl"
              style={{ top: menuCoords.top, right: menuCoords.right }}
            >
              <MenuAction
                icon={PanelTopOpen}
                label="Open / View"
                onClick={() => {
                  setMenuOpen(false);
                  void handleOpenPreview();
                }}
              />
              <MenuLink
                icon={Sparkles}
                label="Open Study Haul"
                href={studyHaulFromMaterial}
                onNavigate={() => setMenuOpen(false)}
              />
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Learn
              </p>
              <MenuLink
                icon={BookOpen}
                label="Teach Me"
                href={teachMeFromMaterial}
                onNavigate={() => setMenuOpen(false)}
              />
              <MenuLink
                icon={MessageCircle}
                label="Tutor Me"
                href={tutorMeFromMaterial}
                onNavigate={() => setMenuOpen(false)}
              />
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Practice
              </p>
              <MenuLink
                icon={Dumbbell}
                label="Practice"
                href={practiceFromMaterial}
                onNavigate={() => setMenuOpen(false)}
              />
              <MenuLink
                icon={Dumbbell}
                label="Coding practice"
                href={codingPracticeHref}
                onNavigate={() => setMenuOpen(false)}
              />
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Check
              </p>
              <MenuLink
                icon={Zap}
                label="Quiz"
                href={luckyQuizHref(courseId, materialId, title)}
                onNavigate={() => setMenuOpen(false)}
              />
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Study
              </p>
              <MenuAction
                icon={NotebookPen}
                label="Open Workspace"
                onClick={() => {
                  setMenuOpen(false);
                  handleOpenInCore();
                }}
              />
              <MenuLink
                icon={NotebookPen}
                label="Study pack"
                href={coreStudyPackHref(courseId, title)}
                onNavigate={() => setMenuOpen(false)}
              />
              <MenuLink
                icon={BookOpen}
                label="Study Guide"
                href={studyGuideFromMaterial}
                onNavigate={() => setMenuOpen(false)}
              />
              <MenuLink
                icon={Sparkles}
                label="Break it down"
                href={sixChunkingHref(courseId, title, materialId)}
                onNavigate={() => setMenuOpen(false)}
              />
              <MenuLink
                icon={Layers}
                label="Flashcards"
                href={flashcardsHref}
                onNavigate={() => setMenuOpen(false)}
              />
              <MenuLink
                icon={ClipboardList}
                label="Blurt"
                href={blurtingHref(courseId, materialId, title)}
                onNavigate={() => setMenuOpen(false)}
              />
              <div className="my-1 border-t border-orange-100" />
              <MenuAction
                icon={Trash2}
                label="Delete"
                destructive
                onClick={() => {
                  setMenuOpen(false);
                  void handleDelete();
                }}
              />
            </div>,
            document.body,
          )
        : null}

      {preview ? (
        <MaterialPreviewModal
          material={preview}
          openingCore={openingCore}
          onClose={() => setPreview(null)}
          onOpenInCore={() => handleOpenInCore()}
        />
      ) : null}
    </>
  );
}

function MenuLink({
  icon: Icon,
  label,
  href,
  onNavigate,
}: {
  icon: typeof PanelTopOpen;
  label: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      data-hub-chrome
      onClick={onNavigate}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-orange-50 touch-manipulation"
    >
      <Icon className="h-4 w-4 shrink-0 text-stone-400" />
      {label}
    </Link>
  );
}

function MenuAction({
  icon: Icon,
  label,
  destructive = false,
  onClick,
}: {
  icon: typeof PanelTopOpen;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium touch-manipulation ${
        destructive
          ? "text-rose-600 hover:bg-rose-50"
          : "text-stone-700 hover:bg-orange-50"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${destructive ? "text-rose-400" : "text-stone-400"}`} />
      {label}
    </button>
  );
}
