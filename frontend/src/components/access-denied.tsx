"use client";

import { ShieldX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

export function AccessDenied() {
  return (
    <Card className="mx-auto w-full max-w-md shadow-xs">
      <CardContent className="pt-6">
        <EmptyState
          icon={ShieldX}
          title="Access restricted"
          description="You do not have permission to access this resource. Contact an administrator if you believe this is a mistake."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/dashboard" className={buttonVariants({ variant: "default" })}>
                Back to dashboard
              </Link>
              <button
                type="button"
                className={buttonVariants({ variant: "ghost" })}
                onClick={() => window.history.back()}
              >
                Go back
              </button>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
