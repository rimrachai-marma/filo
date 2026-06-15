"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { createFileShareLink, createFolderShareLink, shareLinks, revokeShareLink } from "@/lib/actions/share";
import type { ShareLink } from "@/types";
import { CopyIcon, CheckIcon, Trash2Icon } from "lucide-react";

interface Props {
  modalRef: React.RefObject<HTMLDialogElement | null>;
  target: { fileId?: string; folderId?: string; name: string } | null;
  onClose: () => void;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function ShareModal({ modalRef, target, onClose }: Props) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expiresInHours, setExpiresInHours] = useState<number | "">("");

  const [fileCreateState, fileCreateAction, isCreatingFile] = React.useActionState(createFileShareLink, null);
  const [folderCreateState, folderCreateAction, isCreatingFolder] = React.useActionState(createFolderShareLink, null);
  const [, revokeAction] = React.useActionState(revokeShareLink, null);

  const isCreating = isCreatingFile || isCreatingFolder;
  const createState = target?.fileId ? fileCreateState : folderCreateState;

  useEffect(() => {
    if (target) {
      (async () => {
        setLoading(true);
        const res = await shareLinks();

        if (res.status === "success") {
          const filtered = res.data.filter((l) =>
            target?.fileId ? l.fileId === target.fileId : l.folderId === target?.folderId,
          );
          setLinks(filtered);
        }

        if (res.status === "error") {
          console.error("Failed to load folders", res.message);
        }

        setLoading(false);
      })();
    }
  }, [target]);

  useEffect(() => {
    if (fileCreateState?.status === "success" || folderCreateState?.status === "success") {
      (async () => {
        setLoading(true);
        const res = await shareLinks();

        if (res.status === "success") {
          const filtered = res.data.filter((l) =>
            target?.fileId ? l.fileId === target.fileId : l.folderId === target?.folderId,
          );
          setLinks(filtered);
        }

        if (res.status === "error") {
          console.error("Failed to load folders", res.message);
        }

        setLoading(false);
      })();
    }
  }, [fileCreateState, folderCreateState, target]);

  const handleCreate = () => {
    if (!target) return;
    const hours = expiresInHours === "" ? undefined : Number(expiresInHours);

    React.startTransition(() => {
      if (target.fileId) {
        fileCreateAction({ fileId: target.fileId, expiresInHours: hours });
      } else if (target.folderId) {
        folderCreateAction({ folderId: target.folderId, expiresInHours: hours });
      }
    });
  };

  const handleRevoke = (id: string) => {
    React.startTransition(() => revokeAction({ id }));
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`${APP_URL}/share/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <Modal ref={modalRef} modalRef={modalRef} title="Share" subtitle={target?.name} onClose={onClose}>
      {!isCreating && createState?.status === "error" && (
        <div className="mb-3">
          <Alert type="error">{createState.message}</Alert>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <select
          value={expiresInHours}
          onChange={(e) => setExpiresInHours(e.target.value === "" ? "" : Number(e.target.value))}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-surface-2 border border-border text-text"
        >
          <option value="">No expiration</option>
          <option value={1}>Expires in 1 hour</option>
          <option value={24}>Expires in 1 day</option>
          <option value={24 * 7}>Expires in 7 days</option>
          <option value={24 * 30}>Expires in 30 days</option>
        </select>
        <Button onClick={handleCreate} loading={isCreating}>
          New Link
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : links.length === 0 ? (
        <p className="text-sm text-text-muted">No active share links yet.</p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-2 border border-border"
            >
              <span className="text-xs font-mono text-text-muted truncate flex-1">
                {APP_URL}/share/{link.token}
              </span>
              {link.expiresAt && (
                <span className="text-[10px] text-text-muted shrink-0">
                  exp. {new Date(link.expiresAt).toLocaleDateString()}
                </span>
              )}
              <button
                onClick={() => copyLink(link.token, link.id)}
                title="Copy link"
                className="p-1.5 rounded-lg bg-surface-3 text-text-muted cursor-pointer shrink-0"
              >
                {copiedId === link.id ? <CheckIcon size={12} className="text-success" /> : <CopyIcon size={12} />}
              </button>
              <button
                onClick={() => handleRevoke(link.id)}
                title="Revoke"
                className="p-1.5 rounded-lg bg-[rgba(248,113,113,0.1)] text-error cursor-pointer shrink-0"
              >
                <Trash2Icon size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
