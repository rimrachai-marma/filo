"use client";

import React, { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { resetPassword } from "@/lib/actions/auth";
import AuthCard from "@/components/AuthCard";
import { ResetPasswordFormData, resetPasswordSchema } from "@/lib/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";

export default function ResetPassword({ token }: { token?: string }) {
  const router = useRouter();
  const [state, action, isPending] = useActionState(resetPassword, null);

  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    React.startTransition(() => action({ ...data, token: token! }));
  };

  useEffect(() => {
    if (state?.status === "success") {
      const t = setTimeout(() => router.push("/auth/login"), 2500);
      return () => clearTimeout(t);
    }

    if (state?.status === "error") {
      if (state.errors) {
        Object.entries(state.errors).forEach(([f, messages]) => {
          setError(f as keyof ResetPasswordFormData, { message: messages[0] });
        });
      }
    }
  }, [state, router, setError]);

  if (!token) {
    return (
      <AuthCard title="Invalid Link">
        <p className="text-sm text-center mb-4 text-text-muted">This reset link is invalid or missing.</p>
        <div className="text-center">
          <Link href="/auth/forgot-password">
            <Button variant="secondary">Request New Link</Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="New Password">
      {state?.status === "success" ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.3)]">
            <CheckIcon className="w-6 h-6 text-success" />
          </div>
          <p className="font-display text-lg font-bold mb-1 text-success">Password Reset!</p>
          <p className="text-sm text-text-muted">Redirecting to login…</p>
        </div>
      ) : (
        <form className="space-y-4 mt-4" onSubmit={handleSubmit(onSubmit)}>
          {!isPending && state?.status === "error" && <Alert type="error">{state.message}</Alert>}

          <input type="hidden" name="token" value={token} />

          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 chars"
            hint="8–16 chars, must include letter, number, and special character."
            error={errors.password?.message}
            {...field("password")}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirm?.message}
            {...field("confirm")}
          />
          <Button type="submit" loading={isPending} className="w-full justify-center">
            Reset Password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
