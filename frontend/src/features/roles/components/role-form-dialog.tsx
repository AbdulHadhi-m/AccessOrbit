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
import { Textarea } from "@/components/ui/textarea";
import { invalidate } from "@/stores/query-store";
import { toFieldErrors } from "@/lib/errors";
import { usePermissionError } from "@/hooks/use-permission";
import { rolesService } from "../service";
import type { RoleDto } from "@/types/roles";

const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(120, "Name must be 120 characters or fewer.")
    .regex(/^[a-zA-Z0-9]+(?:[ -][a-zA-Z0-9]+)*$/, "Use letters, numbers, spaces, or hyphens."),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer."),
});

type FormValues = z.infer<typeof roleFormSchema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDto | null;
}

export function RoleFormDialog({ open, onOpenChange, role }: RoleFormDialogProps) {
  const isEditing = role !== null;

  const [values, setValues] = useState<FormValues>({
    name: role?.name ?? "",
    description: role?.description ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reportSubmitError = usePermissionError(
    isEditing ? "Unable to update the role." : "Unable to create the role."
  );

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const result = roleFormSchema.safeParse(values);
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
      if (isEditing) {
        await rolesService.update(role.id, {
          name: result.data.name.trim(),
          description: result.data.description || undefined,
        });
        toast.success("Role updated");
      } else {
        await rolesService.create({
          name: result.data.name.trim(),
          description: result.data.description || undefined,
        });
        toast.success("Role created");
      }
      invalidate("roles");
      onOpenChange(false);
    } catch (error) {
      const fieldErrorsMap = toFieldErrors(error);
      if (fieldErrorsMap) {
        setFieldErrors(fieldErrorsMap);
      } else {
        setSubmitError(
          reportSubmitError(error)
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the role's name or description."
              : "Create a new role. Assign permissions to it from the roles list."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "role-name-error" : undefined}
              disabled={submitting}
            />
            {fieldErrors.name && (
              <p id="role-name-error" className="text-xs text-destructive">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={3}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? "role-description-error" : undefined}
              disabled={submitting}
            />
            {fieldErrors.description && (
              <p id="role-description-error" className="text-xs text-destructive">
                {fieldErrors.description}
              </p>
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
              {submitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save changes"
                  : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}