"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/config/permissions";
import { usePermission } from "@/hooks/use-permission";
import { apiFetch } from "@/lib/api/client";
import { isForbidden, toErrorMessage } from "@/lib/errors";

export function AuthorizationProbe() {
  const { hasPermission } = usePermission();
  const [pending, setPending] = useState<string | null>(null);

  const probes = [
    {
      id: "view",
      label: "View employees",
      permission: PERMISSIONS.employee.view,
      action: () => apiFetch<{ message: string }>("/api/v1/test/employee-view"),
    },
    {
      id: "create",
      label: "Create employee",
      permission: PERMISSIONS.employee.create,
      action: () =>
        apiFetch<{ message: string }>("/api/v1/test/employee-create", { method: "POST" }),
    },
    {
      id: "delete",
      label: "Delete employee",
      permission: PERMISSIONS.employee.delete,
      action: () =>
        apiFetch<{ message: string }>("/api/v1/test/employee-delete", { method: "DELETE" }),
    },
  ];

  const visible = probes.filter((probe) => hasPermission(probe.permission));
  if (visible.length === 0) return null;

  const runProbe = async (probe: (typeof probes)[number]) => {
    setPending(probe.id);
    try {
      const result = await probe.action();
      toast.success(result.message);
    } catch (error) {
      if (isForbidden(error)) {
        toast.error("403 Forbidden — backend rejected this action.");
      } else {
        toast.error(toErrorMessage(error, "Request failed."));
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
          Authorization probe
        </CardTitle>
        <CardDescription>
          Verify backend enforcement matches your effective permissions. These calls hit real
          permission-protected test endpoints — not simulated UI checks.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {visible.map((probe) => (
          <Button
            key={probe.id}
            variant="outline"
            size="sm"
            disabled={pending !== null}
            onClick={() => void runProbe(probe)}
          >
            {pending === probe.id && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            {probe.label}
          </Button>
        ))}
        {visible.length < probes.length && (
          <Badge variant="outline" className="self-center text-xs">
            {probes.length - visible.length} action{probes.length - visible.length === 1 ? "" : "s"}{" "}
            hidden — no permission
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
