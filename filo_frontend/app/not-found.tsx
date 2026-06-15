import Link from "next/link";
import Button from "@/components/ui/Button";
import { SearchXIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="w-full max-w-md mx-4 p-8 rounded-2xl bg-surface border border-border">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-warning/10">
            <SearchXIcon size={32} className="text-warning" />
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold text-text text-center mb-2">Page not found</h1>
        <p className="text-sm text-text-muted text-center mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex gap-3">
          <Link href="/" className="flex-1">
            <Button variant="secondary" className="w-full justify-center">
              Home
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full justify-center">Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
