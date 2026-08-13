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
import { SelectField } from "@/components/data-table/select-field";
import { invalidate } from "@/stores/query-store";
import { toFieldErrors } from "@/lib/errors";
import { usePermissionError } from "@/hooks/use-permission";
import { modulesService } from "../service";
import type { ModuleDto } from "@/types/rbac";

const moduleFormSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required.")
    .max(60, "Key must be 60 characters or fewer.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer."),
  order: z.coerce.number().int("Must be a whole number.").min(0, "Must be 0 or greater.").max(9999, "Must be 9999 or fewer."),
});

type FormValues = z.infer<typeof moduleFormSchema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

interface ModuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: ModuleDto | null;
}

export function ModuleFormDialog({ open, onOpenChange, module }: ModuleFormDialogProps) {
  const isEditing = module !== null;

  const [values, setValues] = useState<FormValues>({
    key: module?.key ?? "",
    name: module?.name ?? "",
    description: module?.description ?? "",
    order: module?.order ?? 0,
  });
  const [active, setActive] = useState(module?.active ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reportUpdateError = usePermissionError("Unable to update the module.");
  const reportCreateError = usePermissionError("Unable to create the module.");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (isEditing) {
      setSubmitting(true);
      try {
        await modulesService.update(module.id, {
          name: values.name.trim(),
          description: values.description || undefined,
          order: values.order,
          active,
        });
        toast.success("Module updated");
        invalidate("modules", "modules:hierarchy");
        onOpenChange(false);
      } catch (error) {
        const fieldErrorsMap = toFieldErrors(error);
        if (fieldErrorsMap) {
          setFieldErrors(fieldErrorsMap);
        } else {
          setSubmitError(reportUpdateError(error));
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const result = moduleFormSchema.safeParse(values);
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
      await modulesService.create({
        key: result.data.key.trim(),
        name: result.data.name.trim(),
        description: result.data.description || undefined,
        order: result.data.order,
      });
      toast.success("Module created");
      invalidate("modules", "modules:hierarchy");
      onOpenChange(false);
    } catch (error) {
      const fieldErrorsMap = toFieldErrors(error);
      if (fieldErrorsMap) {
        setFieldErrors(fieldErrorsMap);
      } else {
        setSubmitError(reportCreateError(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit module" : "Create module"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the module. The key cannot be changed."
              : "Create a new module. Add sub-modules, operations, and permissions to it afterwards."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="module-key">Key</Label>
            <Input
              id="module-key"
              value={values.key}
              onChange={(event) => updateField("key", event.target.value)}
              placeholder="procurement"
              disabled={isEditing || submitting}
              aria-invalid={Boolean(fieldErrors.key)}
              aria-describedby={fieldErrors.key ? "module-key-error" : undefined}
            />
            {fieldErrors.key && (
              <p id="module-key-error" className="text-xs text-destructive">
                {fieldErrors.key}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-name">Name</Label>
            <Input
              id="module-name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "module-name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="module-name-error" className="text-xs text-destructive">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-description">Description</Label>
            <Input
              id="module-description"
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? "module-description-error" : undefined}
            />
            {fieldErrors.description && (
              <p id="module-description-error" className="text-xs text-destructive">
                {fieldErrors.description}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-order">Order</Label>
            <Input
              id="module-order"
              type="number"
              min={0}
              max={9999}
              value={values.order}
              onChange={(event) => updateField("order", event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.order)}
              aria-describedby={fieldErrors.order ? "module-order-error" : undefined}
            />
            {fieldErrors.order && (
              <p id="module-order-error" className="text-xs text-destructive">
                {fieldErrors.order}
              </p>
            )}
          </div>
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="module-status">Status</Label>
              <SelectField
                id="module-status"
                value={active ? "active" : "inactive"}
                onValueChange={(value) => setActive(value === "active")}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                disabled={submitting}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
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
                  : "Create module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}