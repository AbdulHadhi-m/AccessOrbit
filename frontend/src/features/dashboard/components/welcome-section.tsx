"use client";

import { Eye, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { isReadOnlyPermissionSet } from "@/lib/permissions";

export function WelcomeSection() {
  const { user } = useSession();
  if (!user) return null;

  const readOnly = isReadOnlyPermissionSet(user.permissions);

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card shadow-xs">
      <div className="absolute top-0 right-0 -mr-12 -mt-12 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <CardTitle className="text-xl font-bold tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
          </CardTitle>
        </div>
        <CardDescription className="mt-1">
          Signed in as <span className="font-semibold text-foreground">{user.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        {user.roles.map((role) => (
          <Badge key={role.id} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20 font-medium">
            <ShieldCheck className="size-3" aria-hidden="true" />
            {role.name}
          </Badge>
        ))}
        {readOnly && (
          <Badge variant="outline" className="gap-1 text-warning border-warning/40">
            <Eye className="size-3" aria-hidden="true" />
            Read-only access
          </Badge>
        )}
        <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
          {user.permissions.length} active permission{user.permissions.length === 1 ? "" : "s"}
        </span>
      </CardContent>
    </Card>
  );
}
