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

import { DemoColdStartImport } from "@/components/hub/DemoColdStartImport";
import { readJsonResponse } from "@/lib/api-json";
import { hubTabPath } from "@/lib/hub/tabs";
import { withLearningFocus } from "@/lib/study/learning-focus";
import { coreStudyPackHref } from "@/lib/study/loop-hrefs";
import { useTapHandler } from "@/hooks/useTapHandler";

type StudyThisMode = "topic" | "syllabus" | "class";

export function StudyThisCard({
  compact = false,
  /** Land on Study Haul HOW screen after creating a topic (learning-center journey). */
  landOnHaul = false,
}: {
  compact?: boolean;
  landOnHaul?: boolean;
}) {
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
        learningTarget?: string;
        course?: {
          id: string;
          topics?: Array<{ name: string }>;
        };
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

      const learningTarget =
        (typeof data.learningTarget === "string" &&
          data.learningTarget.trim()) ||
        trimmed;
      const params = new URLSearchParams({
        courseId: data.course.id,
        topic: learningTarget,
      });
      if (data.materialId) params.set("materialId", data.materialId);

      if (landOnHaul) {
        // Learning-center IA: establish WHAT, then learner chooses HOW.
        router.push(`/study?${params.toString()}`);
      } else {
        // Direct teach-first entry (Locker / deep links).
        router.push(
          withLearningFocus(`/study/teach-me?${params.toString()}`, "teach"),
        );
      }
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
        coreStudyPackHref(data.course.id, trimmed),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create class.");
    } finally {
      setLoading(false);
    }
  }

  const tapTopicSubmit = useTapHandler(() => void handleTopicSubmit());
  const tapClassSubmit = useTapHandler(() => void handleClassSubmit());

  const modes: { id: StudyThisMode; label: string; icon: typeof Sparkles }[] = [
    { id: "topic", label: "Any topic", icon: Sparkles },
    { id: "syllabus", label: "Syllabus", icon: ScanLine },
    { id: "class", label: "New class", icon: GraduationCap },
  ];

  return (
    <section
      data-hub-chrome
      className={`card-soft relative overflow-hidden ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex items-start gap-3">
        <div className="theme-icon-tile-warm !p-2.5">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-heading text-lg font-bold">
            Study this
          </h2>
          <p className="text-body mt-1 text-sm">
            Learn something new — type a subject and start. No LMS required.
            We&apos;ll open a Study Haul for that subject so you can learn, practice, quiz, or review.
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
            {...tapTopicSubmit}
            className="btn-primary sm:col-span-2 inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 text-sm shadow-md disabled:opacity-60 touch-manipulation"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Setting up…" : "Study this → Core pack + loop"}
          </button>
        </div>
      ) : null}

      {mode === "syllabus" ? (
        <div className="surface-muted mt-4 rounded-2xl p-4 text-sm">
          <p className="text-heading font-semibold">Cold start from a syllabus</p>
          <p className="text-body mt-1">
            Photo a syllabus page (OCR → topics), upload a PDF, or sync Canvas — then Study from
            topics / Blurt in Core without pasting a chapter.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/courses"
              className="btn-accent inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm shadow-md touch-manipulation"
            >
              <Upload className="h-4 w-4" />
              Scan / upload syllabus
            </Link>
            <Link
              href={hubTabPath("settings")}
              className="inline-flex items-center gap-2 rounded-full border border-brand px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white"
            >
              Sync Canvas / LMS
            </Link>
          </div>
          <DemoColdStartImport compact className="mt-4" />
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
            {...tapClassSubmit}
            className="btn-primary sm:col-span-2 inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 text-sm shadow-md disabled:opacity-60 touch-manipulation"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
            {loading ? "Creating…" : "Create class → Core study pack"}
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
