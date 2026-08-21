"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  ScanLine,
  Sparkles,
  Upload,
} from "lucide-react";

import { readJsonResponse } from "@/lib/api-json";
import { coreCourseHref, launchStudyNowSession } from "@/lib/study/client-launch";

type StudyThisMode = "topic" | "syllabus" | "class";

export function StudyThisCard({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<StudyThisMode>("topic");
  const [title, setTitle] = useState("");
  const [focus, setFocus] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopicSubmit() {
    const trimmed = title.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/courses/study-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          focus: focus.trim() || null,
          subject: subject.trim() || null,
          createNote: true,
        }),
      });

      const data = await readJsonResponse<{
        success?: boolean;
        course?: { id: string };
        materialId?: string;
        noteId?: string;
        error?: string;
      }>(response);

      if (!response.ok || !data.course?.id) {
        throw new Error(data.error ?? "Could not start this topic.");
      }

      setTitle("");
      setFocus("");
      setSubject("");

      router.push(
        coreCourseHref({
          courseId: data.course.id,
          materialId: data.materialId,
          noteId: data.noteId,
          autoSession: true,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start this topic.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClassSubmit() {
    const trimmed = className.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          code: classCode.trim() || null,
        }),
      });

      const data = await readJsonResponse<{
        success?: boolean;
        course?: { id: string; materials?: Array<{ id: string }> };
        noteId?: string;
        error?: string;
      }>(response);

      if (!response.ok || !data.course?.id) {
        throw new Error(data.error ?? "Could not create class.");
      }

      setClassName("");
      setClassCode("");

      router.push(
        coreCourseHref({
          courseId: data.course.id,
          noteId: data.noteId,
          autoSession: true,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create class.");
    } finally {
      setLoading(false);
    }
  }

  const modes: { id: StudyThisMode; label: string; icon: typeof Sparkles }[] = [
    { id: "topic", label: "Any topic", icon: Sparkles },
    { id: "syllabus", label: "Syllabus", icon: ScanLine },
    { id: "class", label: "New class", icon: GraduationCap },
  ];

  return (
    <section className={`card-soft relative overflow-hidden ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <div className="theme-icon-tile-warm !p-2.5">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-heading text-lg font-bold">
            Study this
          </h2>
          <p className="text-body mt-1 text-sm">
            One entry point — syllabus, new class, or anything you want to learn.
            We&apos;ll set up your notebook in Core and suggest a first session.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              mode === item.id ? "chip-active" : "chip"
            }`}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {mode === "topic" ? (
        <div className={`mt-4 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
          <label className="block text-sm sm:col-span-2">
            <span className="text-heading font-semibold">
              What do you want to study?
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Stocks, Ohm's law, Chapter 7 mitosis…"
              className="input-brand mt-1.5 w-full px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-heading font-semibold">
              Subject (optional)
            </span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Finance, Physics…"
              className="input-brand mt-1.5 w-full px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-heading font-semibold">
              Goal (optional)
            </span>
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="What should click?"
              className="input-brand mt-1.5 w-full px-3 py-2.5 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={!title.trim() || loading}
            onClick={() => void handleTopicSubmit()}
            className="btn-primary sm:col-span-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm shadow-md disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Setting up…" : "Study this → Core + first session"}
          </button>
        </div>
      ) : null}

      {mode === "syllabus" ? (
        <div className="surface-muted mt-4 rounded-2xl p-4 text-sm">
          <p className="text-heading font-semibold">
            Upload a syllabus
          </p>
          <p className="text-body mt-1">
            We&apos;ll parse due dates, meetings, and materials — then open Core with
            your class notebook.
          </p>
          <Link
            href="/courses"
            className="btn-accent mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm shadow-md"
          >
            <Upload className="h-4 w-4" />
            Scan syllabus
          </Link>
        </div>
      ) : null}

      {mode === "class" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-heading font-semibold">
              Class name
            </span>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Intro to Psychology"
              className="input-brand mt-1.5 w-full px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-heading font-semibold">
              Course code (optional)
            </span>
            <input
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="PSY 101"
              className="input-brand mt-1.5 w-full px-3 py-2.5 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={!className.trim() || loading}
            onClick={() => void handleClassSubmit()}
            className="btn-primary sm:col-span-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm shadow-md disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
            {loading ? "Creating…" : "Create class → Core + first session"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
    </section>
  );
}
