"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Blocks,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Shield,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS } from "@/config/permissions";
import { env } from "@/config/env";
import { usePermission } from "@/hooks/use-permission";
import { useSession } from "@/hooks/use-session";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { label: "Users", href: "/users", icon: Users, permission: PERMISSIONS.users.view },
  { label: "Roles", href: "/roles", icon: Shield, permission: PERMISSIONS.roles.view },
  { label: "Modules", href: "/modules", icon: Blocks, permission: PERMISSIONS.modules.view },
  { label: "Permissions", href: "/permissions", icon: KeyRound, permission: PERMISSIONS.permissions.view },
];

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 flex-col border-r p-4 lg:flex">
        <Skeleton className="h-8 w-40" />
        <div className="mt-8 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24" />
        </header>
        <main className="flex-1 p-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-4 h-32 w-full" />
        </main>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <span className="text-base font-semibold tracking-tight">AccessOrbit</span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hasPermission } = usePermission();

  return (
    <nav aria-label="Main navigation" className="mt-6 space-y-1">
      {navItems.map((item) => {
        if (item.permission && !hasPermission(item.permission)) {
          return null;
        }
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSection({ onLoggedOut }: { onLoggedOut: () => void }) {
  const { user, logout } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      onLoggedOut();
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      {user.roles.map((role) => (
        <span
          key={role.id}
          className="hidden rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground sm:inline-flex"
        >
          {role.name}
        </span>
      ))}
      <span className="hidden text-sm font-medium md:block">{user.name}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        disabled={loggingOut}
        aria-label="Sign out"
        title="Sign out"
      >
        {loggingOut ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <LogOut aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return <ShellSkeleton />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card/40 p-4 lg:flex">
        <BrandMark />
        <SidebarNav />
        <div className="mt-auto space-y-3">
          <Separator />
          <a
            href={`${env.apiUrl}/api/v1/docs`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            API documentation
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileNavOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </Button>
            <div className="lg:hidden">
              <BrandMark />
            </div>
          </div>
          <div className="hidden text-sm text-muted-foreground lg:block">
            Access Control &amp; Management
          </div>
          <UserSection onLoggedOut={() => router.replace("/login")} />
        </header>

        {mobileNavOpen && (
          <div
            id="mobile-navigation"
            className="border-b bg-card/60 px-4 py-2 backdrop-blur lg:hidden"
          >
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}