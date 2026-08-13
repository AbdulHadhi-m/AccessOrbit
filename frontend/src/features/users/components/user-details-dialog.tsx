"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { UserDto } from "@/types/users";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDto;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="break-all text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

export function UserDetailsDialog({ open, onOpenChange, user }: UserDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <dl className="divide-y">
          <div className="flex items-start justify-between gap-4 py-1.5">
            <dt className="shrink-0 text-sm text-muted-foreground">Status</dt>
            <dd>
              <StatusBadge status={user.status} />
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-1.5">
            <dt className="text-sm text-muted-foreground">Roles</dt>
            <dd className="flex flex-wrap gap-1">
              {user.roles.length === 0 && (
                <span className="text-sm text-muted-foreground">No roles</span>
              )}
              {user.roles.map((role) => (
                <Badge key={role.id} variant="secondary">
                  {role.name}
                </Badge>
              ))}
            </dd>
          </div>
          <DetailRow label="Created" value={formatDateTime(user.createdAt)} />
          <DetailRow label="Last updated" value={formatDateTime(user.updatedAt)} />
          <DetailRow label="Last login" value={formatDateTime(user.lastLoginAt)} />
          <DetailRow label="User ID" value={user.id} />
        </dl>
      </DialogContent>
    </Dialog>
  );
}