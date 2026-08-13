import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Blocks,
  KeyRound,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react";
import { PERMISSIONS } from "@/config/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: string | null;
}

export interface NavSection {
  label: string | null;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: null,
      },
    ],
  },
  {
    label: "Access Management",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        permission: PERMISSIONS.users.view,
      },
      {
        label: "Roles",
        href: "/roles",
        icon: Shield,
        permission: PERMISSIONS.roles.view,
      },
      {
        label: "Modules",
        href: "/modules",
        icon: Blocks,
        permission: PERMISSIONS.modules.view,
      },
      {
        label: "Permissions",
        href: "/permissions",
        icon: KeyRound,
        permission: PERMISSIONS.permissions.view,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: Activity,
        permission: PERMISSIONS.audit.view,
      },
    ],
  },
];
