import Link from "next/link";

import type { PlanningNavActive } from "./planning-nav-types";

export function HubPlanningNav({
  active,
}: {
  active?: PlanningNavActive;
}) {
  return (
    <nav className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-brand bg-brand-soft/80 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        isActive
          ? "bg-white shadow-sm ring-1 text-brand"
          : "text-stone-600 hover:text-stone-900"
      }`}
      style={
        isActive
          ? { color: "var(--sh-primary)", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--sh-primary) 22%, transparent)" }
          : undefined
      }
    >
      {label}
    </Link>
  );
}
