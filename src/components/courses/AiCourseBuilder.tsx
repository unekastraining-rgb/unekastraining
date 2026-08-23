"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { PlanPhaseView } from "@/components/grade-school/PlanPhaseView";
import { readJsonResponse } from "@/lib/api-json";
import { domainEmoji, parseSubjectsInput } from "@/lib/grade-school/plan-utils";
import type { GeneratedCurriculum } from "@/lib/syllabus/types";

const GRADE_OPTIONS = [
  "Kindergarten",
  "1st grade",
  "2nd grade",
  "3rd grade",
  "4th grade",
  "5th grade",
  "6th grade",
  "7th grade",
  "8th grade",
  "9th grade",
  "10th grade",
  "11th grade",
  "12th grade",
  "College",
];

const STRUGGLE_PLACEHOLDER = `No syllabus needed — describe the learner. Paste eval notes, teacher feedback, or your observations:

• What subjects matter right now?
• What skills are hard? (decoding, comprehension, math facts, writing, etc.)
• Any foundational challenges? (phonological awareness, rapid naming, visual-motor)`;

export function AiCourseBuilder({
  onSaved,
  onError,
}: {
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("6th grade");
  const [subjects, setSubjects] = useState("Reading, Math, Science");
  const [strengths, setStrengths] = useState("");
  const [strugglingWith, setStrugglingWith] = useState("");
  const [goals, setGoals] = useState("");
  const [focusTopic, setFocusTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [curriculum, setCurriculum] = useState<GeneratedCurriculum | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const subjectList = useMemo(() => parseSubjectsInput(subjects), [subjects]);

  function reportError(message: string) {
    setErrorMessage(message);
    onError(message);
  }

  async function handleGenerate() {
    setGenerating(true);
    setErrorMessage("");
    onError("");
    setCurriculum(null);

    try {
      const response = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeLevel,
          subject: subjectList.join(", "),
          subjects: subjectList,
          studentName: studentName.trim() || null,
          strengths: strengths.trim() || null,
          strugglingWith: strugglingWith.trim() || null,
          goals: goals.trim() || null,
          focusTopic: focusTopic.trim() || null,
        }),
      });

      const data = await readJsonResponse<{
        success?: boolean;
        curriculum?: GeneratedCurriculum;
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate curriculum.");
      }

      if (!data.curriculum?.learningSteps?.length) {
        throw new Error("The plan came back empty. Add learner details and try again.");
      }

      setCurriculum(data.curriculum);
    } catch (error) {
      reportError(error instanceof Error ? error.message : "Failed to generate.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!curriculum) return;

    setSaving(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/courses/save-generated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curriculum }),
      });

      const data = await readJsonResponse<{ course?: unknown; error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save course.");
      }

      setCurriculum(null);
      setStrengths("");
      setStrugglingWith("");
      setGoals("");
      setFocusTopic("");
      onSaved();
    } catch (error) {
      reportError(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-100 p-2.5 text-teal-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">Learner profile → growth plan</h2>
            <p className="text-sm text-stone-600">
              No syllabus required. Describe the child — grade, subjects, struggles, strengths —
              and we&apos;ll scope a multi-week plan with skill tracks and guided activities.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-semibold text-stone-700">Learner name (optional)</span>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="First name"
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-stone-800"
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-semibold text-stone-700">Grade level</span>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-stone-800"
            >
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm sm:col-span-2">
            <span className="font-semibold text-stone-700">Subjects in scope</span>
            <input
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder="Reading, Math, Science"
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-stone-800"
            />
          </label>

          <label className="space-y-1.5 text-sm sm:col-span-2">
            <span className="font-semibold text-stone-700">Strengths (optional)</span>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={2}
              placeholder="What does this learner do well? What motivates them?"
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm text-stone-800"
            />
          </label>

          <label className="space-y-1.5 text-sm sm:col-span-2">
            <span className="font-semibold text-stone-700">
              Struggles &amp; learner profile <span className="text-rose-600">*</span>
            </span>
            <textarea
              value={strugglingWith}
              onChange={(e) => setStrugglingWith(e.target.value)}
              placeholder={STRUGGLE_PLACEHOLDER}
              rows={8}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-stone-800"
            />
          </label>

          <label className="space-y-1.5 text-sm sm:col-span-2">
            <span className="font-semibold text-stone-700">Goals (optional)</span>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={2}
              placeholder="What would success look like in 4–6 weeks?"
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm text-stone-800"
            />
          </label>

          <label className="space-y-1.5 text-sm sm:col-span-2">
            <span className="font-semibold text-stone-700">Current unit / focus (optional)</span>
            <input
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              placeholder="e.g. minerals, chapter books, multiplication tables"
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-stone-800"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={generating || subjectList.length === 0 || !strugglingWith.trim()}
          className="mt-5 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-200 transition hover:bg-teal-500 disabled:opacity-60"
        >
          {generating ? "Scoping growth plan…" : "Generate growth plan"}
        </button>

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {errorMessage}
          </p>
        ) : null}
      </div>

      {curriculum ? (
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-stone-900">{curriculum.courseName}</h3>
          {curriculum.learnerSummary ? (
            <p className="mt-2 text-sm font-medium text-teal-800">{curriculum.learnerSummary}</p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{curriculum.summary}</p>

          {curriculum.skillTracks && curriculum.skillTracks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {curriculum.skillTracks.map((track) => (
                <span
                  key={track.name}
                  className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800"
                  title={track.description}
                >
                  {domainEmoji(track.domain)} {track.name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-orange-600">
              Multi-week plan ({curriculum.learningSteps.length} activities)
            </h4>
            <div className="mt-4">
              <PlanPhaseView courseId="preview" curriculum={curriculum} preview />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save growth plan"}
            </button>
            <button
              type="button"
              onClick={() => setCurriculum(null)}
              className="rounded-xl border border-orange-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-orange-50"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
