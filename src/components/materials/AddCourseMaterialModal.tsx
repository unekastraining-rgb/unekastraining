"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Cloud,
  FileUp,
  GraduationCap,
  Link2,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import { MATERIAL_TYPE_OPTIONS } from "@/lib/materials/types";
import { coreStudyPackHref } from "@/lib/study/loop-hrefs";
import type { MaterialType } from "@/generated/prisma";

export type AddMaterialSource = "file" | "paste" | "cloud" | "bookstore" | "lms";

export interface AddedCourseMaterial {
  id: string;
  title: string;
  type: string;
  courseId: string;
  courseTitle?: string;
  filePath?: string | null;
  extractedText?: string | null;
  url?: string | null;
  /** Syllabus/OCR cold start may seed course topics */
  topicsCreated?: number;
  ocr?: boolean;
}

interface CourseOption {
  id: string;
  title: string;
}

const SOURCES: Array<{
  id: AddMaterialSource;
  label: string;
  icon: typeof FileUp;
  hint: string;
}> = [
  { id: "file", label: "Files / photo", icon: FileUp, hint: "PDF, Word, slides, or syllabus photo (OCR → topics for Lucky cold start)" },
  { id: "paste", label: "Paste", icon: BookOpen, hint: "Paste chapter or notes text" },
  { id: "cloud", label: "Cloud", icon: Cloud, hint: "Drive / OneDrive link or download" },
  { id: "bookstore", label: "Bookstore", icon: GraduationCap, hint: "Textbook link or title" },
  { id: "lms", label: "LMS", icon: Link2, hint: "Moodle sync — pulls structure/topics without paste" },
];

export function AddCourseMaterialButton({
  courseId,
  courses,
  label = "Add course material",
  compact = false,
  className = "",
  defaultOpen = false,
  onAdded,
}: {
  /** Pre-select a course when opened from a course page / Core. */
  courseId?: string | null;
  /** Optional course list; loaded from API when omitted. */
  courses?: CourseOption[];
  label?: string;
  compact?: boolean;
  className?: string;
  /** Open the modal on mount (e.g. ?upload=1 from Study → Photo syllabus). */
  defaultOpen?: boolean;
  onAdded?: (material: AddedCourseMaterial) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          (compact
            ? "inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-orange-50"
            : "inline-flex items-center gap-2 rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800")
        }
      >
        <Plus className="h-3.5 w-3.5" />
        {label}
      </button>
      {open ? (
        <AddCourseMaterialModal
          initialCourseId={courseId ?? null}
          courses={courses}
          onClose={() => setOpen(false)}
          onAdded={(material) => {
            onAdded?.(material);
            // Modal closes itself after cold-start success message.
          }}
        />
      ) : null}
    </>
  );
}

