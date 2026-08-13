"use client";

import { ShieldX } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AccessDenied() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="items-center text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-destructive/10">
          <ShieldX className="size-6 text-destructive" aria-hidden="true" />
        </span>
        <CardTitle>Access denied</CardTitle>
        <CardDescription>
          You do not have permission to view this page. Contact an administrator if you believe
          this is a mistake.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center gap-2">
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
        <Button variant="ghost" onClick={() => window.history.back()}>
          Go back
        </Button>
      </CardContent>
    </Card>
  );
}