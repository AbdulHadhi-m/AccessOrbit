"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField } from "@/components/data-table/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { invalidate } from "@/lib/query/query-client";
import { toErrorMessage, toFieldErrors } from "@/lib/errors";
import { usersService } from "../service";
import { useRoleOptions } from "@/features/roles/hooks";
import type { UserStatus } from "@/types/auth";
import type { UserDto } from "@/types/users";

const userFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name must be 120 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address.").max(254, "Email is too long."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128, "Password must be 128 characters or fewer."),
});

type FormValues = z.infer<typeof userFormSchema>;
type FieldErrors = Partial<Record<keyof FormValues | "roleIds", string>>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDto | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEditing = user !== null;
  const { data: roleOptions, status: rolesStatus } = useRoleOptions();

  const [values, setValues] = useState<FormValues>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
  });
  const [status, setStatus] = useState<UserStatus>(user?.status ?? "active");
  const [roleIds, setRoleIds] = useState<string[]>(user?.roles.map((role) => role.id) ?? []);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const toggleRole = (roleId: string) => {
    setRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]
    );
    setFieldErrors((current) => ({ ...current, roleIds: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (isEditing) {
      const next: { name?: string; email?: string; status?: UserStatus } = {};
      if (values.name !== user.name) next.name = values.name;
      if (values.email.trim() !== user.email) next.email = values.email.trim();
      if (status !== user.status) next.status = status;
      if (Object.keys(next).length === 0) {
        onOpenChange(false);
        return;
      }

      setSubmitting(true);
      try {
        await usersService.update(user.id, next);
        toast.success("User updated");
        invalidate("users");
        onOpenChange(false);
      } catch (error) {
        const fieldErrorsMap = toFieldErrors(error);
        if (fieldErrorsMap) {
          setFieldErrors(fieldErrorsMap);
        } else {
          setSubmitError(toErrorMessage(error, "Unable to update the user."));
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const result = userFormSchema.safeParse(values);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormValues;
        errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await usersService.create({
        name: result.data.name.trim(),
        email: result.data.email.trim(),
        password: result.data.password,
        roleIds,
      });
      toast.success("User created");
      invalidate("users");
      onOpenChange(false);
    } catch (error) {
      const fieldErrorsMap = toFieldErrors(error);
      if (fieldErrorsMap) {
        setFieldErrors(fieldErrorsMap);
      } else {
        setSubmitError(toErrorMessage(error, "Unable to create the user."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the user's profile information."
              : "Create a new user account. The user can sign in immediately."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "user-name-error" : undefined}
              disabled={submitting}
            />
            {fieldErrors.name && (
              <p id="user-name-error" className="text-xs text-destructive">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "user-email-error" : undefined}
              disabled={submitting}
            />
            {fieldErrors.email && (
              <p id="user-email-error" className="text-xs text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={values.password}
                onChange={(event) => updateField("password", event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "user-password-error" : undefined}
                disabled={submitting}
              />
              {fieldErrors.password && (
                <p id="user-password-error" className="text-xs text-destructive">
                  {fieldErrors.password}
                </p>
              )}
            </div>
          )}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="user-status">Status</Label>
              <SelectField
                id="user-status"
                value={status}
                onValueChange={(value) => setStatus(value as UserStatus)}
                options={[
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                ]}
                disabled={submitting}
              />
            </div>
          )}
          <div className="space-y-2">
            <span className="text-sm font-medium">
              Roles {isEditing && <span className="text-muted-foreground">(use the roles action for existing users)</span>}
            </span>
            {rolesStatus === "loading" && <Skeleton className="h-28 w-full" />}
            {rolesStatus === "error" && (
              <p className="text-xs text-destructive">Unable to load roles.</p>
            )}
            {rolesStatus === "success" && (
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border p-2" role="group" aria-label="Roles">
                {roleOptions?.length === 0 && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No roles available. Create roles first.</p>
                )}
                {roleOptions?.map((role) => (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      checked={roleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                      disabled={submitting}
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">{role.name}</span>
                      <span className="text-xs text-muted-foreground">{role.slug}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {fieldErrors.roleIds && (
              <p className="text-xs text-destructive">{fieldErrors.roleIds}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              {submitting ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}