"use client";

import React from "react";
import type { ShareLink } from "@/types";
import { revokeShareLink } from "@/lib/actions/share";
import { CopyIcon, CheckIcon, Trash2Icon, LinkIcon, FolderIcon, FileTextIcon } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function SharesList({ links }: { links: ShareLink[] }) {
  const router = useRouter();

  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  const [state, dispatch, isPending] = React.useActionState(revokeShareLink, null);

  const handleRevoke = (id: string) => {
    setRevokingId(id);
    React.startTransition(() => {
      dispatch({ id });
    });
  };

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`${APP_URL}/share/${token}`);
    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  React.useEffect(() => {
    if (state?.status === "success") {
      router.refresh();
    }
  }, [router, state]);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-text">Your share links ({links.length})</h2>

      {links.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border">
          <LinkIcon className="size-6 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No share links yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-border">
          {links.map((link) => {
            const target = link.file?.name ?? link.folder?.name ?? "Unknown";

            const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;

            const isRevokingCurrent = isPending && revokingId === link.id;

            return (
              <div
                key={link.id}
                className={`flex items-center gap-2 px-4 py-3 border-b border-border last:border-0 bg-surface transition-opacity ${
                  isRevokingCurrent ? "opacity-50" : ""
                }`}
              >
                <span className="shrink-0 text-text-muted">
                  {link.fileId ? <FileTextIcon size={16} /> : <FolderIcon size={16} className="text-warning" />}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{target}</p>

                  <p className="text-xs font-mono text-text-muted truncate">
                    {APP_URL}/share/{link.token}
                  </p>
                </div>

                {link.expiresAt && (
                  <span
                    className={`text-[10px] shrink-0 hidden sm:block ${isExpired ? "text-error" : "text-text-muted"}`}
                  >
                    {isExpired ? "Expired" : `Exp. ${new Date(link.expiresAt).toLocaleDateString()}`}
                  </span>
                )}

                <button
                  onClick={() => copyLink(link.token, link.id)}
                  title="Copy link"
                  disabled={isPending}
                  className="p-1.5 rounded-lg bg-surface-3 text-text-muted cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {copiedId === link.id ? <CheckIcon size={12} className="text-success" /> : <CopyIcon size={12} />}
                </button>

                <button
                  onClick={() => handleRevoke(link.id)}
                  disabled={isPending}
                  title="Revoke"
                  className="p-1.5 rounded-lg bg-[rgba(248,113,113,0.1)] text-error cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isRevokingCurrent ? <Spinner size={12} /> : <Trash2Icon size={12} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
