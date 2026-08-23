"use client";

interface CourseFilterBarProps {
  courses: Array<{ id: string; title: string; color: string | null }>;
  selectedCourseId: string | null;
  onChange: (courseId: string | null) => void;
}

export function CourseFilterBar({
  courses,
  selectedCourseId,
  onChange,
}: CourseFilterBarProps) {
  if (courses.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
        Class
      </span>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
          selectedCourseId === null
            ? "bg-stone-900 text-white"
            : "border border-brand bg-white text-stone-700 hover:bg-brand-soft"
        }`}
      >
        All
      </button>
      {courses.map((course) => {
        const selected = selectedCourseId === course.id;
        return (
          <button
            key={course.id}
            type="button"
            onClick={() => onChange(course.id)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              selected
                ? "bg-stone-900 text-white"
                : "border border-brand bg-white text-stone-700 hover:bg-brand-soft"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: course.color ?? "#ea580c" }}
            />
            <span className="max-w-[10rem] truncate">{course.title}</span>
          </button>
        );
      })}
    </div>
  );
}
