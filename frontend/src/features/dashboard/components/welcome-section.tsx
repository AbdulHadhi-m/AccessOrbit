"use client";

import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { isReadOnlyPermissionSet } from "@/lib/permissions";

export function WelcomeSection() {
  const { user } = useSession();
  if (!user) return null;

  const readOnly = isReadOnlyPermissionSet(user.permissions);

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Welcome back, {user.name.split(" ")[0]}</CardTitle>
        <CardDescription>
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        {user.roles.map((role) => (
          <Badge key={role.id} variant="outline">
            {role.name}
          </Badge>
        ))}
        {readOnly && (
          <Badge variant="secondary" className="gap-1">
            <Eye className="size-3" aria-hidden="true" />
            Read-only access
          </Badge>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">
          {user.permissions.length} effective permission{user.permissions.length === 1 ? "" : "s"}
        </span>
      </CardContent>
    </Card>
  );
}
