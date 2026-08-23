"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Brain, ClipboardList, FileText, Layers, Sparkles, Zap } from "lucide-react";

import { CourseFilterBar } from "./calendar/CourseFilterBar";
import { LockerEmptyState } from "./EmptyStates";
import { MaterialOpenActions } from "@/components/materials/MaterialOpenActions";
import type { HubMaterial, HubStats } from "./types";

import { hubAssignmentsHref } from "@/lib/hub/tabs";

const studyTools = [
  {
    href: "/core",
    label: "Core Notes",
    description: "Write, sketch, speak & annotate",
    icon: FileText,
    tone: "teal",
  },
  {
    href: "/study",
    label: "Study Hub",
    description: "Six, Lucky & Study Now",
    icon: Sparkles,
    tone: "violet",
  },
  {
    href: "/quizzes",
    label: "Quizzes",
    description: "Lucky retention quizzes",
    icon: ClipboardList,
    tone: "violet",
  },
  {
    href: "/flashcards",
    label: "Flashcards",
    description: "Spaced repetition review",
    icon: Layers,
    tone: "amber",
  },
  {
    href: hubAssignmentsHref(),
    label: "Assignments",
    description: "Due work & assignments",
    icon: Zap,
    tone: "rose",
  },
  {
    href: "/dashboard/telemetry",
    label: "Mastery",
    description: "Track what you know",
    icon: Brain,
    tone: "teal",
  },
];

export function LockerTab({
  courses,
  materials,
  stats,
}: {
  courses: Array<{ id: string; title: string; color: string | null }>;
  materials: HubMaterial[];
  stats: HubStats;
}) {
  const [courseFilterId, setCourseFilterId] = useState<string | null>(null);

  const filteredMaterials = useMemo(() => {
    if (!courseFilterId) return materials;
    return materials.filter((material) => material.courseId === courseFilterId);
  }, [materials, courseFilterId]);

  const studyToolHref = (href: string) => {
    if (!courseFilterId) return href;
    if (href === "/core") return `/core?courseId=${courseFilterId}`;
    if (href === "/quizzes") return `/quizzes?courseId=${courseFilterId}`;
    if (href === "/flashcards") return `/flashcards?courseId=${courseFilterId}`;
    if (href === "/study") return `/study?courseId=${courseFilterId}`;
    return href;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4 md:max-w-xl">
        <Link href={hubAssignmentsHref()} className="block transition hover:opacity-90">
          <StatPill label="Due" value={stats.pendingAssignments} variant="primary" />
        </Link>
        <Link href="/flashcards" className="block transition hover:opacity-90">
          <StatPill label="Cards" value={stats.dueFlashcards} variant="warm" />
        </Link>
        <Link href="/dashboard/telemetry" className="block transition hover:opacity-90">
          <StatPill label="Mastery" value={`${stats.overallMastery}%`} variant="accent" />
        </Link>
      </div>

      <CourseFilterBar
        courses={courses}
        selectedCourseId={courseFilterId}
        onChange={setCourseFilterId}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="panel-raised p-5 md:p-6">
          <h3 className="section-heading mb-4">Study tools</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {studyTools.map((tool, index) => {
              const Icon = tool.icon;
              const tileClass =
                index % 4 === 0
                  ? "theme-icon-tile"
                  : index % 4 === 1
                    ? "theme-icon-tile-warm"
                    : index % 4 === 2
                      ? "theme-icon-tile-accent"
                      : "theme-icon-tile-deep";
              return (
                <Link
                  key={tool.href}
                  href={studyToolHref(tool.href)}
                  className="card-interactive flex items-center gap-4 p-4"
                >
                  <div className={tileClass}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{tool.label}</p>
                    <p className="text-sm text-muted">{tool.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="panel-raised p-5 md:p-6">
          <h3 className="section-heading mb-4">
            Materials
            {courseFilterId ? (
              <span className="ml-1 text-sm font-semibold text-stone-500">
                ({filteredMaterials.length})
              </span>
            ) : null}
          </h3>
          {filteredMaterials.length === 0 ? (
            <LockerEmptyState />
          ) : (
            <div className="space-y-3">
              {filteredMaterials.map((material) => (
                <div key={material.id} className="card-interactive p-4">
                  <MaterialOpenActions
                    materialId={material.id}
                    courseId={material.courseId}
                    title={material.title}
                    type={material.type}
                    subtitle={material.courseTitle}
                    className="border-0 bg-transparent p-0 hover:border-transparent hover:bg-transparent"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant: "primary" | "warm" | "accent";
}) {
  const className =
    variant === "warm"
      ? "theme-stat-pill-warm"
      : variant === "accent"
        ? "theme-stat-pill-accent"
        : "theme-stat-pill";

  return (
    <div className={`px-4 py-4 ${className}`}>
      <p className="text-2xl font-bold text-brand">{value}</p>
      <p className="text-body text-xs font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}
