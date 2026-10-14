/**
 * Soft school-context strip for Adaptive / learning surfaces.
 * Display continuity only — never evidence or mastery.
 */
export function SchoolContextStrip({
  title,
  courseTitle,
  dueDate,
}: {
  title: string;
  courseTitle?: string | null;
  dueDate?: string | null;
}) {
  const dueLabel = (() => {
    if (!dueDate) return null;
    const d = new Date(dueDate);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  })();

  return (
    <div
      data-school-context-strip
      data-school-context-not-mastery
      className="rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm text-stone-700"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
        School context
      </p>
      <p className="mt-0.5 font-semibold text-stone-900">{title}</p>
      <p className="mt-0.5 text-xs text-stone-500">
        {[courseTitle, dueLabel ? `Due ${dueLabel}` : null]
          .filter(Boolean)
          .join(" · ") || "Assignment context — not mastery"}
      </p>
    </div>
  );
}
