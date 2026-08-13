import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  value?: number;
  loading?: boolean;
  error?: boolean;
  formatValue?: (value: number) => string;
  accent?: "default" | "success" | "warning" | "destructive";
}

const ACCENT_STYLES = {
  default: {
    bg: "bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200",
    border: "border-t-2 border-t-primary/60",
  },
  success: {
    bg: "bg-success/15 text-success group-hover:scale-110 transition-transform duration-200",
    border: "border-t-2 border-t-success/70",
  },
  warning: {
    bg: "bg-warning/15 text-warning group-hover:scale-110 transition-transform duration-200",
    border: "border-t-2 border-t-warning/70",
  },
  destructive: {
    bg: "bg-destructive/15 text-destructive group-hover:scale-110 transition-transform duration-200",
    border: "border-t-2 border-t-destructive/70",
  },
};

export function StatCard({
  title,
  icon: Icon,
  description,
  value,
  loading = false,
  error = false,
  formatValue = (current) => current.toLocaleString(),
  accent = "default",
}: StatCardProps) {
  const style = ACCENT_STYLES[accent];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40",
        style.border
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-1">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
            style.bg
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        {loading ? (
          <Skeleton className="h-8 w-20 rounded-md" />
        ) : error ? (
          <p className="text-sm text-muted-foreground">Could not load</p>
        ) : (
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {value !== undefined ? formatValue(value) : "—"}
          </p>
        )}
        {description && (
          <p className="mt-1 text-xs text-muted-foreground/80 truncate font-medium">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
