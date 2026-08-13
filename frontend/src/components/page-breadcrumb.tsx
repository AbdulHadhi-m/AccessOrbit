"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(isLast ? "font-medium text-foreground" : "text-muted-foreground")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const ROUTE_BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  "/dashboard": [{ label: "Dashboard" }],
  "/users": [{ label: "Dashboard", href: "/dashboard" }, { label: "Users" }],
  "/roles": [{ label: "Dashboard", href: "/dashboard" }, { label: "Roles" }],
  "/modules": [{ label: "Dashboard", href: "/dashboard" }, { label: "Modules" }],
  "/permissions": [{ label: "Dashboard", href: "/dashboard" }, { label: "Permissions" }],
  "/audit-logs": [{ label: "Dashboard", href: "/dashboard" }, { label: "Audit Logs" }],
};

export function getRouteBreadcrumbs(pathname: string): BreadcrumbItem[] {
  return ROUTE_BREADCRUMBS[pathname] ?? [{ label: "Dashboard", href: "/dashboard" }];
}
