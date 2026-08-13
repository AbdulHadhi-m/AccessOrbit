"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { invalidate } from "@/lib/query/query-client";
import { toErrorMessage } from "@/lib/errors";
import { usersService } from "../service";
import { useRoleOptions } from "@/features/roles/hooks";
import type { UserDto } from "@/types/users";

interface UserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDto;
}

export function UserRolesDialog({ open, onOpenChange, user }: UserRolesDialogProps) {
  const { data: roleOptions, status: rolesStatus } = useRoleOptions();
  const [selected, setSelected] = useState<string[]>(user.roles.map((role) => role.id));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleRole = (roleId: string) => {
    setSelected((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]
    );
    setError(null);
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      setError("At least one role is required.");
      return;
    }
    setSaving(true);
    try {
      await usersService.setRoles(user.id, { roleIds: selected });
      toast.success("Roles updated");
      invalidate("users");
      onOpenChange(false);
    } catch (error) {
      setError(toErrorMessage(error, "Unable to update roles."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage roles</DialogTitle>
          <DialogDescription>
            Assign roles to <span className="font-medium text-foreground">{user.name}</span>. The
            role set is replaced with your selection.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {rolesStatus === "loading" && <Skeleton className="h-40 w-full" />}
        {rolesStatus === "error" && (
          <p className="text-sm text-destructive">Unable to load roles.</p>
        )}
        {rolesStatus === "success" && (
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-2" role="group" aria-label="Assignable roles">
            {roleOptions?.length === 0 && (
              <p className="px-1 py-2 text-sm text-muted-foreground">No roles available. Create roles first.</p>
            )}
            {roleOptions?.map((role) => (
              <label
                key={role.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={selected.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                  disabled={saving}
                />
                <span className="flex flex-col">
                  <span className="font-medium">{role.name}</span>
                  <span className="text-xs text-muted-foreground">{role.slug}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || rolesStatus !== "success"}>
            {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
            {saving ? "Saving..." : "Save roles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}