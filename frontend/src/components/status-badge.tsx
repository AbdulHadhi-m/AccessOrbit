import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusValue = "active" | "inactive" | "suspended";

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

const CONFIG: Record<
  StatusValue,
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Active",
    className: "bg-success/15 text-success border-success/30 font-medium",
    dot: "bg-success animate-pulse",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border font-medium",
    dot: "bg-muted-foreground/60",
  },
  suspended: {
    label: "Suspended",
    className: "bg-destructive/15 text-destructive border-destructive/30 font-medium",
    dot: "bg-destructive animate-pulse",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = CONFIG[status];

  return (
    <Badge variant="outline" className={cn("gap-1.5 px-2 py-0.5 text-xs rounded-full", config.className, className)}>
      <span
        className={cn("size-1.5 shrink-0 rounded-full", config.dot)}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  );
}
