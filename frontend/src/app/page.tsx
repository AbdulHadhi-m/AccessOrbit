"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/config/env";
import { useSession } from "@/hooks/use-session";

const foundation = [
  "Dynamic RBAC engine (modules, sub-modules, operations, permissions)",
  "JWT authentication with rotating refresh tokens",
  "Permission-based authorization middleware",
  "Enterprise administration UI",
];

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-4">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <CardTitle className="text-2xl">AccessOrbit</CardTitle>
            <Badge variant="secondary">Foundation</Badge>
          </div>
          <CardDescription>
            Enterprise Access Control and Management Platform with dynamic RBAC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Sign in to continue to the administration console.
          </p>
          <ul className="space-y-2 text-sm">
            {foundation.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 text-primary">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Link href="/login" className={buttonVariants()}>
              Sign in
              <ArrowRight aria-hidden="true" />
            </Link>
            <span className="text-xs text-muted-foreground">
              API{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {env.apiUrl}
              </code>
            </span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}