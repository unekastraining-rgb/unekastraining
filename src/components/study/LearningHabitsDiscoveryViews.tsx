"use client";

import Link from "next/link";
import { useState } from "react";

import {
  buildHypotheses,
  evidenceCharts,
  experienceById,
  journeyStages,
  LEARNING_EXPERIENCES,
  primaryExperiment,
} from "@/lib/learning/habits/discovery";
import type { LearningHabitsDocument } from "@/lib/learning/habits/document";
import type { HabitsAction, Insight } from "@/lib/learning/habits/engine";

export function DiscoverPanel({
  doc,
  busy,
  act,
}: {
  doc: LearningHabitsDocument;
  busy: boolean;
  act: (action: HabitsAction) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>(doc.discovery.selectedIds);
  const [note, setNote] = useState(doc.discovery.note);
  const [hint, setHint] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setHint(null);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (selected.length === 0 && !note.trim()) {
          setHint("Choose at least one experience, or add a short note, so there is something to explore.");
          return;
        }
        void act({ type: "save-discovery", selectedIds: selected, note });
      }}
    >
      <header className="max-w-3xl space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-stone-950 sm:text-5xl">
          Discover How You Learn
        </h1>
        <p className="text-lg leading-relaxed text-stone-600">
          Select what sounds familiar. There are no right or wrong answers. Next you will try a few challenges. Results stay optional.
        </p>
      </header>

      <fieldset>
        <legend className="text-2xl font-bold text-stone-950">
          Which of these sound like you?
        </legend>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LEARNING_EXPERIENCES.map((item) => {
            const on = selected.includes(item.id);
            return (
              <label
                key={item.id}
                className={`flex min-h-16 cursor-pointer gap-4 rounded-3xl p-5 touch-manipulation focus-within:ring-2 focus-within:ring-teal-700 ${
                  on ? "bg-teal-800 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-6 w-6 shrink-0 accent-teal-800"
                  checked={on}
                  onChange={() => toggle(item.id)}
                />
                <span>
                  <span className="block text-lg font-bold leading-snug">{item.title}</span>
                  <span className={`mt-2 block text-base leading-relaxed ${on ? "text-teal-50" : "text-stone-600"}`}>{item.detail}</span>
                  {on ? (
                    <span className="mt-3 inline-block text-sm font-bold uppercase tracking-wide">
                      Selected
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block max-w-3xl">
        <span className="text-lg font-bold text-stone-950">Anything else you&apos;ve noticed?</span>
        <textarea
          className="mt-2 w-full rounded-3xl bg-stone-100 p-4 text-lg text-stone-900 placeholder:text-stone-400"
          rows={3}
          value={note}
          placeholder="For example: I understand the lesson while practicing, but the next day I cannot remember how to solve the problem."
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      {hint ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
          {hint}
        </p>
      ) : null}

      <div className="sticky bottom-4 z-10">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-14 items-center rounded-full bg-stone-950 px-8 text-lg font-bold text-white shadow-lg touch-manipulation hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60"
        >
          Let&apos;s Analyze My Learning Pattern
        </button>
      </div>
    </form>
  );
}

export function ProfilePanel({
  doc,
  busy,
  act,
}: {
  doc: LearningHabitsDocument;
  busy: boolean;
  act: (action: HabitsAction) => Promise<void>;
}) {
  const experiences = doc.discovery.selectedIds
    .map(experienceById)
    .filter((item) => Boolean(item));
  const hypotheses = buildHypotheses(doc);
  const next = primaryExperiment(doc);
  const stages = journeyStages(doc);
  const scored = doc.assessment.results.filter((row) => row.correct !== null).length;

  if (!doc.discovery.analyzedAt && experiences.length === 0 && !doc.discovery.note) {
    return (
      <p className="text-sm text-stone-600">
        Your profile starts after you tell us which experiences sound familiar.{" "}
        <Link href="/study/learning-habits?section=discover" className="font-semibold text-teal-800">
          Discover how you learn
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight text-stone-900">
          Your Preliminary Learning Profile
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Based on what you&apos;ve shared, we&apos;ve identified a few possibilities worth exploring.
          These are starting hypotheses, not final conclusions. We&apos;ll test them through actual
          learning activities and update your profile as we gather evidence.
        </p>
      </header>

      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7" aria-label="Learning journey">
        {stages.map((stage, index) => (
          <li
            key={stage.id}
            className={`rounded-xl border px-2 py-3 text-center text-xs font-bold ${
              stage.state === "done"
                ? "border-teal-700 bg-teal-50 text-teal-950"
                : stage.state === "current"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 text-stone-400"
            }`}
          >
            <span className="block text-[10px] uppercase tracking-wide">
              {index + 1} {stage.state === "done" ? "Done" : stage.state === "current" ? "Now" : "Later"}
            </span>
            {stage.label}
          </li>
        ))}
      </ol>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-bold text-stone-900">Possible preferences</h2>
          <ul className="mt-3 grid gap-2">
            {experiences.filter((item) => item!.kind === "preference").length === 0 ? (
              <li className="text-sm text-stone-500">None selected.</li>
            ) : (
              experiences
                .filter((item) => item!.kind === "preference")
                .map((item) => (
                  <li key={item!.id} className="rounded-xl bg-stone-50 p-3">
                    <p className="text-sm font-semibold text-stone-900">{item!.title}</p>
                    <p className="mt-1 text-sm text-stone-600">{item!.maySuggest}</p>
                  </li>
                ))
            )}
          </ul>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-bold text-stone-900">Potential challenges to investigate</h2>
          <ul className="mt-3 grid gap-2">
            {experiences.filter((item) => item!.kind === "challenge").length === 0 ? (
              <li className="text-sm text-stone-500">None selected. That is fine.</li>
            ) : (
              experiences
                .filter((item) => item!.kind === "challenge")
                .map((item) => (
                  <li key={item!.id} className="rounded-xl bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-stone-900">{item!.title}</p>
                    <p className="mt-1 text-sm text-stone-700">{item!.maySuggest}</p>
                  </li>
                ))
            )}
          </ul>
        </section>
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        {hypotheses.map((item) => (
          <article key={item.id} className="rounded-2xl border border-stone-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-900">{item.label}</p>
            <h2 className="mt-1 font-bold text-stone-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.why}</p>
          </article>
        ))}
        {doc.discovery.note ? (
          <article className="rounded-2xl border border-dashed border-stone-300 p-4">
            <h2 className="font-bold text-stone-900">In your words</h2>
            <p className="mt-2 text-sm text-stone-700">{doc.discovery.note}</p>
          </article>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact title="You reported" body={`${doc.discovery.selectedIds.length} experiences`} />
        <Fact title="Study Haul observed" body={`${scored} scored probes`} />
        <Fact
          title="Still unknown"
          body={scored < 2 ? "Whether any approach actually helps you" : "Whether this holds after a delay and in other subjects"}
        />
        <Fact title="Next test" body={next?.title ?? "Choose an experiment when you are ready"} />
      </section>

      {next ? (
        <section className="flex flex-col gap-3 rounded-3xl bg-stone-900 p-5 text-white lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-200">What we should test next</p>
            <h2 className="mt-1 text-xl font-bold">{next.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-stone-200">{next.why}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-bold text-stone-900 disabled:opacity-60"
            onClick={() => void act({ type: "start-experiment", templateId: next.templateId })}
          >
            Start My First Learning Experiment
          </button>
        </section>
      ) : null}
    </div>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{title}</p>
      <p className="mt-1 text-sm font-semibold text-stone-900">{body}</p>
    </div>
  );
}

export function InsightsPanel({
  doc,
  insights,
  busy,
  act,
}: {
  doc: LearningHabitsDocument;
  insights: Insight[];
  busy: boolean;
  act: (action: HabitsAction) => Promise<void>;
}) {
  const charts = evidenceCharts(doc);
  const [open, setOpen] = useState<string | null>(charts.find((chart) => chart.ready)?.id ?? null);
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-black text-stone-900">What the evidence can say</h2>
        <p className="mt-1 max-w-2xl text-sm text-stone-600">
          Reported experiences stay separate from scored attempts. A chart appears only when there is something real to show.
        </p>
      </header>
      <div className="grid gap-3 lg:grid-cols-2">
        {charts.map((chart) => (
          <article key={chart.id} className="rounded-2xl border border-stone-200 p-4">
            <h3 className="font-bold text-stone-900">{chart.title}</h3>
            {chart.ready ? (
              <>
                <p className="mt-1 text-sm text-stone-600">{chart.summary}</p>
                <ul className="mt-3 space-y-2">
                  {chart.rows.map((row) => (
                    <li key={`${chart.id}-${row.label}-${row.detail}`}>
                      <div className="flex justify-between text-xs font-semibold text-stone-700">
                        <span>{row.label}</span>
                        <span>{row.total === 0 ? "Unknown" : `${row.filled}/${row.total}`}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-stone-100" aria-hidden>
                        <div
                          className="h-2 rounded-full bg-teal-700"
                          style={{ width: row.total ? `${Math.round((row.filled / row.total) * 100)}%` : "0%" }}
                        />
                      </div>
                      <p className="text-xs text-stone-500">{row.detail}</p>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-2 text-sm font-semibold text-teal-800"
                  aria-expanded={open === chart.id}
                  onClick={() => setOpen(open === chart.id ? null : chart.id)}
                >
                  {open === chart.id ? "Hide attempts" : "See the attempts"}
                </button>
                {open === chart.id ? (
                  <ul className="mt-2 list-disc pl-5 text-xs text-stone-600">
                    {chart.rows.map((row) => (
                      <li key={`${row.label}-${row.detail}`}>{row.label}: {row.detail}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-sm text-stone-500" data-evidence-empty={chart.id}>
                {chart.empty}
              </p>
            )}
          </article>
        ))}
      </div>
      <ul className="space-y-3">
        {insights.length === 0 ? (
          <li className="text-sm text-stone-600" data-learning-habits-empty="insights">
            No measured insight yet. Selections on the discovery screen are not treated as performance.
          </li>
        ) : (
          insights.map((insight) => (
            <li key={insight.id} className="rounded-2xl border p-4">
              <p className="text-sm text-stone-800">{insight.text}</p>
              <p className="mt-2 text-xs text-stone-500">
                Observations: {insight.evidenceCount}. {insight.confidence}. Unknown: {insight.unknown}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={insight.nextHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-800">
                  {insight.nextLabel}
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  className="min-h-11 rounded-xl border px-3 text-sm"
                  onClick={() => void act({ type: "dismiss-insight", id: insight.id })}
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
