import { Badge } from "@/components/ui/badge";

export type StatusValue = "active" | "inactive" | "suspended";

interface StatusBadgeProps {
  status: StatusValue;
}

const VARIANT_MAP = {
  active: "default" as const,
  inactive: "outline" as const,
  suspended: "destructive" as const,
};

const LABEL_MAP = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={VARIANT_MAP[status]}>{LABEL_MAP[status]}</Badge>;
}