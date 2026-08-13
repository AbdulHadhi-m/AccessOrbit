"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/config/env";
import { useSession } from "@/hooks/use-session";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, available: true },
  { label: "Users", href: "/users", icon: Users, available: false },
  { label: "Roles", href: "/roles", icon: Shield, available: false },
  { label: "Permissions", href: "/permissions", icon: KeyRound, available: false },
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

function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="mt-6 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        if (!item.available) {
          return (
            <span
              key={item.label}
              className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground/60"
              aria-disabled="true"
              title={`${item.label} management is coming soon`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </span>
              <Badge variant="outline">Soon</Badge>
            </span>
          );
        }
        return (
          <Link
            key={item.label}
            href={item.href}
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
        <Badge key={role.id} variant="secondary" className="hidden sm:inline-flex">
          {role.name}
        </Badge>
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
          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark />
          </div>
          <div className="hidden text-sm text-muted-foreground lg:block">
            Access Control &amp; Management
          </div>
          <UserSection onLoggedOut={() => router.replace("/login")} />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}