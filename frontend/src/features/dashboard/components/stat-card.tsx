import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  value?: number;
  loading?: boolean;
  error?: boolean;
  formatValue?: (value: number) => string;
}

export function StatCard({
  title,
  icon: Icon,
  description,
  value,
  loading = false,
  error = false,
  formatValue = (current) => current.toLocaleString(),
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : error ? (
          <p className="text-sm text-muted-foreground">Could not load</p>
        ) : (
          <p className="text-2xl font-semibold tracking-tight">
            {value !== undefined ? formatValue(value) : "—"}
          </p>
        )}
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}