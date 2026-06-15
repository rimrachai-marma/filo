"use client";

import React, { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createFolder } from "@/lib/actions/folders";
import { ChevronRightIcon, UploadCloudIcon } from "lucide-react";
import { useUploadContext } from "@/lib/context/UploadContext";
import { SidebarTrigger } from "./Sidebar/SidebarTrigger";
import Modal from "./ui/Modal";
import Alert from "./ui/Alert";

interface Crumb {
  id: string | null;
  name: string;
}

interface TopBarProps {
  crumbs: Crumb[];
  currentId: string | null;
}

export function TopBar({ crumbs, currentId }: TopBarProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [folderName, setFolderName] = useState("");
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { items, uploads, activeCount } = useUploadContext();

  const [folderState, folderDispatch, isFolderPending] = React.useActionState(createFolder, null);

  const handleCreateFolder = () => {
    if (!folderName.trim()) return;
    React.startTransition(() => folderDispatch({ name: folderName.trim(), parentId: currentId }));
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || !currentId) return;
      uploads(files, currentId);

      if (fileRef.current) fileRef.current.value = "";
    },
    [currentId, uploads],
  );

  // ─── Drag & drop ─────────────────────────────────────────────────────────
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!currentId) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    },
    [currentId],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the topbar entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (!currentId) return;
      handleFiles(e.dataTransfer.files);
    },
    [currentId, handleFiles],
  );

  React.useEffect(() => {
    if (!folderState || folderState.status !== "success") return;
    modalRef.current?.close();
    router.refresh();
  }, [folderState, router]);

  const closeModal = (ref: React.RefObject<HTMLDialogElement | null>) => {
    ref.current?.close();
  };

  const refreshed = useRef<Set<string>>(new Set()); // prevent double-firing
  React.useEffect(() => {
    items
      .filter((i) => i.status === "done" && !refreshed.current.has(i.id))
      .forEach((i) => {
        refreshed.current.add(i.id);
        router.refresh();
      });
  }, [items, router]);

  return (
    <>
      <div
        className={`sticky top-0 z-30 flex h-16 flex-col justify-center gap-2 border-b px-6 backdrop-blur-md transition-colors ${
          isDragOver
            ? "border-accent bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-surface))]"
            : "border-border bg-surface/85"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center shrink-0">
            <SidebarTrigger />
          </div>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              const href = crumb.id ? `/dashboard/folders/${crumb.id}` : "/dashboard";

              return (
                <span key={crumb.id ?? "root"} className="flex items-center gap-1 whitespace-nowrap">
                  {i > 0 && <ChevronRightIcon className="size-4 text-text-muted" />}
                  {isLast ? (
                    <span className="text-text font-medium text-sm px-0.5 py-1.5">{crumb.name}</span>
                  ) : (
                    <Link href={href} className="font-medium text-sm px-0.5 py-1.5 text-text-muted">
                      {crumb.name}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          {/* Drag-over hint */}
          {isDragOver && currentId && (
            <div className="flex items-center gap-1.5 text-accent text-xs font-medium animate-fade-in">
              <UploadCloudIcon size={14} />
              Drop to upload
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => modalRef.current?.showModal()}>
              + New Folder
            </Button>

            {currentId && (
              <Button
                size="sm"
                loading={activeCount > 0}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5"
              >
                <UploadCloudIcon size={13} />
                {activeCount > 0 ? `Uploading ${activeCount}…` : "Upload"}
              </Button>
            )}
          </div>

          {/* Hidden multi-file input */}
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>
      </div>

      {/* New Folder Modal */}
      <Modal ref={modalRef} modalRef={modalRef} title="New Folder" onClose={() => setFolderName("")}>
        {folderState?.status === "error" && !isFolderPending && (
          <div className="mb-2.5">
            <Alert type="error">{folderState.message}</Alert>
          </div>
        )}

        <Input
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          autoFocus
          placeholder="Folder name"
          onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
        />
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => closeModal(modalRef)}>
            Cancel
          </Button>
          <Button className="flex-1 justify-center" onClick={handleCreateFolder} loading={isFolderPending}>
            Create
          </Button>
        </div>
      </Modal>
    </>
  );
}
