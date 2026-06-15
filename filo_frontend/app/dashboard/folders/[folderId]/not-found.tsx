import Link from "next/link";
import Button from "@/components/ui/Button";
import { FolderXIcon } from "lucide-react";

export default function FolderNotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-2xl bg-surface border border-border">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-warning/10">
              <FolderXIcon size={32} className="text-warning" />
            </div>
          </div>

          <h1 className="text-2xl font-display font-bold text-text text-center mb-2">Folder not found</h1>
          <p className="text-sm text-text-muted text-center mb-6">
            This folder doesn&apos;t exist or you don&apos;t have access to it.
          </p>

          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full justify-center">
                Back
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full justify-center">Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
