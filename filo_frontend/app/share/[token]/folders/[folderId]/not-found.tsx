import Link from "next/link";
import Button from "@/components/ui/Button";

export default function SharedFolderNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface border border-border text-center">
        <h1 className="text-xl font-display font-bold text-text mb-2">Folder not found</h1>
        <p className="text-sm text-text-muted mb-6">
          This folder doesn&apos;t exist or isn&apos;t part of the shared link.
        </p>
        <Link href="javascript:history.back()">
          <Button variant="secondary">Go back</Button>
        </Link>
      </div>
    </div>
  );
}
