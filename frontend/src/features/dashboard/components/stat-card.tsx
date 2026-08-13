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

const ACCENT_GRADIENTS = {
  default: "from-[#6B38C3]/80 via-[#7C3AED]/75 to-[#4C1D95]/80 text-white shadow-purple-500/15 border-white/10 dark:border-white/5",
  success: "from-[#6D28D9]/80 via-[#7C3AED]/75 to-[#4338CA]/80 text-white shadow-purple-500/15 border-white/10 dark:border-white/5",
  warning: "from-[#7E22CE]/80 via-[#6B38C3]/75 to-[#5B21B6]/80 text-white shadow-purple-500/15 border-white/10 dark:border-white/5",
  destructive: "from-[#5B21B6]/80 via-[#6B38C3]/75 to-[#4C1D95]/80 text-white shadow-purple-500/15 border-white/10 dark:border-white/5",
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
  const gradientClass = ACCENT_GRADIENTS[accent];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-1.5 shadow-md backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/25",
        gradientClass
      )}
    >
      {/* Subtle watermark background icon */}
      <Icon className="absolute -right-3 -bottom-3 size-24 text-white/5 transition-transform duration-300 group-hover:scale-110 pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white/85">
          {title}
        </CardTitle>
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white shadow-xs transition-transform duration-200 group-hover:scale-110">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        {loading ? (
          <Skeleton className="h-8 w-20 bg-white/20 rounded-md" />
        ) : error ? (
          <p className="text-sm text-white/80">Could not load</p>
        ) : (
          <p className="text-3xl font-extrabold tracking-tight tabular-nums text-white drop-shadow-xs">
            {value !== undefined ? formatValue(value) : "—"}
          </p>
        )}
        {description && (
          <p className="mt-1 text-xs font-medium text-white/80 truncate">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
