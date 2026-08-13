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
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
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
  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-lg",
            ACCENT_STYLES[accent]
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : error ? (
          <p className="text-sm text-muted-foreground">Could not load</p>
        ) : (
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {value !== undefined ? formatValue(value) : "—"}
          </p>
        )}
        {description && <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
