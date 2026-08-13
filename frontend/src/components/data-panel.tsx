import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataPanelProps {
  children: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DataPanel({ children, toolbar, footer, className }: DataPanelProps) {
  return (
    <Card className={cn("shadow-xs", className)}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {toolbar}
        <div className="data-table-shell">{children}</div>
        {footer}
      </CardContent>
    </Card>
  );
}
