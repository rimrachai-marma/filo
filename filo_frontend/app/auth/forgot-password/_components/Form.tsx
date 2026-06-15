"use client";

import { useActionState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { forgotPassword } from "@/lib/actions/auth";
import { MailIcon } from "lucide-react";
import Alert from "@/components/ui/Alert";

const Form: React.FC = () => {
  const [state, action, isPending] = useActionState(forgotPassword, null);

  if (state?.status === "success") {
    return (
      <div className="text-center py-4">
        <div className="bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.3)] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
          <MailIcon className="size-6 text-accent" />
        </div>
        <p className="text-sm mb-5 text-text-muted">If an account exists for this email, a reset link is on its way.</p>
        <Link href="/auth/login">
          <Button variant="secondary">Back to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 mt-4">
      {!isPending && state?.status === "error" && <Alert type="error">{state.message}</Alert>}

      <Input label="Email" name="email" type="email" placeholder="you@example.com" />
      <Button type="submit" loading={isPending} className="w-full justify-center">
        Send Reset Link
      </Button>
      <p className="text-center text-sm">
        <Link href="/auth/login" className="text-accent">
          ← Back to login
        </Link>
      </p>
    </form>
  );
};

export default Form;
