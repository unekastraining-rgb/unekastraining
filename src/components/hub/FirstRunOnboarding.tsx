"use client";

import Link from "next/link";
import {
  BookOpen,
  Link2,
  ScanLine,
} from "lucide-react";

import { DemoColdStartImport } from "@/components/hub/DemoColdStartImport";
import { hubTabPath } from "@/lib/hub/tabs";
import { StudyThisCard } from "@/components/study/StudyThisCard";
import type { HubUser } from "@/components/hub/types";
import { coursesScanLandingHref } from "@/lib/study/loop-hrefs";

import { ClassesEmptyState } from "./EmptyStates";

export function FirstRunOnboarding({
  variant = "hub",
  user,
}: {
  variant?: "hub" | "classes";
  user?: Pick<HubUser, "name" | "email" | "avatarUrl">;
}) {
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
              href={coursesScanLandingHref()}
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

      <DemoColdStartImport />

      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <Link
          href="/study"
          className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline touch-manipulation"
        >
          Browse Study Hub →
        </Link>
        <span className="text-stone-300">·</span>
        <Link
          href="/core"
          className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline touch-manipulation"
        >
          Try Core study pack →
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
