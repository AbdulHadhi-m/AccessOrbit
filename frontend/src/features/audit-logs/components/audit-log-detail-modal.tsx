"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { AuditLogDto } from "@/types/audit";

interface AuditLogDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLogDto | null;
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between py-1.5 border-b border-border/50 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-all text-xs font-mono font-medium text-foreground sm:text-right">
        {value || "—"}
      </span>
    </div>
  );
}

export function AuditLogDetailModal({ open, onOpenChange, log }: AuditLogDetailModalProps) {
  if (!log) return null;

  const formattedDate = new Date(log.createdAt).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "medium",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="font-mono text-base">{log.action}</DialogTitle>
            <Badge variant={log.status === "success" ? "default" : "destructive"}>
              {log.status}
            </Badge>
          </div>
          <DialogDescription>{formattedDate}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-medium text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
              Actor Details
            </h4>
            <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1">
              <DetailItem label="Actor Name" value={log.actor?.name} />
              <DetailItem label="Actor Email" value={log.actor?.email} />
              <DetailItem label="Actor ID" value={log.actor?.id} />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
              Event Context
            </h4>
            <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1">
              <DetailItem label="Category" value={log.category} />
              <DetailItem label="Target Type" value={log.targetType} />
              <DetailItem label="Target ID" value={log.targetId} />
              <DetailItem label="IP Address" value={log.ipAddress} />
              <DetailItem label="User Agent" value={log.userAgent} />
              <DetailItem label="Request ID" value={log.requestId} />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
              Sanitized Payload / Details
            </h4>
            <pre className="max-h-56 overflow-auto rounded-lg border bg-zinc-950 p-3 font-mono text-[11px] text-zinc-100 dark:bg-zinc-900">
              {JSON.stringify(log.details || {}, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
