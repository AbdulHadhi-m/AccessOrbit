"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortHeaderProps {
  label: string;
  sortKey: string;
  sort: string | undefined;
  order: "asc" | "desc" | undefined;
  onSortChange: (sortKey: string, order: "asc" | "desc") => void;
  className?: string;
}

export function SortHeader({ label, sortKey, sort, order, onSortChange, className }: SortHeaderProps) {
  const active = sort === sortKey;
  const nextOrder: "asc" | "desc" = active && order === "asc" ? "desc" : "asc";
  const Icon = active ? (order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSortChange(sortKey, nextOrder)}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50",
        className
      )}
      aria-label={`Sort by ${label} ${active && order === "asc" ? "descending" : "ascending"}`}
    >
      {label}
      <Icon className={cn("size-3.5", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
    </button>
  );
}