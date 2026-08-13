"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Blocks,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  Menu,
  Search,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageBreadcrumb, getRouteBreadcrumbs } from "@/components/page-breadcrumb";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchDialog } from "@/components/ui/search-dialog";
import { PERMISSIONS } from "@/config/permissions";
import { env } from "@/config/env";
import { usePermission } from "@/hooks/use-permission";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "accessorbit-sidebar-collapsed";
const SEARCH_SHORTCUT_KEY = "k";

function SearchButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="hidden h-8 gap-1.5 px-2 text-muted-foreground transition-colors hover:bg-muted md:flex"
      aria-label="Global search"
    >
      <Search className="size-4" aria-hidden="true" />
      <span className="text-sm">Search</span>
    </Button>
  );
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { label: "Users", href: "/users", icon: Users, permission: PERMISSIONS.users.view },
  { label: "Roles", href: "/roles", icon: Shield, permission: PERMISSIONS.roles.view },
  { label: "Modules", href: "/modules", icon: Blocks, permission: PERMISSIONS.modules.view },
  { label: "Permissions", href: "/permissions", icon: KeyRound, permission: PERMISSIONS.permissions.view },
  { label: "Audit Logs", href: "/audit-logs", icon: Activity, permission: PERMISSIONS.audit.view },
];

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Skeleton className="h-8 w-40" />
        <div className="mt-8 space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-24" />
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-6 h-32 w-full" />
        </main>
      </div>
    </div>
  );
}

function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-3 transition-opacity hover:opacity-90",
        collapsed && "justify-center"
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#6B38C3] text-white shadow-md shadow-purple-500/25">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </span>
      {!collapsed && (
        <div className="min-w-0">
          <span className="block truncate text-base font-bold tracking-tight text-sidebar-foreground">
            AccessOrbit
          </span>
          <span className="block truncate text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Operations Hub
          </span>
        </div>
      )}
    </Link>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const className = cn(
    "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
    collapsed && "justify-center px-2.5",
    active
      ? "bg-[#6B38C3] text-white font-semibold shadow-md shadow-purple-500/25"
      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
  );

  const content = (
    <>
      <Icon
        className={cn("size-4 shrink-0 transition-transform duration-150 group-hover:scale-110", active ? "text-white" : "text-sidebar-foreground/60")}
        aria-hidden="true"
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={className}
            />
          }
        >
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { hasPermission } = usePermission();

  return (
    <nav aria-label="Main navigation" className="mt-6 flex-1 space-y-0.5">
      {navItems.map((item) => {
        if (item.permission && !hasPermission(item.permission)) {
          return null;
        }
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <NavLink
            key={item.label}
            item={item}
            active={active}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const className = cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
    collapsed && "justify-center px-2"
  );

  const content = (
    <>
      <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">API documentation</span>}
    </>
  );

  return (
    <div className="mt-auto space-y-3">
      <Separator className="bg-sidebar-border" />
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={`${env.apiUrl}/api/v1/docs`}
                target="_blank"
                rel="noreferrer"
                className={className}
              />
            }
          >
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">API documentation</TooltipContent>
        </Tooltip>
      ) : (
        <a
          href={`${env.apiUrl}/api/v1/docs`}
          target="_blank"
          rel="noreferrer"
          className={className}
        >
          {content}
        </a>
      )}
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    const down = (e: globalThis.KeyboardEvent) => {
      if (e.key === SEARCH_SHORTCUT_KEY && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [searchOpen]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  if (status === "loading") {
    return <ShellSkeleton />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  const breadcrumbs = getRouteBreadcrumbs(pathname);

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[4.25rem] p-3" : "w-60 p-4"
        )}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <BrandMark collapsed={collapsed} />
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        {collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className="mx-auto mt-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        )}
        <SidebarNav collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu aria-hidden="true" />
            </Button>
            <PageBreadcrumb items={breadcrumbs} className="hidden sm:flex" />
            <span className="truncate text-sm font-medium sm:hidden">
              {breadcrumbs[breadcrumbs.length - 1]?.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SearchButton onClick={() => setSearchOpen(true)} />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="page-container">{children}</div>
        </main>
      </div>

      <SearchDialog isOpen={searchOpen} onOpenChange={setSearchOpen} />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetHeader className="border-b border-sidebar-border px-4 py-4">
            <SheetTitle className="text-left">
              <BrandMark />
            </SheetTitle>
          </SheetHeader>
          <div className="flex h-[calc(100%-4.5rem)] flex-col px-3 py-2">
            <SidebarNav collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
            <SidebarFooter collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
