"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Link2,
  Loader2,
  ScanLine,
  Sparkles,
} from "lucide-react";

import { hubTabPath } from "@/lib/hub/tabs";
import { StudyThisCard } from "@/components/study/StudyThisCard";
import type { HubUser } from "@/components/hub/types";

import { ClassesEmptyState } from "./EmptyStates";

export function FirstRunOnboarding({
  variant = "hub",
  user,
}: {
  variant?: "hub" | "classes";
  user?: Pick<HubUser, "name" | "email" | "avatarUrl">;
}) {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  async function importDemo() {
    setLoadingDemo(true);
    setDemoError(null);
    setDemoMessage(null);
    try {
      const response = await fetch("/api/onboarding/demo", { method: "POST" });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Demo import failed.");
      setDemoMessage(data.result?.message ?? "Demo courses added.");
      router.refresh();
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : "Demo import failed.");
    } finally {
      setLoadingDemo(false);
    }
  }

  const subtitle =
    variant === "classes"
      ? "Pick how you want to get started — you can always add more later."
      : "Your hub is ready. Add a class, connect your LMS, or explore with sample data.";

  return (
    <div className="space-y-8">
      {variant === "classes" && !user ? <ClassesEmptyState /> : null}

      {(variant === "hub" || (variant === "classes" && user)) ? (
        <>
          {variant === "hub" && !user ? (
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                Getting started
              </p>
              <h2 className="mt-2 text-3xl font-black text-stone-900">Welcome to Study Haul</h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-stone-600">{subtitle}</p>
            </div>
          ) : (
            <p className="max-w-3xl text-base text-stone-600">{subtitle}</p>
          )}

          {variant === "hub" ? <StudyThisCard compact /> : null}

          <div className="grid gap-4 md:grid-cols-3">
            <OnboardingCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Add a class"
              description="Create a course manually and add assignments as you go."
              href="/courses"
              cta="Add class"
              tone="primary"
            />
            <OnboardingCard
              icon={<ScanLine className="h-6 w-6" />}
              title="Scan a syllabus"
              description="Upload a PDF or paste text — we'll build your schedule and due dates."
              href="/courses"
              cta="Scan syllabus"
              tone="accent"
            />
            <OnboardingCard
              icon={<Link2 className="h-6 w-6" />}
              title="Connect your LMS"
              description="Import from Canvas, Google Classroom, Blackboard, or Moodle."
              href={hubTabPath("settings")}
              cta="Open settings"
              tone="neutral"
            />
          </div>
        </>
      ) : null}

      <div className="rounded-3xl border border-dashed border-brand bg-brand-soft/30 p-6 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--sh-accent-soft)", color: "var(--sh-accent)" }}
        >
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="mt-4 font-bold text-stone-900">Just exploring?</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
          Load sample CS and English courses with assignments so you can try Study
          Now, Lucky, and the calendar right away.
        </p>
        <button
          type="button"
          onClick={() => void importDemo()}
          disabled={loadingDemo}
          className="btn-accent mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {loadingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Import demo data
        </button>
        {demoMessage ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">{demoMessage}</p>
        ) : null}
        {demoError ? (
          <p className="mt-3 text-sm text-rose-700">{demoError}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <Link href="/study" className="font-semibold text-brand hover:underline">
          Browse Study Hub →
        </Link>
        <span className="text-stone-300">·</span>
        <Link href="/core" className="font-semibold text-brand hover:underline">
          Try Core Notes →
        </Link>
      </div>
    </div>
  );
}

function OnboardingCard({
  icon,
  title,
  description,
  href,
  cta,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "primary" | "accent" | "neutral";
}) {
  const iconStyle =
    tone === "primary"
      ? { backgroundColor: "var(--sh-primary-soft)", color: "var(--sh-primary)" }
      : tone === "accent"
        ? { backgroundColor: "var(--sh-accent-soft)", color: "var(--sh-accent)" }
        : { backgroundColor: "color-mix(in srgb, var(--sh-muted) 12%, white)", color: "var(--sh-text)" };

  return (
    <div className="card-soft flex flex-col p-6">
      <div
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        style={iconStyle}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-stone-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{description}</p>
      <Link
        href={href}
        className={`mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
          tone === "primary" ? "btn-primary" : tone === "accent" ? "btn-accent" : "bg-stone-900 hover:bg-stone-800"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
