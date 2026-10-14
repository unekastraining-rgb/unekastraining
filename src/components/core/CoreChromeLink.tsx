import type { ReactNode } from "react";

/**
 * Optional path link for touch Core chrome only.
 * Desktop should use CoreChromeAction (no navigation / no refresh).
 */
export function CoreChromeLink({
  href,
  children,
  className = "",
  title,
  "aria-label": ariaLabel,
  pressed = false,
  hardNav = true,
}: {
  href: string;
  patch?: Record<string, string | null>;
  children: ReactNode;
  className?: string;
  title?: string;
  "aria-label"?: string;
  pressed?: boolean;
  /** When false, plain link. Default true for touch path chrome. */
  hardNav?: boolean;
}) {
  return (
    <a
      href={href}
      {...(hardNav ? { "data-core-hard-nav": "1" } : {})}
      aria-pressed={pressed || undefined}
      aria-label={ariaLabel}
      title={title}
      data-core-chrome-action="1"
      className={className}
      style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
    >
      <span className="pointer-events-none inline-flex items-center justify-center gap-1">
        {children}
      </span>
    </a>
  );
}