export function AddCourseMaterialModal({
  initialCourseId,
  courses: coursesProp,
  onClose,
  onAdded,
}: {
  initialCourseId?: string | null;
  courses?: CourseOption[];
  onClose: () => void;
  onAdded?: (material: AddedCourseMaterial) => void;
}) {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseOption[]>(coursesProp ?? []);
  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  const [source, setSource] = useState<AddMaterialSource>("file");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MaterialType | "">("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [lmsSyncing, setLmsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    if (coursesProp?.length) {
      setCourses(coursesProp);
      return;
    }
    const res = await fetch("/api/courses");
    const data = await res.json();
    if (data.success && Array.isArray(data.courses)) {
      setCourses(
        data.courses.map((course: { id: string; title: string }) => ({
          id: course.id,
          title: course.title,
        })),
      );
    }
  }, [coursesProp]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    if (initialCourseId) setCourseId(initialCourseId);
  }, [initialCourseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    if (!courseId && courses[0]?.id) setCourseId(courses[0].id);
  }, [courseId, courses]);

  async function syncMoodle() {
    setLmsSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const { syncMoodleFromBrowser } = await import("@/lib/lms/moodle-browser-sync");
      const credResponse = await fetch("/api/lms/moodle/credentials");
      const credData = await credResponse.json();
      if (!credData.success) {
        setError(credData.error ?? "Connect Moodle under Settings first.");
        return;
      }
      const result = await syncMoodleFromBrowser(credData.baseUrl, credData.accessToken);
      setMessage(
        result?.message ??
          "Moodle sync finished. Syllabus materials refresh across Locker, Course, Study, and Core.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Moodle sync failed. Connect Moodle under Settings, or paste a resource URL below.",
      );
    } finally {
      setLmsSyncing(false);
    }
  }

  async function submit() {
    if (!courseId) {
      setError("Pick a course first.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      let response: Response;

      if (source === "file") {
        if (!file) throw new Error("Choose a file to upload.");
        const form = new FormData();
        form.append("courseId", courseId);
        form.append("source", "file");
        form.append("file", file);
        if (title.trim()) form.append("title", title.trim());
        if (type) form.append("type", type);
        response = await fetch("/api/materials", { method: "POST", body: form });
      } else {
        const body: Record<string, string> = {
          courseId,
          source,
          title: title.trim(),
        };
        if (type) body.type = type;
        if (text.trim()) body.text = text.trim();
        if (url.trim()) body.url = url.trim();

        if (source === "paste" && !text.trim()) {
          throw new Error("Paste the chapter or reading text.");
        }
        if ((source === "cloud" || source === "bookstore" || source === "lms") && !url.trim() && !text.trim()) {
          throw new Error("Add a link and/or paste the reading text.");
        }

        response = await fetch("/api/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Could not add material.");
      }

      const material = data.material as AddedCourseMaterial;
      const seeded = Number(material.topicsCreated ?? 0);
      if (seeded > 0) {
        setMessage(
          material.ocr
            ? `Saved · OCR seeded ${seeded} topic${seeded === 1 ? "" : "s"} — you can Lucky quiz without pasting a chapter.`
            : `Saved · pulled ${seeded} topic${seeded === 1 ? "" : "s"} from syllabus for cold-start quizzes.`,
        );
      } else if (material.ocr) {
        setMessage("Saved · photo text extracted. Add a syllabus photo or topics for richer Lucky quizzes.");
      } else {
        setMessage("Saved to this course.");
      }
      onAdded?.(material);
      if (seeded > 0) {
        const href = new URL(
          coreStudyPackHref(courseId, material.title?.trim() || undefined),
          "http://local",
        );
        if (material.id) href.searchParams.set("materialId", material.id);
        onClose();
        router.push(`${href.pathname}${href.search}`);
        return;
      }
      window.setTimeout(() => onClose(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add material.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-stone-900/40 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal
        aria-label="Add course material"
        className="max-h-[min(92vh,40rem)] w-full max-w-lg overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-stone-900">Add course material</p>
            <p className="text-[10px] text-stone-500">
              Saves once — shows in Locker, Course, Study, and Core.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Course
            </span>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            >
              {courses.length === 0 ? <option value="">No courses yet</option> : null}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((item) => {
              const Icon = item.icon;
              const active = source === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSource(item.id)}
                  data-hub-chrome
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold touch-manipulation ${
                    active
                      ? "bg-stone-900 text-white"
                      : "bg-orange-50 text-stone-600 hover:bg-orange-100"
                  }`}
                  title={item.hint}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-stone-500">
            {SOURCES.find((item) => item.id === source)?.hint}
          </p>

          {source === "file" ? (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 px-4 py-6 touch-manipulation hover:border-orange-300">
              <FileUp className="h-7 w-7 text-orange-500" />
              <span className="text-sm font-semibold text-stone-800">
                {file ? file.name : "Choose file"}
              </span>
              <span className="text-[10px] text-stone-500">
                PDF, DOCX, or tap to take a syllabus photo (OCR)
              </span>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
            </label>
          ) : null}

          {source === "paste" ? (
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={8}
              placeholder="Paste chapter text, lecture notes, or reading excerpt…"
              className="w-full rounded-2xl border border-stone-200 px-3 py-2 text-sm leading-relaxed"
            />
          ) : null}

          {source === "cloud" ? (
            <div className="space-y-2">
              <p className="rounded-xl bg-sky-50 px-3 py-2 text-[10px] text-sky-900">
                Download from Google Drive / OneDrive / Dropbox, then use <strong>Files</strong>,
                or paste a shareable link below (we store the link + optional pasted text).
              </p>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://drive.google.com/…"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                placeholder="Optional: paste text if the link is view-only"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
            </div>
          ) : null}

          {source === "bookstore" ? (
            <div className="space-y-2">
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-[10px] text-amber-900">
                Add your textbook or chapter as a study source (title + optional bookstore /
                publisher link). Then use Chapter study pull in Core.
              </p>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Bookstore or publisher URL (optional)"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                placeholder="Optional: paste chapter excerpt or table of contents"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
            </div>
          ) : null}

          {source === "lms" ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={lmsSyncing}
                onClick={() => void syncMoodle()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-900 disabled:opacity-60"
              >
                {lmsSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Sync syllabus from Moodle
              </button>
              <p className="text-[10px] text-stone-500">
                Or paste a Moodle/Canvas resource URL and optional page text:
              </p>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://moodle…/mod/resource/…"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                placeholder="Optional: paste the LMS page text"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Chapter 1 — Intro…"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Type
              </span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as MaterialType | "")}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              >
                <option value="">Auto-detect</option>
                {MATERIAL_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {message ? <p className="text-[10px] font-medium text-teal-700">{message}</p> : null}
          {error ? <p className="text-[10px] font-medium text-rose-600">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-orange-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !courseId}
            data-hub-chrome
            onClick={() => void submit()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 touch-manipulation"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add to course
          </button>
        </div>
      </div>
    </div>
  );
}
