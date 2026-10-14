"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { ConceptEntryPicker } from "@/components/study/ConceptEntryPicker";
import {
  buildInteractivePracticeHref,
  listInteractiveChooserOptions,
} from "@/lib/study/interactive-chooser";
import "@/lib/learning/knowledge/packs";

/**
 * Bundle K — Choose how you want to practice (KL-backed forms only).
 */
export function InteractiveChooserView({
  klConceptId,
  courseId,
  topic,
}: {
  klConceptId: string | null;
  courseId: string | null;
  topic: string | null;
}) {
  const [conceptId, setConceptId] = useState(klConceptId ?? "");

  const options = useMemo(
    () => (conceptId ? listInteractiveChooserOptions(conceptId) : []),
    [conceptId],
  );

  if (!conceptId) {
    return (
      <ConceptEntryPicker
        activityKind="interactive"
        activityLabel="Practice"
        continueHrefBase="/study/choose"
      />
    );
  }

  // When returning from ensure-concept, URL has DB conceptId — chooser needs KL id.
  // If options empty, still offer landscape practice hub.
  return (
    <div
      className="grid min-h-[70vh] gap-0 lg:grid-cols-[minmax(0,16rem)_1fr]"
      data-interactive-chooser
    >
      <aside className="border-b border-stone-200 bg-stone-50/80 px-4 py-6 lg:border-b-0 lg:border-r">
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
          Practice
        </p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">
          Choose how you want to practice
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Only activities supported for this topic are shown.
        </p>
        <button
          type="button"
          onClick={() => setConceptId("")}
          className="mt-4 min-h-11 text-sm font-semibold text-teal-800 underline touch-manipulation"
        >
          Change topic
        </button>
      </aside>
      <main className="px-4 py-6 sm:px-6">
        {options.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">
              No quick checks for this topic yet. Open the full practice menu instead.
            </p>
            <Link
              href={`/study/practice-hub?conceptId=${encodeURIComponent(conceptId)}${
                courseId ? `&courseId=${encodeURIComponent(courseId)}` : ""
              }${topic ? `&topic=${encodeURIComponent(topic)}` : ""}`}
              className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white touch-manipulation"
            >
              Open Practice
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {options.map((opt) => (
              <li key={opt.form}>
                <Link
                  href={buildInteractivePracticeHref({
                    conceptId,
                    form: opt.form,
                    courseId,
                    topic,
                  })}
                  data-interactive-form={opt.form}
                  className="flex min-h-[7rem] flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-sm touch-manipulation hover:border-teal-300"
                >
                  <div>
                    <p className="font-semibold text-stone-900">{opt.label}</p>
                    <p className="mt-1 text-sm text-stone-600">{opt.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
