"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useActionState } from "react";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { verifyEmail } from "@/lib/actions/auth";
import AuthCard from "@/components/AuthCard";

export default function VerifyEmail({ token }: { token?: string }) {
  const router = useRouter();

  const [state, action, isPending] = useActionState(verifyEmail, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto submit on mount once token is available
  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  useEffect(() => {
    if (state?.status === "success") {
      router.push("/auth/verify-email/success");
    }
  }, [state?.status, router]);

  return (
    <AuthCard title="Email Verification">
      {/* Hidden form auto submitted on mount */}
      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="token" value={token ?? ""} />
      </form>

      <div className="text-center py-6">
        {isPending ||
          (state?.status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <Spinner />
              </div>
              <p className="text-text-muted">Verifying…</p>
            </>
          ))}

        {!isPending && (state?.status === "error" || !token) && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="font-display text-lg font-bold mb-1 text-error">Failed</p>
            <p className="text-sm mb-5 text-text-muted">{!token ? "No token provided." : state?.message}</p>
            <Link href="/auth/signup">
              <Button variant="secondary">Signup Again</Button>
            </Link>
          </>
        )}
      </div>
    </AuthCard>
  );
}
