"use client";

import { useState } from "react";

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
  const [courses, setCourses] = useState<CourseSummary[]>(initialCourses);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<SyllabusIngestResult | null>(null);
  const [draft, setDraft] = useState<SyllabusExtraction | null>(null);
  const [extractedText, setExtractedText] = useState("");

  async function refreshCourses() {
    setError(null);

    try {
      const response = await fetch("/api/courses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load courses.");
      }

      setCourses(data.courses);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process syllabus.");
    } finally {
      setUploading(false);
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

      setPreview(null);
      setDraft(null);
      setExtractedText("");
      await refreshCourses();
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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-500">
          CSL Academic Ecosystem
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Course Management</h1>
        <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Upload a syllabus to extract course details, assignments, and due dates
          with AI before saving to your workspace.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className={`rounded-2xl border border-dashed p-8 transition ${
            dragActive
              ? "border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/20"
              : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
          }`}
        >
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-indigo-100 p-4 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
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
                PDF, DOCX, or image files supported
              </p>
            </div>
            <label className="cursor-pointer rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500">
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

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Ingestion preview</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Review extracted data before confirming and saving.
          </p>

          {!draft ? (
            <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Upload a syllabus to see the AI extraction preview here.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
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
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
                  className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Confirm & save course"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setDraft(null);
                    setExtractedText("");
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
                  style={{ backgroundColor: course.color ?? "#6366f1" }}
                />
                <h3 className="text-lg font-medium">{course.title}</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {[course.code, course.instructor, course.semester]
                    .filter(Boolean)
                    .join(" · ") || "No metadata"}
                </p>
                <div className="mt-4 flex gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                  <span>{course._count.assignments} assignments</span>
                  <span>{course._count.materials} materials</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
