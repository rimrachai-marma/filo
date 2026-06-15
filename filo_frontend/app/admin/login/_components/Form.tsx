"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { AdminLoginFormData, adminLoginSchema } from "@/lib/schemas";
import { loginAdmin } from "@/lib/actions/auth";

interface Props {
  redirectTo?: string;
}

const Form: React.FC<Props> = ({ redirectTo }) => {
  const router = useRouter();

  const [state, formAction, isPending] = React.useActionState(loginAdmin, null);

  const {
    register,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    React.startTransition(() => {
      formAction(data);
    });
  };

  React.useEffect(() => {
    if (state?.status === "success") {
      router.push(redirectTo ?? "/admin/dashboard");
    }

    if (state?.status === "error") {
      if (state.errors) {
        Object.entries(state.errors).forEach(([field, messages]) => {
          setError(field as keyof AdminLoginFormData, {
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
          label="Admin Email"
          type="email"
          placeholder="admin@filo.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button
          type="submit"
          loading={isPending}
          className="w-full justify-center"
          style={{ background: "#fbbf24", color: "#0a0f1e", border: "none" }}
        >
          Admin Sign In
        </Button>
      </form>
    </>
  );
};

export default Form;
