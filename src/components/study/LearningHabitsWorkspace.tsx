"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { DiscoverPanel, InsightsPanel } from "@/components/study/LearningHabitsDiscoveryViews";
import { PROBES, type Probe, type QuestionItem } from "@/lib/learning/habits/catalog";
import { reportForResults } from "@/lib/learning/habits/diagnosis";
import { nextTrackProbe, taskTrackComplete, trackIds, type TaskSubject } from "@/lib/learning/habits/progression-standard";
import { createTaskDraft } from "@/lib/learning/habits/task-draft";
import {
  buildHypotheses,
  evidenceCharts,
  primaryExperiment,
} from "@/lib/learning/habits/discovery";
import type { LearningHabitsDocument } from "@/lib/learning/habits/document";
import type { HabitsAction, Insight, Recommendation } from "@/lib/learning/habits/engine";

type Payload = {
  document: LearningHabitsDocument;
  questionnaire: QuestionItem[];
  currentProbe: Probe | null;
  insights: Insight[];
  recommendations: Recommendation[];
  analytics: {
    recordedProbes: number;
    scoredProbes: number;
    accuracy: number | null;
    assisted: number;
    independent: number;
    habitGoals: number;
    completionsThisWeek: number;
    reviewsCompleted: number;
    reviewsUnknown: number;
    activeExperiments: number;
    questionnaireAnswered: number;
    questionnaireTotal: number;
  };
  suggestedExperiments: Array<{
    templateId: string;
    title: string;
    question: string;
    limitation: string;
  }>;
};

type Destination = "discover" | "lab" | "results" | "task";

const DESTINATIONS: Array<{ id: Destination; label: string }> = [
  { id: "discover", label: "Discover" },
  { id: "lab", label: "Learning Lab" },
  { id: "results", label: "My Results" },
];

function destinationFor(raw: string | null, analyzed: boolean): Destination {
  if (raw === "profile" || raw === "insights" || raw === "retention" || raw === "results") {
    return "results";
  }
  if (raw === "task") return "task";
  if (raw === "assessment" || raw === "experiments" || raw === "lab") return "lab";
  if (raw === "discover" || raw === "onboarding" || raw === "overview") return "discover";
  if (raw === "habits" || raw === "settings") return analyzed ? "lab" : "discover";
  return analyzed ? "lab" : "discover";
}

