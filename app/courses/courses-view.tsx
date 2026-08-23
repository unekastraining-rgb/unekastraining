"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { confirmDelete } from "@/lib/confirm-delete";
import { coreCourseHref } from "@/lib/study/client-launch";

import { AiCourseBuilder } from "@/components/courses/AiCourseBuilder";
import { GradeSchoolGate } from "@/components/grade-school/GradeSchoolGate";
import { coursePath } from "@/lib/courses";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type {
  SyllabusExtraction,
  SyllabusIngestResult,
} from "@/lib/syllabus/types";

interface CourseSummary {
  id: string;
  title: string;
  code: string | null;
  instructor: string | null;
  semester: string | null;
  color: string | null;
  createdAt: Date | string;
  _count: {
    assignments: number;
    materials: number;
  };
}

interface CoursesViewProps {
  initialCourses: CourseSummary[];
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CoursesView({ initialCourses }: CoursesViewProps) {
  const router = useRouter();
  const { settings } = useTheme();
  const gradeSchoolMode = settings.elementaryMode;
  const [courses, setCourses] = useState<CourseSummary[]>(initialCourses);
  const [addMode, setAddMode] = useState<"upload" | "ai">(
    gradeSchoolMode ? "ai" : "upload",
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<SyllabusIngestResult | null>(null);
  const [draft, setDraft] = useState<SyllabusExtraction | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [parserMode, setParserMode] = useState<SyllabusIngestResult["parser"] | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);

  const visibleMode = gradeSchoolMode ? addMode : "upload";

  async function deleteCourse(courseId: string, title: string) {
    if (!confirmDelete(`${title} and all related assignments and schedule`)) {
      return;
    }

    setError(null);
    try {
      const response = await fetch("/api/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: courseId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to delete course.");
      }
      await refreshCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course.");
    }
  }

  async function refreshCourses() {
    setError(null);

    try {
      const response = await fetch("/api/courses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load courses.");
      }

      setCourses(data.courses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses.");
    }
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    setPreview(null);
    setDraft(null);
    setExtractedText("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/courses/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to process syllabus.");
      }

