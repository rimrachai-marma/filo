"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FolderPicker from "@/components/ui/FolderPicker";
import { renameFolder, deleteFolder, moveFolder } from "@/lib/actions/folders";
import type { Folder } from "@/types";
import { FolderIcon, MoreVerticalIcon, MoveIcon, PencilIcon, Trash2Icon, Share2Icon } from "lucide-react";
import Alert from "../../../components/ui/Alert";
import ShareModal from "@/components/ShareModal";

interface FolderGridProps {
  folders: Folder[];
  currentId: string | null;
}

export function FolderGrid({ folders }: FolderGridProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Folder | null>(null);
  const [nameVal, setNameVal] = useState("");
  const [destId, setDestId] = useState<string | null>(null);
  const [ctxFolder, setCtxFolder] = useState<Folder | null>(null);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const [activeModal, setActiveModal] = useState<"rename" | "delete" | "move" | null>(null);

  const renameRef = useRef<HTMLDialogElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const moveRef = useRef<HTMLDialogElement>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [renameState, dispatchRename, isRenaming] = React.useActionState(renameFolder, null);
  const [deleteState, dispatchDelete, isDeleting] = React.useActionState(deleteFolder, null);
  const [moveState, dispatchMove, isMoving] = React.useActionState(moveFolder, null);

  const shareRef = useRef<HTMLDialogElement>(null);
  const [shareTarget, setShareTarget] = useState<{ fileId?: string; folderId?: string; name: string } | null>(null);

  const closeCtxMenu = useCallback(() => {
    ctxMenuRef.current?.hidePopover();
    triggerRef.current = null;
    setCtxFolder(null);
    setCtxPos(null);
  }, []);

  const openCtxMenu = useCallback((folder: Folder, trigger?: HTMLButtonElement, pos?: { x: number; y: number }) => {
    triggerRef.current = trigger ?? null;
    setCtxFolder(folder);
    setCtxPos(pos ?? null);
    requestAnimationFrame(() => ctxMenuRef.current?.showPopover());
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxFolder) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) {
        closeCtxMenu();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [ctxFolder, closeCtxMenu]);

  const openModal = (type: "rename" | "delete" | "move", folder: Folder, initial = "") => {
    setSelected(folder);
    setNameVal(initial);
    setDestId(null);
    closeCtxMenu();
    setActiveModal(type);
    if (type === "rename") renameRef.current?.showModal();
    if (type === "delete") deleteRef.current?.showModal();
    if (type === "move") moveRef.current?.showModal();
  };

  const closeModal = (ref: React.RefObject<HTMLDialogElement | null>) => {
    ref.current?.close();
    setSelected(null);
    setActiveModal(null);
  };

  const openShare = (folder: Folder) => {
    setShareTarget({ folderId: folder.id, name: folder.name });
    requestAnimationFrame(() => shareRef.current?.showModal());
  };

  useEffect(() => {
    if (!renameState || renameState.status !== "success") return;
    closeModal(renameRef);
    router.refresh();
  }, [renameState, router]);

  useEffect(() => {
    if (!deleteState || deleteState.status !== "success") return;
    closeModal(deleteRef);
    router.refresh();
  }, [deleteState, router]);

  useEffect(() => {
    if (!moveState || moveState.status !== "success") return;
    closeModal(moveRef);
    router.refresh();
  }, [moveState, router]);

  const handleRename = () => {
    if (!nameVal.trim() || !selected) return;
    React.startTransition(() => dispatchRename({ id: selected.id, name: nameVal.trim() }));
  };

  const handleDelete = () => {
    if (!selected) return;
    React.startTransition(() => dispatchDelete({ id: selected.id }));
  };

  const handleMove = () => {
    if (!selected) return;
    React.startTransition(() => dispatchMove({ id: selected.id, targetParentId: destId }));
  };

  return (
    <>
      {/* Phantom anchor for right-click positioning */}
      <div
        ref={anchorRef}
        style={
          {
            position: "fixed",
            top: ctxPos?.y ?? 0,
            left: ctxPos?.x ?? 0,
            width: 0,
            height: 0,
            anchorName: "--ctx-mouse-anchor",
          } as React.CSSProperties
        }
      />

      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">
          Folders ({folders.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {folders.map((folder) => {
            const anchorName = `--folder-menu-${folder.id}`;

            return (
              <div
                key={folder.id}
                className="group rounded-xl p-4 cursor-pointer transition-all relative bg-surface border border-border hover:border-border-hover hover:bg-surface-2"
                onDoubleClick={() => router.push(`/dashboard/folders/${folder.id}`)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openCtxMenu(folder, undefined, { x: e.clientX, y: e.clientY });
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <FolderIcon className="fill-warning text-warning size-6" />
                  <button
                    style={{ anchorName } as React.CSSProperties}
                    onClick={(e) => {
                      if (ctxFolder?.id === folder.id) {
                        closeCtxMenu();
                      } else {
                        openCtxMenu(folder, e.currentTarget);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity bg-surface-3 text-text-muted cursor-pointer"
                  >
                    <MoreVerticalIcon size={12} />
                  </button>
                </div>
                <p className="text-sm font-medium truncate text-text">{folder.name}</p>
                <p className="text-xs mt-0.5 text-text-muted">
                  {folder._count.children} sub · {folder._count.files} files
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Anchor-positioned context menu popover */}
      <div
        ref={ctxMenuRef}
        popover="manual"
        style={
          ctxFolder
            ? ({
                positionAnchor: ctxPos ? "--ctx-mouse-anchor" : `--folder-menu-${ctxFolder.id}`,
                inset: "unset",
                positionArea: "bottom span-right",
                positionTryFallbacks: "flip-block, flip-inline, flip-block flip-inline",
                margin: "0.25rem 0",
              } as React.CSSProperties)
            : undefined
        }
        className="ctx-menu"
      >
        {ctxFolder && (
          <>
            <div
              className="ctx-item"
              onClick={() => {
                router.push(`/dashboard/folders/${ctxFolder.id}`);
                closeCtxMenu();
              }}
            >
              <FolderIcon className="size-4" /> Open
            </div>
            <div className="ctx-item" onClick={() => openModal("move", ctxFolder)}>
              <MoveIcon className="size-4" /> Move to…
            </div>
            <div className="ctx-item" onClick={() => openModal("rename", ctxFolder, ctxFolder.name)}>
              <PencilIcon className="size-4" /> Rename
            </div>
            <div className="ctx-sep" />
            <div className="ctx-item" onClick={() => openShare(ctxFolder)}>
              <Share2Icon className="size-4" /> Share
            </div>
            <div className="ctx-item danger" onClick={() => openModal("delete", ctxFolder)}>
              <Trash2Icon className="size-4" /> Delete
            </div>
          </>
        )}
      </div>

      {/* Rename Modal */}
      <Modal ref={renameRef} modalRef={renameRef} onClose={() => closeModal(renameRef)} title="Rename Folder">
        {!isRenaming && renameState?.status === "error" && (
          <div className="mb-2.5">
            <Alert type="error">{renameState.message}</Alert>
          </div>
        )}

        <Input
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
        />
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => closeModal(renameRef)}>
            Cancel
          </Button>
          <Button className="flex-1 justify-center" loading={isRenaming} onClick={handleRename}>
            Save
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal ref={deleteRef} modalRef={deleteRef} onClose={() => closeModal(deleteRef)} title="Confirm Delete">
        {!isDeleting && deleteState?.status === "error" && (
          <div className="mb-2.5">
            <Alert type="error">{deleteState.message}</Alert>
          </div>
        )}

        <p className="text-sm mb-5 text-text-muted">
          Delete <strong className="text-text">{selected?.name}</strong>? All contents will be permanently deleted. This
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => closeModal(deleteRef)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1 justify-center" loading={isDeleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Move Modal */}
      <Modal ref={moveRef} modalRef={moveRef} onClose={() => closeModal(moveRef)} title="Move Folder">
        {!isMoving && moveState?.status === "error" && (
          <div className="mb-2.5">
            <Alert type="error">{moveState.message}</Alert>
          </div>
        )}

        <p className="text-sm mb-3 text-text-muted">
          Move <strong className="text-text">{selected?.name}</strong> to:
        </p>
        {activeModal === "move" && <FolderPicker value={destId} onChange={setDestId} />}
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => closeModal(moveRef)}>
            Cancel
          </Button>
          <Button className="flex-1 justify-center" loading={isMoving} onClick={handleMove}>
            Move Here
          </Button>
        </div>
      </Modal>
      <ShareModal
        modalRef={shareRef}
        target={shareTarget}
        onClose={() => {
          shareRef.current?.close();
          setShareTarget(null);
        }}
      />
    </>
  );
}
