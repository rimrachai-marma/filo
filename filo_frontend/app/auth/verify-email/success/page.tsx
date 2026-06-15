import Link from "next/link";

import AuthCard from "@/components/AuthCard";
import Button from "@/components/ui/Button";
import { CheckIcon } from "lucide-react";

export default function VerifyEmailSuccessPage() {
  return (
    <AuthCard title="Email Verification">
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.3)]">
          <CheckIcon className="w-6 h-6 text-success" />
        </div>
        <p className="font-display text-lg font-bold mb-1 text-success">Verified!</p>
        <p className="text-sm mb-5 text-text-muted">Email verified successfully! You can now log in.</p>
        <Link href="/auth/login">
          <Button>Sign In Now</Button>
        </Link>
      </div>
    </AuthCard>
  );
}