      const result = data as SyllabusIngestResult;
      setPreview(result);
      setDraft(result.extraction);
      setExtractedText(result.extractedText);
      setParserMode(result.parser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process syllabus.");
    } finally {
      setUploading(false);
    }
  }

  async function createBlankClass() {
    const title = manualTitle.trim();
    if (!title) return;

    setCreatingClass(true);
    setError(null);
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to create class.");
      }
      setManualTitle("");
      await refreshCourses();
      if (data.course?.id) {
        router.push(coursePath(data.course.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class.");
    } finally {
      setCreatingClass(false);
    }
  }

  async function handleSave() {
    if (!preview || !draft) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/courses/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: preview.uploadId,
          fileName: preview.fileName,
          extractedText,
          extraction: draft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save course.");
      }

      const savedCourse = data.course as { id: string; materials?: Array<{ id: string }> };
      const materialId = savedCourse.materials?.[0]?.id;

      setPreview(null);
      setDraft(null);
      setExtractedText("");
      await refreshCourses();

      if (savedCourse.id) {
        router.push(
          coreCourseHref({
            courseId: savedCourse.id,
            materialId,
            autoSession: true,
          }),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course.");
    } finally {
      setSaving(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  }

  return (
    <div className="min-h-screen bg-[#fff8f1] text-stone-800">
      <div className="hub-shell flex w-full flex-1 flex-col gap-8 py-6 lg:py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-500">
          Study Haul
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Course Management</h1>
        <p className="max-w-2xl text-sm text-stone-600">
          {gradeSchoolMode
            ? "Grade school planner is on — build a class from grade & subject, or upload a syllabus."
            : "Upload a syllabus (PDF or DOCX works without AI), create a blank class, or sync OpenLMS/Moodle. AI only assists when you add a key."}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {gradeSchoolMode ? (
          <button
            type="button"
            onClick={() => setAddMode("ai")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              visibleMode === "ai"
                ? "bg-teal-600 text-white"
                : "border border-orange-200 bg-white text-stone-700 hover:bg-orange-50"
            }`}
          >
            Build with AI
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setAddMode("upload")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            visibleMode === "upload"
              ? "bg-orange-500 text-white"
              : "border border-orange-200 bg-white text-stone-700 hover:bg-orange-50"
          }`}
        >
          Upload syllabus
        </button>
        {!gradeSchoolMode ? (
          <Link
            href="/dashboard"
            className="rounded-full border border-teal-200 bg-teal-50 px-5 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
          >
            Turn on grade school planner →
          </Link>
        ) : null}
      </div>

      {visibleMode === "ai" && gradeSchoolMode ? (
        <AiCourseBuilder
          onSaved={() => void refreshCourses()}
          onError={(message) => setError(message || null)}
        />
      ) : null}

      {visibleMode === "ai" && !gradeSchoolMode ? (
        <GradeSchoolGate />
      ) : null}

      {visibleMode === "upload" ? (
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className={`rounded-2xl border border-dashed p-8 transition ${
            dragActive
              ? "border-orange-400 bg-orange-50"
              : "border-orange-200 bg-white"
          }`}
        >
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-orange-100 p-4 text-orange-600">
              <svg
                aria-hidden="true"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 16V4m0 0 8-4-4 4m8 0a8 8 0 11-16 0 8 8 0 0116 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium">Upload syllabus</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                PDF or DOCX — parsed locally; images need AI for OCR
              </p>
            </div>
            <label className="cursor-pointer rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600">
              {uploading ? "Processing..." : "Choose file"}
              <input
                type="file"
                accept=".pdf,.docx,image/*"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleFile(file);
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">Ingestion preview</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Review extracted data before confirming. Edit anything that looks off.
          </p>

          {!draft ? (
            <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
              Upload a syllabus to see the extraction preview here.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {parserMode ? (
                <p className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs text-teal-800">
                  {parserMode === "hybrid"
                    ? "Parsed from your file and refined with AI. Review before saving."
                    : preview?.extractedText
                      ? "Parsed from your syllabus without AI. Review and edit fields below."
                      : "Saved from filename — add details below. PDF/DOCX text extracts automatically."}
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    Course name
                  </span>
                  <input
                    value={draft.courseName}
                    onChange={(event) =>
                      setDraft({ ...draft, courseName: event.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-stone-900"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    Course code
                  </span>
                  <input
                    value={draft.courseCode ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, courseCode: event.target.value || null })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-stone-900"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    Instructor
                  </span>
                  <input
                    value={draft.instructor ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, instructor: event.target.value || null })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-stone-900"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    Semester
                  </span>
                  <input
                    value={draft.semester ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, semester: event.target.value || null })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-stone-900"
                  />
                </label>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Assignments ({draft.assignments.length})
                </h3>
                <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                  {draft.assignments.map((assignment, index) => (
                    <li
                      key={`${assignment.title}-${index}`}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                    >
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-zinc-500 dark:text-zinc-400">
                        Due {formatDate(assignment.dueDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Confirm & save course"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setDraft(null);
                    setExtractedText("");
                    setParserMode(null);
                  }}
                  className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      ) : null}

      {!gradeSchoolMode ? (
        <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">Create blank class</h2>
          <p className="mt-1 text-sm text-stone-500">
            No syllabus? Add a class manually and fill in assignments in the planner.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={manualTitle}
              onChange={(event) => setManualTitle(event.target.value)}
              placeholder="e.g. Calculus II"
              className="min-w-[220px] flex-1 rounded-lg border border-orange-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void createBlankClass()}
              disabled={creatingClass || !manualTitle.trim()}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creatingClass ? "Creating…" : "Create class"}
            </button>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium">Your courses</h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {courses.length} total
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            No courses yet. Upload a syllabus to create your first course.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div
                  className="mb-4 h-1.5 w-12 rounded-full"
                  style={{ backgroundColor: course.color ?? "#ea580c" }}
                />
                <h3 className="text-lg font-medium">
                  <Link href={coursePath(course.id)} className="hover:text-orange-600">
                    {course.title}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {[course.code, course.instructor, course.semester]
                    .filter(Boolean)
                    .join(" · ") || "No metadata"}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex gap-4">
                    <span>{course._count.assignments} assignments</span>
                    <span>{course._count.materials} materials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={coursePath(course.id)}
                      className="rounded-lg border border-orange-200 px-2.5 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-50"
                    >
                      Open
                    </Link>
                    <button
                    type="button"
                    onClick={() => void deleteCourse(course.id, course.title)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
