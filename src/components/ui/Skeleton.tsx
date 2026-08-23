"use client";

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function CalendarGridSkeleton() {
  return (
    <div className="card-soft overflow-hidden p-4">
      <div className="mb-4 flex gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}
