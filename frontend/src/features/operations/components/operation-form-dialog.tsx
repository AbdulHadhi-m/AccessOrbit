"use client";

import { useMemo, useState, type FormEvent } from "react";
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
import { operationsService } from "../service";
import { useModuleOptions } from "@/features/modules/hooks";
import { useSubModuleOptions } from "@/features/sub-modules/hooks";
import type { OperationDto } from "@/types/rbac";

const operationFormSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required.")
    .max(60, "Key must be 60 characters or fewer.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  order: z.coerce.number().int("Must be a whole number.").min(0, "Must be 0 or greater.").max(9999, "Must be 9999 or fewer."),
});

type FormValues = z.infer<typeof operationFormSchema>;
type FieldErrors = Partial<Record<keyof FormValues | "moduleId" | "subModuleId", string>>;

interface OperationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: OperationDto | null;
}

export function OperationFormDialog({ open, onOpenChange, operation }: OperationFormDialogProps) {
  const isEditing = operation !== null;
  const { data: moduleOptions, status: modulesStatus } = useModuleOptions();
  const { data: subModuleOptions, status: subModulesStatus } = useSubModuleOptions();

  const [values, setValues] = useState<FormValues>({
    key: operation?.key ?? "",
    name: operation?.name ?? "",
    order: operation?.order ?? 0,
  });
  const [moduleId, setModuleId] = useState(operation?.moduleId ?? "");
  const [subModuleId, setSubModuleId] = useState<string>(operation?.subModuleId ?? "");
  const [active, setActive] = useState(operation?.active ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reportUpdateError = usePermissionError("Unable to update the operation.");
  const reportCreateError = usePermissionError("Unable to create the operation.");
  const [submitting, setSubmitting] = useState(false);

  const moduleSubModules = useMemo(
    () =>
      moduleId
        ? (subModuleOptions ?? []).filter((subModule) => subModule.moduleId === moduleId)
        : [],
    [moduleId, subModuleOptions]
  );

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const handleModuleChange = (value: string) => {
    setModuleId(value);
    setSubModuleId("");
    setFieldErrors((current) => ({ ...current, moduleId: undefined, subModuleId: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (isEditing) {
      setSubmitting(true);
      try {
        await operationsService.update(operation.id, {
          name: values.name.trim(),
          order: values.order,
          active,
        });
        toast.success("Operation updated");
        invalidate("operations", "modules:hierarchy");
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

    const result = operationFormSchema.safeParse(values);
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
      await operationsService.create({
        moduleId,
        subModuleId: subModuleId || null,
        key: result.data.key.trim(),
        name: result.data.name.trim(),
        order: result.data.order,
      });
      toast.success("Operation created");
      invalidate("operations", "modules:hierarchy");
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
          <DialogTitle>{isEditing ? "Edit operation" : "Create operation"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the operation. The key and its placement cannot be changed."
              : "Create an operation at module level or inside a sub-module."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}
          {!isEditing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="operation-module">Module</Label>
                <SelectField
                  id="operation-module"
                  value={moduleId}
                  onValueChange={handleModuleChange}
                  options={moduleOptions?.map((module) => ({ value: module.id, label: module.name })) ?? []}
                  placeholder={modulesStatus === "loading" ? "Loading modules..." : "Select a module"}
                  disabled={modulesStatus !== "success" || submitting}
                />
                {fieldErrors.moduleId && (
                  <p className="text-xs text-destructive">{fieldErrors.moduleId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="operation-sub-module">
                  Sub-module <span className="text-muted-foreground">(optional)</span>
                </Label>
                <SelectField
                  id="operation-sub-module"
                  value={subModuleId || "__top__"}
                  onValueChange={(value) => {
                    setSubModuleId(value === "__top__" ? "" : value);
                    setFieldErrors((current) => ({ ...current, subModuleId: undefined }));
                    setSubmitError(null);
                  }}
                  options={[
                    ...moduleSubModules.map((subModule) => ({
                      value: subModule.id,
                      label: subModule.name,
                    })),
                    ...(moduleId ? [{ value: "__top__", label: "None (top level)" }] : []),
                  ]}
                  placeholder={
                    !moduleId
                      ? "Select a module first"
                      : subModulesStatus === "loading"
                        ? "Loading sub-modules..."
                        : "Select a sub-module or none"
                  }
                  disabled={!moduleId || subModulesStatus !== "success" || submitting}
                />
                {fieldErrors.subModuleId && (
                  <p className="text-xs text-destructive">{fieldErrors.subModuleId}</p>
                )}
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="operation-key">Key</Label>
            <Input
              id="operation-key"
              value={values.key}
              onChange={(event) => updateField("key", event.target.value)}
              placeholder="view"
              disabled={isEditing || submitting}
              aria-invalid={Boolean(fieldErrors.key)}
              aria-describedby={fieldErrors.key ? "operation-key-error" : undefined}
            />
            {fieldErrors.key && (
              <p id="operation-key-error" className="text-xs text-destructive">
                {fieldErrors.key}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="operation-name">Name</Label>
            <Input
              id="operation-name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "operation-name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="operation-name-error" className="text-xs text-destructive">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="operation-order">Order</Label>
            <Input
              id="operation-order"
              type="number"
              min={0}
              max={9999}
              value={values.order}
              onChange={(event) => updateField("order", event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.order)}
              aria-describedby={fieldErrors.order ? "operation-order-error" : undefined}
            />
            {fieldErrors.order && (
              <p id="operation-order-error" className="text-xs text-destructive">
                {fieldErrors.order}
              </p>
            )}
          </div>
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="operation-status">Status</Label>
              <SelectField
                id="operation-status"
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
                  : "Create operation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}