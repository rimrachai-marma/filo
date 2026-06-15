import Link from "next/link";

import AuthCard from "@/components/AuthCard";
import Button from "@/components/ui/Button";

export default function RegisterSuccessPage() {
  return (
    <AuthCard title="Check your email">
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.3)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
          Registration successful! Please verify your email before logging in.
        </p>
        <Link href="/auth/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    </AuthCard>
  );
}