export function LearningHabitsWorkspace() {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState(false);
  const [clock, setClock] = useState<number | null>(null);
  const saveInFlight = useRef(false);
  const requested = params.get("section");
  const panel = params.get("panel") ?? (requested === "settings" ? "settings" : requested === "habits" ? "routine" : null);
  const destination = destinationFor(requested, Boolean(data?.document.discovery.analyzedAt));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/learning-habits");
      const json = (await res.json()) as Payload & { success?: boolean; error?: string };
      if (!res.ok || json.success === false) {
        setError(json.error ?? "Could not load Learning & Habits.");
        return;
      }
      setData(json);
      const key = "study-haul-learning-habits-session";
      let sessionId = window.sessionStorage.getItem(key);
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        window.sessionStorage.setItem(key, sessionId);
      }
      if (json.document.activeSessionId !== sessionId) {
        const saved = await fetch("/api/study/learning-habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: { type: "note-session", sessionId } }),
        });
        const next = (await saved.json()) as Payload & { success?: boolean; document?: LearningHabitsDocument };
        if (saved.ok && next.success !== false && next.document) {
          setData({ ...json, document: next.document });
        }
      }
    } catch {
      setError("Network problem. Your other study tools are still available.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setClock(Date.now());
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function open(next: Destination, nextPanel?: string | null) {
    const query = new URLSearchParams({ section: next });
    if (nextPanel) query.set("panel", nextPanel);
    router.replace(`/study/learning-habits?${query.toString()}`);
  }

  async function act(action: HabitsAction) {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/study/learning-habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        document?: LearningHabitsDocument;
        insights?: Insight[];
        recommendations?: Recommendation[];
        analytics?: Payload["analytics"];
        currentProbe?: Probe | null;
      };
      if (!res.ok || !json.success || !json.document) {
        setError(json.error ?? "Could not save.");
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              document: json.document!,
              insights: json.insights ?? prev.insights,
              recommendations: json.recommendations ?? prev.recommendations,
              analytics: json.analytics ?? prev.analytics,
              currentProbe: json.currentProbe ?? null,
            }
          : prev,
      );
      if (action.type === "save-discovery") {
        setHeld(false);
        router.replace("/study/learning-habits?section=lab");
      }
      if (action.type === "submit-probe" || action.type === "skip-probe") {
        setHeld(true);
      }
    } catch {
      setError("Save failed. Try again. Nothing else in Study Haul was changed.");
    } finally {
      saveInFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div data-learning-habits-workspace className="min-h-[70vh] bg-[#f4f1ea] text-stone-950">
      <header className="space-y-4 px-4 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-900">Learning lab</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex min-h-12 items-center rounded-full bg-white px-4 text-base font-semibold touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
              onClick={() => open(destination, panel === "routine" ? null : "routine")}
            >
              Routine
            </button>
            <button
              type="button"
              className="inline-flex min-h-12 items-center rounded-full bg-white px-4 text-base font-semibold touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
              aria-expanded={panel === "settings"}
              onClick={() => open(destination, panel === "settings" ? null : "settings")}
            >
              Settings
            </button>
          </div>
        </div>
        <nav aria-label="Learning and habits" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {DESTINATIONS.map((item) => (
            <Link
              key={item.id}
              href={`/study/learning-habits?section=${item.id}`}
              aria-current={destination === item.id ? "page" : undefined}
              className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-base font-bold touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${
                destination === item.id ? "bg-stone-950 text-white" : "bg-white text-stone-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="px-4 pb-16 sm:px-8" aria-busy={loading || busy}>
        {loading ? <p className="text-lg text-stone-600" role="status">Loading your learning record…</p> : null}
        {error ? (
          <p className="mb-4 rounded-2xl bg-amber-100 px-4 py-3 text-base text-amber-950" role="alert">{error}</p>
        ) : null}
        {data && destination === "discover" ? <DiscoverPanel doc={data.document} busy={busy} act={act} /> : null}
        {data && destination === "lab" ? (
          <LearningLab data={data} busy={busy} held={held} onContinue={() => setHeld(false)} act={act} />
        ) : null}
        {data && destination === "task" ? (
          <TaskLab
            data={data}
            subject={params.get("subject") === "math" ? "math" : "python"}
            busy={busy}
            held={held}
            onContinue={() => setHeld(false)}
            act={act}
          />
        ) : null}
        {data && destination === "results" ? <ResultsHome data={data} busy={busy} act={act} nowMs={clock} /> : null}
        {data && panel === "routine" ? <RoutineDrawer doc={data.document} busy={busy} act={act} /> : null}
        {data && panel === "settings" ? <SettingsDrawer doc={data.document} busy={busy} act={act} /> : null}
      </main>
    </div>
  );
}

function openingOrder(probe: Probe) {
  if (probe.responseMode === "order" && probe.arrange?.length) {
    return [...probe.arrange.slice(1), probe.arrange[0]!];
  }
  return [];
}

function TaskLab({
  data,
  subject,
  busy,
  held,
  onContinue,
  act,
}: {
  data: Payload;
  subject: TaskSubject;
  busy: boolean;
  held: boolean;
  onContinue: () => void;
  act: (action: HabitsAction) => Promise<void>;
}) {
  const doc = data.document;
  const track = trackIds(subject);
  const probe = nextTrackProbe(doc, subject);
  const trackIndex = probe ? track.indexOf(probe.id) : -1;
  const stepLabel = trackIndex >= 0 ? `Step ${trackIndex + 1} of ${track.length}` : "Follow-up";
  if (taskTrackComplete(doc, subject)) {
    return (
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div>
          <p className="text-base font-bold uppercase tracking-[0.18em] text-teal-900">Program task</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Steps saved.</h1>
          <p className="mt-4 max-w-xl text-xl text-stone-700">The report is on My Results. Nothing here names a difficulty between steps.</p>
        </div>
        <div className="flex flex-wrap content-start gap-3">
          <Link href="/study/learning-habits?section=results" className="inline-flex min-h-14 items-center rounded-full bg-stone-950 px-8 text-lg font-bold text-white">
            View My Results
          </Link>
          <Link href="/study" className="inline-flex min-h-14 items-center rounded-full bg-white px-8 text-lg font-bold text-stone-900">
            Finish for Now
          </Link>
        </div>
      </section>
    );
  }

  if (held) {
    return (
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-lg font-bold text-teal-900">This step is saved.</p>
          <h1 className="mt-3 text-4xl font-black">Ready for the next one.</h1>
        </div>
        <button type="button" className="mt-8 inline-flex min-h-14 w-fit items-center rounded-full bg-stone-950 px-8 text-lg font-bold text-white" onClick={onContinue}>
          Continue
        </button>
      </section>
    );
  }

  if (!probe) return null;

  return (
    <TaskStep
      key={probe.id}
      probe={probe}
      subject={subject}
      stepLabel={stepLabel}
      busy={busy}
      act={act}
    />
  );
}

function TaskStep({
  probe,
  subject,
  stepLabel,
  busy,
  act,
}: {
  probe: Probe;
  subject: TaskSubject;
  stepLabel: string;
  busy: boolean;
  act: (action: HabitsAction) => Promise<void>;
}) {
  const draftRef = useRef(createTaskDraft({ order: openingOrder(probe) }));
  const [choice, setChoice] = useState("");
  const [order, setOrder] = useState(() => openingOrder(probe));
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [explanation, setExplanation] = useState("");
  const [supportLevel, setSupportLevel] = useState<"none" | "hint" | "worked-example">("none");
  const exampleAvailable = Boolean(probe.hint || probe.workedExample);

  return (
    <section>
      <form
        className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]"
        onSubmit={(event) => {
          event.preventDefault();
          const snap = draftRef.current.snapshot();
          const built =
            probe.responseMode === "order"
              ? snap.orderId
              : probe.responseMode === "assign"
                ? snap.assignment
                : snap.choice;
          if (!built || built.includes(":|") || built.endsWith(":") || built.includes(":>")) return;
          if (probe.responseMode === "assign" && (probe.pieces ?? []).some((piece) => !snap.placed[piece.id])) return;
          void act({
            type: "submit-probe",
            probeId: probe.id,
            choiceId: built,
            explanation,
            supportLevel: exampleAvailable ? snap.support : "none",
          });
          setChoice("");
          setExplanation("");
          setSupportLevel("none");
        }}
      >
        <div>
          <div className="flex flex-wrap gap-2">
            <Link href="/study/learning-habits?section=task&subject=python" className={`inline-flex min-h-11 items-center rounded-full px-4 text-base font-bold ${subject === "python" ? "bg-stone-950 text-white" : "bg-white"}`}>Withdrawal loop</Link>
            <Link href="/study/learning-habits?section=task&subject=math" className={`inline-flex min-h-11 items-center rounded-full px-4 text-base font-bold ${subject === "math" ? "bg-stone-950 text-white" : "bg-white"}`}>Word problem</Link>
          </div>
          <p className="mt-4 text-lg font-bold text-teal-900">{stepLabel}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">{probe.prompt}</h1>
          {exampleAvailable ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="min-h-12 rounded-full bg-white px-5 text-base font-semibold" onClick={() => { draftRef.current.markSupport("hint"); setSupportLevel("hint"); }}>Hint</button>
              <button type="button" className="min-h-12 rounded-full bg-white px-5 text-base font-semibold" onClick={() => { draftRef.current.markSupport("worked-example"); setSupportLevel("worked-example"); }}>Worked example</button>
            </div>
          ) : null}
          {supportLevel === "hint" && probe.hint ? <p className="mt-4 max-w-3xl text-lg text-stone-700">{probe.hint}</p> : null}
          {supportLevel === "worked-example" && probe.workedExample ? <p className="mt-4 max-w-3xl text-lg text-stone-700">{probe.workedExample}</p> : null}
        </div>
        <div className="space-y-3">
          {probe.responseMode === "order" ? order.map((item, index) => (
            <div key={item.id} className="flex min-h-16 items-center justify-between gap-3 rounded-3xl bg-white px-4 py-3">
              <span className="text-lg font-semibold">{index + 1}. {item.label}</span>
              <span className="flex gap-2">
                <button type="button" className="min-h-11 rounded-full bg-stone-100 px-3 font-bold" onClick={() => setOrder(draftRef.current.move(item.id, -1))} aria-label={`Move ${item.label} earlier`}>Up</button>
                <button type="button" className="min-h-11 rounded-full bg-stone-100 px-3 font-bold" onClick={() => setOrder(draftRef.current.move(item.id, 1))} aria-label={`Move ${item.label} later`}>Down</button>
              </span>
            </div>
          )) : null}
          {probe.responseMode === "assign" ? (probe.pieces ?? []).map((piece) => (
            <label key={piece.id} className="block rounded-3xl bg-white px-4 py-3 text-lg font-semibold">
              {piece.label}
              <select
                className="mt-2 min-h-12 w-full rounded-full bg-stone-100 px-3"
                value={placed[piece.id] ?? ""}
                onChange={(event) => {
                  draftRef.current.place(piece.id, event.target.value);
                  setPlaced(draftRef.current.snapshot().placed);
                }}
              >
                <option value="">Choose a place</option>
                {(probe.slots ?? []).map((slot) => (
                  <option key={slot.id} value={slot.id}>{slot.label}</option>
                ))}
              </select>
            </label>
          )) : null}
          {probe.responseMode !== "order" && probe.responseMode !== "assign" ? probe.choices.map((item) => (
            <label
              key={item.id}
              className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-3xl px-5 py-4 text-lg font-semibold touch-manipulation ${
                choice === item.id ? "bg-teal-800 text-white" : "bg-white text-stone-900"
              }`}
            >
              <input type="radio" name="task-choice" className="h-5 w-5 shrink-0" checked={choice === item.id} onChange={() => { draftRef.current.choose(item.id); setChoice(item.id); }} />
              {item.label}
            </label>
          )) : null}
          {probe.explanationPrompt ? (
            <label className="block text-lg">
              {probe.explanationPrompt}
              <textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} className="mt-2 min-h-24 w-full rounded-3xl bg-white px-4 py-3 text-lg" />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={busy || (probe.responseMode !== "order" && probe.responseMode !== "assign" && !choice)} className="inline-flex min-h-14 items-center rounded-full bg-stone-950 px-8 text-lg font-bold text-white disabled:opacity-40">Submit</button>
            <button type="button" disabled={busy} className="inline-flex min-h-14 items-center rounded-full bg-white px-6 text-lg font-semibold" onClick={() => void act({ type: "skip-probe", probeId: probe.id })}>Skip</button>
          </div>
        </div>
      </form>
    </section>
  );
}

function LearningLab({
  data,
  busy,
  held,
  onContinue,
  act,
}: {
  data: Payload;
  busy: boolean;
  held: boolean;
  onContinue: () => void;
  act: (action: HabitsAction) => Promise<void>;
}) {
  const doc = data.document;
  const total = PROBES.length;
  const finished = doc.assessment.results.filter((row) => PROBES.some((probe) => probe.id === row.templateId)).length;
  const current = Math.min(finished + 1, total);
  const probe = data.currentProbe;
  const [choice, setChoice] = useState("");
  const [explanation, setExplanation] = useState("");
  const [supportLevel, setSupportLevel] = useState<"none" | "hint" | "worked-example">("none");

  if (doc.assessment.status === "not_started") {
    return (
      <section>
        <div>
          <p className="text-base font-bold uppercase tracking-[0.18em] text-teal-900">Learning Lab</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">One challenge at a time.</h1>
          <p className="mt-4 max-w-xl text-xl leading-relaxed text-stone-700">
            You will reason, notice a meaningful change, and try the idea in a new situation. Nothing here is graded out loud.
          </p>
          <button
            type="button"
            disabled={busy}
            className="mt-8 inline-flex min-h-14 items-center rounded-full bg-teal-800 px-8 text-lg font-bold text-white touch-manipulation hover:bg-teal-700 disabled:opacity-60"
            onClick={() => void act({ type: "start-assessment" })}
          >
            Begin challenges
          </button>
        </div>
      </section>
    );
  }

  if (doc.assessment.status === "completed" || (held && !probe)) {
    return (
      <section className="mx-auto max-w-3xl py-10">
        <p className="text-base font-bold uppercase tracking-[0.18em] text-teal-900">Finished</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">Challenges saved.</h1>
        <p className="mt-4 text-xl text-stone-700">You can look at a preliminary profile, or leave. Nothing is required.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/study/learning-habits?section=results" className="inline-flex min-h-14 items-center rounded-full bg-stone-950 px-8 text-lg font-bold text-white">
            View My Results
          </Link>
          <Link href="/study" className="inline-flex min-h-14 items-center rounded-full bg-white px-8 text-lg font-bold text-stone-900">
            Finish for Now
          </Link>
        </div>
      </section>
    );
  }

  if (held) {
    return (
      <section className="py-16">
        <p className="text-lg font-bold text-teal-900">Challenge {Math.min(finished, total)} of {total} saved</p>
        <h1 className="mt-3 text-4xl font-black">Ready for the next one.</h1>
        <button type="button" className="mt-8 inline-flex min-h-14 items-center rounded-full bg-stone-950 px-8 text-lg font-bold text-white" onClick={onContinue}>
          Continue
        </button>
      </section>
    );
  }

  if (doc.assessment.status === "paused" || !probe) {
    return (
      <section className="py-10">
        <h1 className="text-4xl font-black">Paused</h1>
        <p className="mt-3 text-xl text-stone-700">Your place is saved. Resume when you want the next challenge.</p>
        <button type="button" disabled={busy} className="mt-8 inline-flex min-h-14 items-center rounded-full bg-stone-950 px-8 text-lg font-bold text-white" onClick={() => void act({ type: "resume-assessment" })}>
          Resume
        </button>
      </section>
    );
  }

  return (
    <section>
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (!choice) return;
          void act({
            type: "submit-probe",
            probeId: probe.id,
            choiceId: choice,
            explanation,
            supportLevel,
          });
          setChoice("");
          setExplanation("");
          setSupportLevel("none");
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg font-bold text-teal-900">Challenge {current} of {total} · {stageLabel(probe.stage)}</p>
          <button type="button" className="min-h-11 text-base font-semibold text-stone-600 underline" disabled={busy} onClick={() => void act({ type: "pause-assessment" })}>
            Pause
          </button>
        </div>
        <h1 className="max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{probe.prompt}</h1>
        {probe.hint ? (
          <div className="flex flex-wrap gap-3">
            <button type="button" className="min-h-12 rounded-full bg-white px-5 text-base font-semibold" onClick={() => setSupportLevel("hint")}>
              Hint
            </button>
            <button type="button" className="min-h-12 rounded-full bg-white px-5 text-base font-semibold" onClick={() => setSupportLevel("worked-example")}>
              Worked example
            </button>
          </div>
        ) : null}
        {supportLevel === "hint" && probe.hint ? <p className="max-w-3xl text-lg text-stone-700">{probe.hint}</p> : null}
        {supportLevel === "worked-example" && probe.workedExample ? <p className="max-w-3xl text-lg text-stone-700">{probe.workedExample}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {probe.choices.map((item) => (
            <label
              key={item.id}
              className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-3xl px-5 text-xl font-semibold touch-manipulation ${
                choice === item.id ? "bg-teal-800 text-white" : "bg-white text-stone-900"
              }`}
            >
              <input type="radio" name="lab-choice" className="h-5 w-5" checked={choice === item.id} onChange={() => setChoice(item.id)} />
              {item.label}
            </label>
          ))}
        </div>
        {probe.explanationPrompt ? (
          <label className="block max-w-3xl text-lg">
            {probe.explanationPrompt}
            <textarea
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-3xl bg-white px-4 py-3 text-lg"
            />
          </label>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy || !choice} className="inline-flex min-h-14 items-center rounded-full bg-stone-950 px-8 text-lg font-bold text-white disabled:opacity-40">
            Submit
          </button>
          <button type="button" disabled={busy} className="inline-flex min-h-14 items-center rounded-full bg-white px-6 text-lg font-semibold" onClick={() => void act({ type: "skip-probe", probeId: probe.id })}>
            Skip
          </button>
        </div>
      </form>
    </section>
  );
}

function ResultsHome({
  data,
  busy,
  act,
  nowMs,
}: {
  data: Payload;
  busy: boolean;
  act: (action: HabitsAction) => Promise<void>;
  nowMs: number | null;
}) {
  const doc = data.document;
  const scored = doc.assessment.results.filter((row) => row.correct !== null);
  const delayedReviews = doc.reviews.filter((row) => row.countsAsDelayed && row.status === "completed" && row.outcome != null);
  const pendingReview = doc.reviews.some((row) => row.status === "scheduled" || row.status === "skipped");
  const charts = evidenceCharts(doc).filter((chart) => chart.ready);
  const next = primaryExperiment(doc);
  const hypotheses = buildHypotheses(doc).slice(0, 2);
  const report = reportForResults(doc);
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black sm:text-5xl">My Results</h1>
        <p className="mt-2 max-w-2xl text-lg text-stone-700">Preliminary hypotheses from what you did. Not a learning type.</p>
      </header>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-black">Learning profile</h2>
          {scored.length === 0 ? (
            <p className="mt-4 text-lg text-stone-600">No scored challenges yet. Selections on Discover are not treated as performance.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-lg text-stone-800">
              <li>{summarizeReasoning(doc)}</li>
              <li>{summarizeExplanations(doc)}</li>
              <li>{summarizeFactor(doc, "detail", "Meaningful details")}</li>
              <li>{scored.filter((row) => (row.supportLevel ?? "none") === "none").length} independent attempts, {scored.filter((row) => (row.supportLevel ?? "none") !== "none").length} with support.</li>
              <li>{summarizeFactor(doc, "transfer", "Transfer to a new situation")}</li>
            </ul>
          )}
          {hypotheses[0] ? <p className="mt-4 text-base text-stone-600">{hypotheses[0].why}</p> : null}
        </section>
        <section className="rounded-[2rem] bg-teal-900 p-6 text-white sm:p-8">
          <h2 className="text-2xl font-black">Retention profile</h2>
          {delayedReviews.length === 0 ? (
            <p className="mt-4 text-lg text-teal-50">
              {pendingReview
                ? "Not yet measured. A later review is pending or was skipped, so no retention pattern is claimed."
                : "Incomplete. A recall challenge in the same sitting is not delayed recall, so no retention pattern is claimed."}
            </p>
          ) : (
            <p className="mt-4 text-lg text-teal-50">
              {delayedReviews.filter((row) => row.outcome === "SUCCESS").length} of {delayedReviews.length} later reviews were recalled. A skipped review stays unknown.
            </p>
          )}
          <Link href="/study/lucky" className="mt-6 inline-flex min-h-12 items-center text-lg font-bold underline">Open Lucky</Link>
        </section>
      </div>
      {report ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <h2 className="text-2xl font-black lg:col-span-2">What the attempts show</h2>
          {report.strengths ? <p className="rounded-[2rem] bg-white p-6 text-lg"><span className="font-bold">{`What you're doing well. `}</span>{report.strengths}</p> : null}
          {report.breakdown ? <p className="rounded-[2rem] bg-white p-6 text-lg"><span className="font-bold">{`Where you're getting stuck. `}</span>{report.breakdown}</p> : null}
          {report.suggests ? <p className="rounded-[2rem] bg-stone-100 p-6 text-lg lg:col-span-2"><span className="font-bold">What the pattern suggests. </span>{report.suggests}</p> : null}
          {report.notEstablished ? <p className="rounded-[2rem] bg-stone-100 p-6 text-lg"><span className="font-bold">What we still need to check. </span>{report.notEstablished}</p> : null}
          <div className="rounded-[2rem] bg-white p-6 text-lg lg:col-span-2">
            <p><span className="font-bold">{`What we'll do next. `}</span>{report.approach}</p>
            {report.steps.length > 0 ? (
              <ol className="mt-4 list-decimal space-y-2 pl-5">
                {report.steps.map((step) => (
                  <li key={`${step.href}-${step.title}`}>
                    <Link href={step.href} className="font-bold text-teal-900">{step.title}</Link>
                    <span> {step.why}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
          {report.check ? <p className="text-lg text-stone-700 lg:col-span-2"><span className="font-bold">{`How we'll measure progress. `}</span>{report.check}</p> : null}
        </section>
      ) : null}
      {data.recommendations[0] ? (
        <p className="text-xl">
          Next activity: {data.recommendations[0].title}. {data.recommendations[0].reason}{" "}
          <Link href={data.recommendations[0].href} className="font-bold text-teal-900">
            {data.recommendations[0].label}
          </Link>
        </p>
      ) : null}
      {data.recommendations[0] ? (
        <p className="text-lg text-stone-700">
          <Link href="/planner" className="font-bold text-teal-900">Planner</Link> can hold this practice. Nothing is added to the calendar automatically.
        </p>
      ) : null}
      {next ? (
        <p className="text-xl">
          Next: {next.title}. {next.why}{" "}
          <Link href="/study/learning-habits?section=lab" className="font-bold text-teal-900">Return to the lab</Link>
        </p>
      ) : null}
      {charts.length > 0 ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {charts.map((chart) => (
            <li key={chart.id} className="bg-white p-5">
              <h3 className="text-xl font-bold">{chart.title}</h3>
              <p className="mt-1 text-base text-stone-600">{chart.summary}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <details className="bg-white p-5">
        <summary className="cursor-pointer text-lg font-bold">Evidence and reviews</summary>
        <div className="mt-4">
          <InsightsPanel doc={doc} insights={data.insights} busy={busy} act={act} />
          <ReviewList doc={doc} busy={busy} act={act} nowMs={nowMs} />
          <ExperimentList data={data} busy={busy} act={act} />
        </div>
      </details>
    </div>
  );
}

function stageLabel(stage: string): string {
  switch (stage) {
    case "foundation":
      return "Foundation";
    case "guided":
      return "Guided example";
    case "supported":
      return "Supported application";
    case "variation":
      return "One meaningful change";
    case "independent":
      return "Independent application";
    case "transfer":
      return "A new situation";
    case "recall":
      return "Recall in this sitting";
    default:
      return "Challenge";
  }
}

function summarizeReasoning(doc: LearningHabitsDocument): string {
  const rows = doc.assessment.results.filter((row) => row.factor === "understanding" && row.correct !== null);
  if (rows.length === 0) return "Reasoning: not tested yet.";
  const met = rows.filter((row) => row.correct).length;
  const unknown = rows.filter((row) => !row.reasoningQuality || row.reasoningQuality === "unknown").length;
  if (unknown === rows.length) {
    return `Reasoning: ${met} of ${rows.length} choices matched the rule. No written explanation was recorded, so demonstrated reasoning stays unknown.`;
  }
  const qualities = rows.map((row) => row.reasoningQuality || "unknown").join(", ");
  return `Reasoning evidence: ${qualities}. Choice score ${met} of ${rows.length}. A correct choice alone is not understanding.`;
}

function summarizeExplanations(doc: LearningHabitsDocument): string {
  const rows = doc.assessment.results.filter((row) => row.reasoningQuality && row.reasoningQuality !== "unknown");
  if (rows.length === 0) return "Written explanations: none recorded, so explanation quality stays unknown.";
  const kinds = rows.map((row) => row.reasoningQuality).join(", ");
  return `Written explanations: ${kinds}. Explanation quality stays separate from whether the choice matched.`;
}

function summarizeFactor(doc: LearningHabitsDocument, factor: string, label: string): string {
  const rows = doc.assessment.results.filter((row) => row.factor === factor && row.correct !== null);
  if (rows.length === 0) return `${label}: not tested yet.`;
  const met = rows.filter((row) => row.correct).length;
  return `${label}: ${met} of ${rows.length} scored checks. Still a hypothesis if the sample is small.`;
}

function ReviewList({
  doc,
  busy,
  act,
  nowMs,
}: {
  doc: LearningHabitsDocument;
  busy: boolean;
  act: (action: HabitsAction) => Promise<void>;
  nowMs: number | null;
}) {
  const due = doc.reviews.filter((review) => review.status === "scheduled");
  if (due.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2">
      {due.map((review) => {
        const open =
          nowMs != null &&
          Date.parse(review.dueAt) <= nowMs &&
          Boolean(review.originSessionId) &&
          review.originSessionId !== doc.activeSessionId;
        return (
        <li key={review.id} className="flex flex-wrap items-center gap-2 text-base">
          <span>{review.conceptLabel}</span>
          {open ? (
            <>
              <button type="button" className="min-h-11 rounded-full bg-stone-950 px-4 text-white" disabled={busy} onClick={() => void act({ type: "complete-review", id: review.id, outcome: "SUCCESS", performanceKind: "recall", sessionId: doc.activeSessionId })}>Recalled</button>
              <button type="button" className="min-h-11 rounded-full bg-stone-200 px-4" disabled={busy} onClick={() => void act({ type: "complete-review", id: review.id, outcome: "FAIL", performanceKind: "recall", sessionId: doc.activeSessionId })}>Missed</button>
              <button type="button" className="min-h-11 rounded-full bg-stone-200 px-4" disabled={busy} onClick={() => void act({ type: "skip-review", id: review.id })}>Skip, unknown</button>
            </>
          ) : (
            <span>Not yet measured. This review waits for a later session.</span>
          )}
        </li>
        );
      })}
    </ul>
  );
}

function ExperimentList({
  data,
  busy,
  act,
}: {
  data: Payload;
  busy: boolean;
  act: (action: HabitsAction) => Promise<void>;
}) {
  return (
    <ul className="mt-4 space-y-2">
      {data.document.experiments.map((exp) => (
        <li key={exp.id} className="flex flex-wrap items-center gap-2 text-base">
          <span>{exp.title} · {exp.status}</span>
          <button type="button" className="min-h-11 px-2 font-semibold" disabled={busy} onClick={() => void act({ type: "set-experiment-status", id: exp.id, status: exp.status === "paused" ? "active" : "paused" })}>
            {exp.status === "paused" ? "Resume" : "Pause"}
          </button>
          <button type="button" className="min-h-11 px-2 font-semibold" disabled={busy} onClick={() => void act({ type: "set-experiment-status", id: exp.id, status: "canceled" })}>Cancel</button>
        </li>
      ))}
    </ul>
  );
}

function RoutineDrawer({
  doc,
  busy,
  act,
}: {
  doc: LearningHabitsDocument;
  busy: boolean;
  act: (action: HabitsAction) => Promise<void>;
}) {
  const [title, setTitle] = useState("Study three times this week");
  const [environment, setEnvironment] = useState("");
  return (
    <aside className="mt-8 bg-white p-6" aria-label="Routine">
      <h2 className="text-2xl font-black">Routine</h2>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void act({ type: "create-habit", title, frequencyPerWeek: 3 }); }}>
        <input className="min-h-12 flex-1 rounded-full bg-stone-100 px-4 text-lg" value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Habit goal" />
        <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-stone-950 px-5 font-bold text-white">Add</button>
        <Link href="/planner" className="inline-flex min-h-12 items-center font-bold text-teal-900">Planner</Link>
      </form>
      <ul className="mt-4 space-y-2">
        {doc.habits.length === 0 ? <li className="text-lg text-stone-600">No goals yet. A missed day does not erase other study.</li> : doc.habits.map((habit) => (
          <li key={habit.id} className="flex flex-wrap items-center gap-2 text-lg">
            <span>{habit.title}{habit.paused ? " (paused)" : ""} · {habit.completions.length}</span>
            <button type="button" className="min-h-11 font-semibold" disabled={busy} onClick={() => void act({ type: "complete-habit", id: habit.id })}>Did this</button>
            <button type="button" className="min-h-11 font-semibold" disabled={busy} onClick={() => void act({ type: "toggle-habit-pause", id: habit.id })}>{habit.paused ? "Resume" : "Pause"}</button>
            <button type="button" className="min-h-11 font-semibold" disabled={busy} onClick={() => void act({ type: "delete-habit", id: habit.id })}>Delete</button>
          </li>
        ))}
      </ul>
      {doc.settings.habitCheckIns ? (
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void act({ type: "check-in", environment, note: "" }); }}>
          <input className="min-h-12 flex-1 rounded-full bg-stone-100 px-4" value={environment} onChange={(event) => setEnvironment(event.target.value)} aria-label="Optional place or setup" placeholder="Optional place or setup" />
          <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-stone-200 px-4 font-bold">Save check-in</button>
        </form>
      ) : null}
    </aside>
  );
}

function SettingsDrawer({
  doc,
  busy,
  act,
}: {
  doc: LearningHabitsDocument;
  busy: boolean;
  act: (action: HabitsAction) => Promise<void>;
}) {
  const settings = doc.settings;
  return (
    <aside className="mt-8 max-w-xl bg-white p-6" aria-label="Learning and habits settings">
      <h2 className="text-2xl font-black">Settings</h2>
      <p className="mt-2 text-base text-stone-600">Tracking off does not stop Study or Tutor. Deleting this data leaves notes, quizzes, and Lucky cards.</p>
      <div className="mt-4 space-y-2">
        {([
          ["trackingEnabled", "Tracking"],
          ["tutorPersonalization", "Tutor personalization"],
          ["habitCheckIns", "Check-ins"],
          ["reviewReminders", "Review reminders"],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" disabled={busy} aria-pressed={settings[key]} className="flex min-h-12 w-full items-center justify-between rounded-full bg-stone-100 px-4 text-lg font-semibold" onClick={() => void act({ type: "save-settings", settings: { [key]: !settings[key] } })}>
            {label}<span>{settings[key] ? "On" : "Off"}</span>
          </button>
        ))}
      </div>
      <button type="button" disabled={busy} className="mt-4 min-h-12 text-base font-semibold" onClick={() => void act({ type: "reset-insights" })}>Reset insight dismissals</button>
      <button type="button" disabled={busy} className="mt-2 block min-h-12 text-base font-semibold text-red-800" onClick={() => { if (window.confirm("Delete Learning & Habits data? Other study history stays.")) void act({ type: "delete-feature-data" }); }}>
        Delete Learning & Habits data
      </button>
    </aside>
  );
}
