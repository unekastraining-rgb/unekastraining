import {
  Backpack,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Settings,
} from "lucide-react";

import type { HubTab } from "./types";

export const hubTabs: {
  id: HubTab;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  mobile?: boolean;
}[] = [
  {
    id: "hub",
    label: "Hub",
    description: "Dashboard & progress",
    icon: LayoutDashboard,
    mobile: true,
  },
  {
    id: "classes",
    label: "Classes",
    description: "Your courses",
    icon: GraduationCap,
    mobile: true,
  },
  {
    id: "locker",
    label: "Locker",
    description: "Materials & study tools",
    icon: Backpack,
    mobile: true,
  },
  {
    id: "chat",
    label: "Chat",
    description: "AI study copilot",
    icon: MessageCircle,
    mobile: true,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Colors, LMS & planner mode",
    icon: Settings,
    mobile: false,
  },
];
