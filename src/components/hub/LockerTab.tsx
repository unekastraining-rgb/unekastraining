"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  ClipboardList,
  Code2,
  Database,
  FileText,
  FlaskConical,
  Gamepad2,
  Layers,
  Presentation,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { CourseFilterBar } from "./calendar/CourseFilterBar";
import { LockerEmptyState } from "./EmptyStates";
import { AddCourseMaterialButton } from "@/components/materials/AddCourseMaterialModal";
import { MaterialsSelectableList } from "@/components/materials/MaterialsSelectableList";
import type { HubCourse, HubMaterial, HubStats } from "./types";

import { hubAssignmentsHref } from "@/lib/hub/tabs";
import { readableCourseTitle } from "@/lib/courses/display-name";
import {
  buildCapabilityHref,
  listLockerCapabilities,
  type StudyCapability,
} from "@/lib/study/capability-registry";

/** Keep object form so product-reality integrity can assert terminology. */
const TOPIC_PROGRESS_STAT = { label: "Topic progress" } as const;

const LOCKER_ICONS: Partial<
  Record<StudyCapability["id"], typeof FileText>
> = {
  notes: FileText,
  learn: BookOpen,
  practice: Target,
  quizzes: ClipboardList,
  flashcards: Layers,
  retention: Sparkles,
  haul: FileText,
  six: Brain,
  tutor: Brain,
  games: Gamepad2,
  coding: Code2,
  sql: Database,
  math: Target,
  labs: FlaskConical,
  simulations: Zap,
  projects: Layers,
  presentations: Presentation,
  writing: FileText,
};

function withCourseScope(href: string, courseId: string | null): string {
  if (!courseId) return href;
  if (href.startsWith("/core")) return `/core?courseId=${courseId}`;
  if (href.startsWith("/quizzes")) return `/quizzes?courseId=${courseId}&make=1`;
  if (href.startsWith("/flashcards")) return `/flashcards?courseId=${courseId}`;
  if (href === "/study" || href.startsWith("/study?"))
    return `/study?courseId=${courseId}`;
  if (href.includes("?")) return `${href}&courseId=${courseId}`;
  return `${href}?courseId=${courseId}`;
}

export function LockerTab({
  courses,
  materials,
  stats,
}: {
  courses: HubCourse[];
  materials: HubMaterial[];
  stats: HubStats;
}) {
  const router = useRouter();
  const [courseFilterId, setCourseFilterId] = useState<string | null>(null);

  const filteredMaterials = useMemo(() => {
    if (!courseFilterId) return materials;
    return materials.filter((material) => material.courseId === courseFilterId);
  }, [materials, courseFilterId]);

  const studyTools = listLockerCapabilities("study-tools");
  const activities = listLockerCapabilities("activities");

  // Preserve legacy Materials + Assignments + Progress tiles alongside registry.
  const legacyExtras = [
    {
      id: "materials",
      href: "/materials",
      label: "My Materials",
      description: "Syllabi, PDFs & notes",
      Icon: FileText,
    },
    {
      id: "assignments",
      href: hubAssignmentsHref(),
      label: "Assignments",
      description: "Due work & assignments",
      Icon: Zap,
    },
    {
      id: "progress",
      href: "/dashboard/telemetry",
      label: "Progress",
      description: "What you understand",
      Icon: Brain,
    },
  ];

  function renderTile(
    key: string,
    href: string,
    label: string,
    description: string,
    Icon: typeof FileText,
    index: number,
  ) {
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
        key={key}
        href={withCourseScope(href, courseFilterId)}
        data-hub-chrome
        data-locker-capability={key}
        className="card-interactive flex min-h-11 items-center gap-4 p-4 touch-manipulation"
      >
        <div className={tileClass}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-stone-900">{label}</p>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-8" data-locker-tab>
      <div className="grid grid-cols-3 gap-4 md:max-w-xl">
        <Link href={hubAssignmentsHref()} className="block transition hover:opacity-90">
          <StatPill label="Due" value={stats.pendingAssignments} variant="primary" />
        </Link>
        <Link
          href={withCourseScope("/flashcards", courseFilterId)}
          data-hub-chrome
          className="block min-h-11 transition hover:opacity-90 touch-manipulation"
        >
          <StatPill label="Cards" value={stats.dueFlashcards} variant="warm" />
        </Link>
        <Link href="/dashboard/telemetry" className="block transition hover:opacity-90">
          <StatPill
            label={TOPIC_PROGRESS_STAT.label}
            value={`${stats.overallMastery}%`}
            variant="accent"
          />
        </Link>
      </div>

      <CourseFilterBar
        courses={courses}
        selectedCourseId={courseFilterId}
        onChange={setCourseFilterId}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="panel-raised p-5 md:p-6">
          <h3 className="section-heading mb-4">Study tools</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {studyTools.map((tool, index) =>
              renderTile(
                tool.id,
                buildCapabilityHref(tool),
                tool.label,
                tool.description,
                LOCKER_ICONS[tool.id] ?? FileText,
                index,
              ),
            )}
            {legacyExtras.map((tool, index) =>
              renderTile(
                tool.id,
                tool.href,
                tool.label,
                tool.description,
                tool.Icon,
                studyTools.length + index,
              ),
            )}
          </div>
        </div>

        <div className="panel-raised p-5 md:p-6">
          <h3 className="section-heading mb-4">Activities</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {activities.map((tool, index) =>
              renderTile(
                tool.id,
                buildCapabilityHref(tool),
                tool.label,
                tool.description,
                LOCKER_ICONS[tool.id] ?? Target,
                index,
              ),
            )}
          </div>
        </div>

        <div className="panel-raised min-w-0 p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="section-heading">
              Materials
              {courseFilterId ? (
                <span className="ml-1 text-sm font-semibold text-stone-500">
                  ({filteredMaterials.length})
                </span>
              ) : null}
            </h3>
            <div className="flex items-center gap-2">
              <Link
                href="/materials"
                className="text-xs font-semibold text-teal-800 underline-offset-2 hover:underline"
              >
                View all
              </Link>
              <AddCourseMaterialButton
                courseId={courseFilterId}
                courses={courses.map((course) => ({
                  id: course.id,
                  title: readableCourseTitle(course.title),
                }))}
                compact
                onAdded={() => router.refresh()}
              />
            </div>
          </div>
          {filteredMaterials.length === 0 ? (
            courseFilterId ? (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-5 py-8 text-center">
                <p className="font-semibold text-stone-900">No materials for this class yet</p>
                <p className="mt-2 text-sm text-stone-600">
                  Photo a syllabus (OCR → topics) or upload a PDF to fill this class.
                </p>
              </div>
            ) : (
              <LockerEmptyState />
            )
          ) : (
            <MaterialsSelectableList
              variant="locker"
              materials={filteredMaterials.map((material) => ({
                id: material.id,
                title: material.title,
                type: material.type,
                courseId: material.courseId,
                courseLabel: material.courseTitle,
                subtitle: material.courseTitle,
              }))}
            />
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
