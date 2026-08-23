"use client";

import {
  Accessibility,
  BookOpen,
  Briefcase,
  DollarSign,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  HelpCircle,
  Laptop,
  Library,
  Link2,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { ResourceIconId } from "@/lib/resources/types";

const ICON_MAP: Record<ResourceIconId, LucideIcon> = {
  link: Link2,
  book: BookOpen,
  library: Library,
  graduation: GraduationCap,
  users: Users,
  laptop: Laptop,
  dollar: DollarSign,
  briefcase: Briefcase,
  heart: Heart,
  search: Search,
  accessibility: Accessibility,
  globe: Globe,
  file: FileText,
  help: HelpCircle,
};

export function ResourceIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: string;
  className?: string;
}) {
  const Icon = ICON_MAP[icon as ResourceIconId] ?? Link2;
  return <Icon className={className} />;
}
