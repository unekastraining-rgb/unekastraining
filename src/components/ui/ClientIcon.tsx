import type { LucideIcon } from "lucide-react";

/** Lucide SVGs can mismatch between SSR and hydration; wrap at the call site. */
export function ClientIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span className="inline-flex shrink-0" suppressHydrationWarning aria-hidden>
      <Icon className={className} />
    </span>
  );
}
