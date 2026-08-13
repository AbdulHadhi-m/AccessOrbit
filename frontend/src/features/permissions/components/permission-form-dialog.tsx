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
import { invalidate } from "@/lib/query/query-client";
import { toFieldErrors } from "@/lib/errors";
import { usePermissionError } from "@/hooks/use-permission";
import { permissionsService } from "../service";
import { useModuleOptions } from "@/features/modules/hooks";
import { useSubModuleOptions } from "@/features/sub-modules/hooks";
import { useOperationOptions } from "@/features/operations/hooks";
import type { PermissionDto } from "@/types/rbac";

const PERMISSION_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/;

const permissionFormSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required.")
    .max(160, "Key must be 160 characters or fewer.")
    .regex(
      PERMISSION_KEY_PATTERN,
      "Use dotted keys like operation.verb (lowercase, hyphens allowed)."
    ),
  name: z.string().trim().min(1, "Name is required.").max(160, "Name is too long."),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer."),
});

type FormValues = z.infer<typeof permissionFormSchema>;
type FieldErrors = Partial<Record<keyof FormValues | "moduleId" | "operationId", string>>;

interface PermissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: PermissionDto | null;
}

export function PermissionFormDialog({ open, onOpenChange, permission }: PermissionFormDialogProps) {
  const isEditing = permission !== null;
  const { data: moduleOptions, status: modulesStatus } = useModuleOptions();
  const { data: subModuleOptions, status: subModulesStatus } = useSubModuleOptions();
  const { data: operationOptions, status: operationsStatus } = useOperationOptions();

  const [values, setValues] = useState<FormValues>({
    key: permission?.key ?? "",
    name: permission?.name ?? "",
    description: permission?.description ?? "",
  });
  const [moduleId, setModuleId] = useState(permission?.moduleId ?? "");
  const [subModuleId, setSubModuleId] = useState("");
  const [operationId, setOperationId] = useState(permission?.operationId ?? "");
  const [active, setActive] = useState(permission?.active ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reportUpdateError = usePermissionError("Unable to update the permission.");
  const reportCreateError = usePermissionError("Unable to create the permission.");
  const [submitting, setSubmitting] = useState(false);

  const selectedOperation = useMemo(
    () => (operationOptions ?? []).find((operation) => operation.id === operationId) ?? null,
    [operationId, operationOptions]
  );
  const effectiveSubModuleId =
    isEditing && selectedOperation ? selectedOperation.subModuleId ?? "" : subModuleId;

  const moduleSubModules = useMemo(
    () =>
      moduleId
        ? (subModuleOptions ?? []).filter((subModule) => subModule.moduleId === moduleId)
        : [],
    [moduleId, subModuleOptions]
  );

  const moduleOperations = useMemo(
    () =>
      (operationOptions ?? []).filter(
        (operation) =>
          operation.moduleId === moduleId &&
          (effectiveSubModuleId === ""
            ? operation.subModuleId === null
            : operation.subModuleId === effectiveSubModuleId)
      ),
    [effectiveSubModuleId, moduleId, operationOptions]
  );

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const handleModuleChange = (value: string) => {
    setModuleId(value);
    setSubModuleId("");
    setOperationId("");
    setFieldErrors((current) => ({ ...current, moduleId: undefined, operationId: undefined }));
    setSubmitError(null);
  };

  const handleSubModuleChange = (value: string) => {
    setSubModuleId(value === "__top__" ? "" : value);
    setOperationId("");
    setFieldErrors((current) => ({ ...current, operationId: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (isEditing) {
      setSubmitting(true);
      try {
        await permissionsService.update(permission.id, {
          name: values.name.trim(),
          description: values.description || undefined,
          active,
        });
        toast.success("Permission updated");
        invalidate("permissions", "roles", "modules:hierarchy");
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

    const result = permissionFormSchema.safeParse(values);
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
    if (!operationId) {
      setFieldErrors((current) => ({ ...current, operationId: "Select an operation." }));
      return;
    }

    setSubmitting(true);
    try {
      await permissionsService.create({
        key: result.data.key.trim(),
        name: result.data.name.trim(),
        description: result.data.description || undefined,
        moduleId,
        operationId,
      });
      toast.success("Permission created");
      invalidate("permissions", "modules:hierarchy");
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
          <DialogTitle>{isEditing ? "Edit permission" : "Create permission"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the permission. The key and its operation cannot be changed."
              : "Attach a permission to an operation. Permission keys look like module.operation."}
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
                <Label htmlFor="permission-module">Module</Label>
                <SelectField
                  id="permission-module"
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
                <Label htmlFor="permission-sub-module">
                  Sub-module <span className="text-muted-foreground">(optional)</span>
                </Label>
                <SelectField
                  id="permission-sub-module"
                  value={effectiveSubModuleId || "__top__"}
                  onValueChange={handleSubModuleChange}
                  options={[
                    ...(moduleId ? [{ value: "__top__", label: "None (top level)" }] : []),
                    ...moduleSubModules.map((subModule) => ({
                      value: subModule.id,
                      label: subModule.name,
                    })),
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="permission-operation">Operation</Label>
                <SelectField
                  id="permission-operation"
                  value={operationId}
                  onValueChange={(value) => {
                    setOperationId(value);
                    setFieldErrors((current) => ({ ...current, operationId: undefined }));
                    setSubmitError(null);
                  }}
                  options={moduleOperations.map((operation) => ({
                    value: operation.id,
                    label: `${operation.name} (${operation.key})`,
                  }))}
                  placeholder={
                    !moduleId
                      ? "Select a module first"
                      : operationsStatus === "loading"
                        ? "Loading operations..."
                        : moduleOperations.length === 0
                          ? "No operations for this placement"
                          : "Select an operation"
                  }
                  disabled={!moduleId || operationsStatus !== "success" || submitting}
                />
                {fieldErrors.operationId && (
                  <p className="text-xs text-destructive">{fieldErrors.operationId}</p>
                )}
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="permission-key">Key</Label>
            <Input
              id="permission-key"
              value={values.key}
              onChange={(event) => updateField("key", event.target.value)}
              placeholder="employees.view"
              disabled={isEditing || submitting}
              aria-invalid={Boolean(fieldErrors.key)}
              aria-describedby={fieldErrors.key ? "permission-key-error" : undefined}
            />
            {fieldErrors.key && (
              <p id="permission-key-error" className="text-xs text-destructive">
                {fieldErrors.key}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="permission-name">Name</Label>
            <Input
              id="permission-name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "permission-name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="permission-name-error" className="text-xs text-destructive">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="permission-description">Description</Label>
            <Input
              id="permission-description"
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? "permission-description-error" : undefined}
            />
            {fieldErrors.description && (
              <p id="permission-description-error" className="text-xs text-destructive">
                {fieldErrors.description}
              </p>
            )}
          </div>
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="permission-status">Status</Label>
              <SelectField
                id="permission-status"
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
                  : "Create permission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}