"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type FormValues = z.infer<typeof loginSchema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

interface LoginErrorState {
  message: string;
  requestId?: string;
}

function toLoginError(error: unknown): LoginErrorState {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "AUTH_INVALID_CREDENTIALS":
        return { message: "Invalid email or password.", requestId: error.requestId };
      case "AUTH_USER_DISABLED":
        return { message: "This account has been disabled.", requestId: error.requestId };
      case "RATE_LIMITED":
        return { message: "Too many attempts. Please try again later.", requestId: error.requestId };
      case "VALIDATION_ERROR":
        return { message: "Please check your details and try again.", requestId: error.requestId };
      default:
        return { message: error.message, requestId: error.requestId };
    }
  }
  return {
    message:
      error instanceof Error ? error.message : "Unable to sign in. Please try again.",
  };
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const { status, login } = useSession();

  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loginError, setLoginError] = useState<LoginErrorState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback(
    (field: keyof FormValues, value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
      setLoginError(null);
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoginError(null);

      const result = loginSchema.safeParse(values);
      if (!result.success) {
        const errors: FieldErrors = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof FormValues | undefined;
          if (field) {
            errors[field] = issue.message;
          }
        }
        setFieldErrors(errors);
        return;
      }

      setSubmitting(true);
      try {
        await login(result.data.email, result.data.password);
        router.replace(redirectTo);
      } catch (error) {
        setLoginError(toLoginError(error));
      } finally {
        setSubmitting(false);
      }
    },
    [values, login, router, redirectTo]
  );

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(redirectTo);
    }
  }, [status, router, redirectTo]);

  if (status === "authenticated") {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {loginError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <p>{loginError.message}</p>
          {loginError.requestId && (
            <p className="mt-1 font-mono text-xs text-destructive/70">
              Request ID: {loginError.requestId}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          disabled={submitting}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={values.password}
          onChange={(event) => updateField("password", event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          disabled={submitting}
        />
        {fieldErrors.password && (
          <p id="password-error" className="text-xs text-destructive">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}