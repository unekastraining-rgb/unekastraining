"use client";

import Link from "next/link";
import { CalendarPlus, ScanLine, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="card-elevated border-dashed bg-gradient-to-br from-white via-[color-mix(in_srgb,var(--sh-highlight-soft)_40%,white)] to-[color-mix(in_srgb,var(--sh-primary-soft)_35%,white)] px-8 py-14 text-center md:px-12">
      <div className="theme-icon-tile mx-auto mb-6 flex h-20 w-20 items-center justify-center !p-0 shadow-md">
        {icon}
      </div>
      <h3 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted">
        {description}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href={primaryHref} className="btn-primary inline-flex min-w-[180px] items-center justify-center px-6 py-3 text-sm shadow-md">
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex min-w-[180px] items-center justify-center rounded-xl border border-brand bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function ClassesEmptyState() {
  return (
    <EmptyState
      icon={<CalendarPlus className="h-10 w-10" />}
      title="No classes yet"
      description="Add your first class or scan a syllabus to build your semester schedule."
      primaryHref="/courses"
      primaryLabel="Add class"
      secondaryHref="/courses"
      secondaryLabel="Scan syllabus"
    />
  );
}

export function ScheduleEmptyState() {
  return (
    <EmptyState
      icon={<ScanLine className="h-10 w-10" />}
      title="Nothing on the calendar"
      description="Scan a syllabus, or turn on Grade school planner in Settings to build a class by grade and subject."
      primaryHref="/courses"
      primaryLabel="Add a class"
      secondaryHref="/dashboard?tab=settings"
      secondaryLabel="Open settings"
    />
  );
}

export function LockerEmptyState() {
  return (
    <EmptyState
      icon={<Sparkles className="h-10 w-10" />}
      title="Your locker is empty"
      description="Course materials and study tools will show up here once you add classes."
      primaryHref="/courses"
      primaryLabel="Add class"
      secondaryHref="/flashcards"
      secondaryLabel="Start flashcards"
    />
  );
}
