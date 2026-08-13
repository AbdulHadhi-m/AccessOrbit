import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/config/env";

const foundation = [
  "Dynamic RBAC engine (modules, sub-modules, operations, permissions)",
  "JWT authentication with rotating refresh tokens",
  "Permission-based authorization middleware",
  "Enterprise administration UI",
];

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl">AccessOrbit</CardTitle>
            <Badge variant="secondary">Foundation</Badge>
          </div>
          <CardDescription>
            Enterprise Access Control and Management Platform with dynamic RBAC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            The project foundation is in place. Application features are being built in phases on
            top of this base.
          </p>
          <ul className="space-y-2 text-sm">
            {foundation.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 text-primary">
                  ▸
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
            <span>API</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{env.apiUrl}</code>
            <span className="text-muted-foreground/60">·</span>
            <Link href={`${env.apiUrl}/api/v1/health`} className="underline-offset-4 hover:underline">
              health endpoint
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}