"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { formatRoleSlug } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useSession();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Signed in</CardTitle>
            <CardDescription>Your current session is active.</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Session active</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your roles</CardTitle>
            <CardDescription>Permissions are resolved from these roles on every request.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <Badge key={role.id} variant="outline">
                  {formatRoleSlug(role.slug)}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No roles assigned.</p>
            )}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>RBAC administration</CardTitle>
            <CardDescription>
              User, role, and permission management screens arrive in the next phase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">Coming soon</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}