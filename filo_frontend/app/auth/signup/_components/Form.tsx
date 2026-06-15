"use client";

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { RegisterFormData, registerSchema } from "@/lib/schemas";
import { signup } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

const Form: React.FC = () => {
  const router = useRouter();

  const [state, formAction, isPending] = React.useActionState(signup, null);

  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    React.startTransition(() => formAction(data));
  };

  React.useEffect(() => {
    if (state?.status === "success") {
      router.push("/auth/signup/success");
    }

    if (state?.status === "error") {
      if (state.errors) {
        Object.entries(state.errors).forEach(([f, messages]) => {
          setError(f as keyof RegisterFormData, { message: messages[0] });
        });
      }
    }
  }, [state, setError, router]);

  return (
    <>
      {state?.status === "error" && !state.errors && <Alert type="error">{state.message}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <Input label="Full Name" placeholder="John Doe" error={errors.name?.message} {...field("name")} />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...field("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 chars"
          hint="Must be 8–16 chars with a letter, number, and special character."
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
          Create Account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-accent">
          Sign in
        </Link>
      </p>
    </>
  );
};

export default Form;
