import Link from "next/link";

import { StudyHaulLogo } from "@/components/brand/StudyHaulLogo";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/study", label: "Study Hub" },
  { href: "/dashboard/telemetry", label: "Telemetry" },
];

export function AppNav() {
  return (
    <header className="border-b border-orange-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <StudyHaulLogo size={32} showWordmark />
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-stone-500 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
