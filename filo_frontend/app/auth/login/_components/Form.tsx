"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { LoginFormData, loginSchema } from "@/lib/schemas";
import { login } from "@/lib/actions/auth";

interface Props {
  redirectTo?: string;
}

const Form: React.FC<Props> = ({ redirectTo }) => {
  const router = useRouter();

  const [state, formAction, isPending] = React.useActionState(login, null);

  const {
    register,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    React.startTransition(() => {
      formAction(data);
    });
  };

  React.useEffect(() => {
    if (state?.status === "success") {
      router.push(redirectTo ?? "/dashboard");
    }

    if (state?.status === "error") {
      if (state.errors) {
        Object.entries(state.errors).forEach(([field, messages]) => {
          setError(field as keyof LoginFormData, {
            message: messages[0],
          });
        });
      }
    }
  }, [state, router, setError, redirectTo]);

  return (
    <>
      {state?.status === "error" && <Alert type="error">{state.message}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-text">Password</span>
            <Link href="/auth/forgot-password" className="text-xs text-accent">
              Forgot?
            </Link>
          </div>
          <Input type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
        </div>
        <Button type="submit" loading={isPending} className="w-full justify-center">
          Sign In
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        No account?{" "}
        <Link href="/auth/signup" className="font-medium text-accent">
          Create one
        </Link>
      </p>
    </>
  );
};

export default Form;
