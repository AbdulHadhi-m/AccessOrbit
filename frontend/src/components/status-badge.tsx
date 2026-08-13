import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusValue = "active" | "inactive" | "suspended";

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

const CONFIG: Record<
  StatusValue,
  { label: string; variant: "default" | "outline" | "destructive"; dot: string }
> = {
  active: {
    label: "Active",
    variant: "default",
    dot: "bg-success",
  },
  inactive: {
    label: "Inactive",
    variant: "outline",
    dot: "bg-muted-foreground",
  },
  suspended: {
    label: "Suspended",
    variant: "destructive",
    dot: "bg-destructive",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = CONFIG[status];

  return (
    <Badge variant={config.variant} className={cn("gap-1.5 font-normal", className)}>
      <span
        className={cn("size-1.5 shrink-0 rounded-full", config.dot)}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  );
}
