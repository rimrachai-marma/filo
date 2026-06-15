"use client";

import Button from "@/components/ui/Button";
import { AlertCircleIcon } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="w-full max-w-md mx-4 p-8 rounded-2xl bg-surface border border-border">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-error/10">
            <AlertCircleIcon size={32} className="text-error" />
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold text-text text-center mb-2">Something went wrong!</h1>
        <p className="text-sm text-text-muted text-center mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>

        {process.env.NODE_ENV === "development" && error.digest && (
          <div className="mb-6 p-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-muted font-mono break-all">Error ID: {error.digest}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => (window.location.href = "/")}>
            Home
          </Button>
          <Button className="flex-1 justify-center" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
