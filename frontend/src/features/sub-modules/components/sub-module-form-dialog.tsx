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
import { invalidate } from "@/lib/query/query-client";
import { toFieldErrors } from "@/lib/errors";
import { usePermissionError } from "@/hooks/use-permission";
import { subModulesService } from "../service";
import { useModuleOptions } from "@/features/modules/hooks";
import type { SubModuleDto } from "@/types/rbac";

const subModuleFormSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required.")
    .max(60, "Key must be 60 characters or fewer.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  order: z.coerce.number().int("Must be a whole number.").min(0, "Must be 0 or greater.").max(9999, "Must be 9999 or fewer."),
});

type FormValues = z.infer<typeof subModuleFormSchema>;
type FieldErrors = Partial<Record<keyof FormValues | "moduleId", string>>;

interface SubModuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subModule: SubModuleDto | null;
}

export function SubModuleFormDialog({ open, onOpenChange, subModule }: SubModuleFormDialogProps) {
  const isEditing = subModule !== null;
  const { data: moduleOptions, status: modulesStatus } = useModuleOptions();

  const [values, setValues] = useState<FormValues>({
    key: subModule?.key ?? "",
    name: subModule?.name ?? "",
    order: subModule?.order ?? 0,
  });
  const [moduleId, setModuleId] = useState(subModule?.moduleId ?? "");
  const [active, setActive] = useState(subModule?.active ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reportUpdateError = usePermissionError("Unable to update the sub-module.");
  const reportCreateError = usePermissionError("Unable to create the sub-module.");
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
        await subModulesService.update(subModule.id, {
          name: values.name.trim(),
          order: values.order,
          active,
        });
        toast.success("Sub-module updated");
        invalidate("sub-modules");
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

    const result = subModuleFormSchema.safeParse(values);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormValues;
        errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    if (!moduleId) {
      setFieldErrors((current) => ({ ...current, moduleId: "Select a module." }));
      return;
    }

    setSubmitting(true);
    try {
      await subModulesService.create({
        moduleId,
        key: result.data.key.trim(),
        name: result.data.name.trim(),
        order: result.data.order,
      });
      toast.success("Sub-module created");
      invalidate("sub-modules", "modules:hierarchy");
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
          <DialogTitle>{isEditing ? "Edit sub-module" : "Create sub-module"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the sub-module. The key and parent module cannot be changed."
              : "Create a sub-module inside an existing module."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="sub-module-module">Module</Label>
              <SelectField
                id="sub-module-module"
                value={moduleId}
                onValueChange={(value) => {
                  setModuleId(value);
                  setFieldErrors((current) => ({ ...current, moduleId: undefined }));
                  setSubmitError(null);
                }}
                options={moduleOptions?.map((module) => ({ value: module.id, label: module.name })) ?? []}
                placeholder={modulesStatus === "loading" ? "Loading modules..." : "Select a module"}
                disabled={modulesStatus !== "success" || submitting}
              />
              {fieldErrors.moduleId && (
                <p className="text-xs text-destructive">{fieldErrors.moduleId}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="sub-module-key">Key</Label>
            <Input
              id="sub-module-key"
              value={values.key}
              onChange={(event) => updateField("key", event.target.value)}
              placeholder="purchase-orders"
              disabled={isEditing || submitting}
              aria-invalid={Boolean(fieldErrors.key)}
              aria-describedby={fieldErrors.key ? "sub-module-key-error" : undefined}
            />
            {fieldErrors.key && (
              <p id="sub-module-key-error" className="text-xs text-destructive">
                {fieldErrors.key}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-module-name">Name</Label>
            <Input
              id="sub-module-name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "sub-module-name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="sub-module-name-error" className="text-xs text-destructive">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-module-order">Order</Label>
            <Input
              id="sub-module-order"
              type="number"
              min={0}
              max={9999}
              value={values.order}
              onChange={(event) => updateField("order", event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.order)}
              aria-describedby={fieldErrors.order ? "sub-module-order-error" : undefined}
            />
            {fieldErrors.order && (
              <p id="sub-module-order-error" className="text-xs text-destructive">
                {fieldErrors.order}
              </p>
            )}
          </div>
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="sub-module-status">Status</Label>
              <SelectField
                id="sub-module-status"
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
                  : "Create sub-module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}