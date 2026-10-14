import Link from "next/link";

import type { PlanningNavActive } from "./planning-nav-types";

export function HubPlanningNav({
  active,
}: {
  active?: PlanningNavActive;
}) {
  return (
    <nav className="hub-planning-nav flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-brand p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <NavPill href="/dashboard" label="Hub" isActive={active === "hub"} />
      <NavPill href="/study" label="Study" isActive={active === "study"} />
      <NavPill href="/core" label="Core" isActive={active === "core"} />
      <NavPill href="/calendar" label="Calendar" isActive={active === "calendar"} />
      <NavPill href="/resources" label="Resources" isActive={active === "resources"} />
    </nav>
  );
}

function NavPill({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      suppressHydrationWarning
      data-hub-chrome
      className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition touch-manipulation ${
        isActive ? "nav-pill-active shadow-sm" : "text-stone-600 planning-nav-hover"
      }`}
    >
      {label}
    </Link>
  );
}
