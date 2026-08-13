import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      {/* Gradient background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-[#6B38C3]/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-[#7C3AED]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-[#A78BFA]/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6B38C3] to-[#7C3AED] text-white shadow-lg shadow-purple-500/30">
            <ShieldCheck className="size-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">AccessOrbit</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage enterprise access control
            </p>
          </div>
        </div>
        <Card className="rounded-2xl shadow-xl shadow-purple-500/5 border-purple-200/50 dark:border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Sign in</CardTitle>
            <CardDescription>
              Use your organization credentials to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs font-medium text-muted-foreground/70">
          AccessOrbit — dynamic RBAC platform
        </p>
      </div>
    </main>
  );
}