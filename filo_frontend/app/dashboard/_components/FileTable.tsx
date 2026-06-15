"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FolderPicker from "@/components/ui/FolderPicker";
import { renameFile, deleteFile, moveFile, copyFile } from "@/lib/actions/files";
import type { FileItem } from "@/types";
import ShareModal from "@/components/ShareModal";
import {
  DownloadIcon,
  MoveIcon,
  CopyIcon,
  PencilIcon,
  Trash2Icon,
  MoreVerticalIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileTextIcon,
  Share2Icon,
} from "lucide-react";
import { formatData } from "@/lib/utils";
import { get } from "@/lib/api.client";
import Spinner from "../../../components/ui/Spinner";
import Alert from "../../../components/ui/Alert";

const TYPE_COLOR: Record<string, string> = {
  IMAGE: "#38bdf8",
  VIDEO: "#f472b6",
  PDF: "#fb923c",
  AUDIO: "#a78bfa",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function FileIcon({ type }: { type: string }) {
  const c = TYPE_COLOR[type] || "var(--color-text-muted)";
  const props = { size: 17, stroke: c, strokeWidth: 1.5 };
  if (type === "IMAGE") return <ImageIcon {...props} />;
  if (type === "VIDEO") return <VideoIcon {...props} />;
  if (type === "AUDIO") return <MusicIcon {...props} />;
  return <FileTextIcon {...props} />;
}

interface Props {
  files: FileItem[];
}

export function FileTable({ files }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<FileItem | null>(null);
  const [nameVal, setNameVal] = useState("");
  const [destId, setDestId] = useState<string | null>(null);
  const [ctxFile, setCtxFile] = useState<FileItem | null>(null);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const [activeModal, setActiveModal] = useState<"rename" | "delete" | "move" | "copy" | null>(null);

  const renameRef = useRef<HTMLDialogElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const moveRef = useRef<HTMLDialogElement>(null);
  const copyRef = useRef<HTMLDialogElement>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [renameState, dispatchRename, isRenaming] = React.useActionState(renameFile, null);
  const [deleteState, dispatchDelete, isDeleting] = React.useActionState(deleteFile, null);
  const [moveState, dispatchMove, isMoving] = React.useActionState(moveFile, null);
  const [copyState, dispatchCopy, isCopying] = React.useActionState(copyFile, null);

  const shareRef = useRef<HTMLDialogElement>(null);
  const [shareTarget, setShareTarget] = useState<{ fileId?: string; folderId?: string; name: string } | null>(null);

  const closeCtxMenu = useCallback(() => {
    ctxMenuRef.current?.hidePopover();
    triggerRef.current = null;
    setCtxFile(null);
    setCtxPos(null);
  }, []);

  const openCtxMenu = useCallback((file: FileItem, trigger?: HTMLButtonElement, pos?: { x: number; y: number }) => {
    triggerRef.current = trigger ?? null;
    setCtxFile(file);
    setCtxPos(pos ?? null);
    requestAnimationFrame(() => ctxMenuRef.current?.showPopover());
  }, []);

  useEffect(() => {
    if (!ctxFile) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) {
        closeCtxMenu();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [ctxFile, closeCtxMenu]);

  const openModal = (type: "rename" | "delete" | "move" | "copy", file: FileItem, initial = "") => {
    setSelected(file);
    setNameVal(initial);
    setDestId(null);
    closeCtxMenu();
    setActiveModal(type);
    if (type === "rename") renameRef.current?.showModal();
    if (type === "delete") deleteRef.current?.showModal();
    if (type === "move") moveRef.current?.showModal();
    if (type === "copy") copyRef.current?.showModal();
  };

  const closeModal = (ref: React.RefObject<HTMLDialogElement | null>) => {
    ref.current?.close();
    setSelected(null);
    setActiveModal(null);
  };

  const openShare = (file: FileItem) => {
    setShareTarget({ fileId: file.id, name: file.name });
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

  useEffect(() => {
    if (!copyState || copyState.status !== "success") return;
    closeModal(copyRef);
    router.refresh();
  }, [copyState, router]);

  const handleRename = () => {
    if (!nameVal.trim() || !selected) return;
    React.startTransition(() => dispatchRename({ id: selected.id, name: nameVal.trim() }));
  };

  const handleDelete = () => {
    if (!selected) return;
    React.startTransition(() => dispatchDelete({ id: selected.id }));
  };

  const handleMove = () => {
    if (!selected || !destId) return;
    React.startTransition(() => dispatchMove({ id: selected.id, targetFolderId: destId }));
  };

  const handleCopy = () => {
    if (!selected || !destId) return;
    React.startTransition(() => dispatchCopy({ id: selected.id, targetFolderId: destId }));
  };

  const [pendingDownload, setPendingDownload] = useState<string | null>(null);

  const handleDownload = async (file: FileItem) => {
    setPendingDownload(file.id);
    const res = await get<{ url: string; name: string; mimeType: string }>({
      path: `/files/${file.id}/download`,
    });
    setPendingDownload(null);
    if (res.status === "error") {
      alert(res.message);
      return;
    }
    window.open(res.data.url, "_blank");
  };

  if (files.length === 0) return null;

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
            anchorName: "--ctx-file-mouse-anchor",
          } as React.CSSProperties
        }
      />

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">Files ({files.length})</h2>
        <div className="rounded-2xl overflow-hidden border border-border">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                {["Name", "Type", "Size", "Uploaded", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((file, i) => {
                const anchorName = `--file-menu-${file.id}`;
                return (
                  <tr
                    key={file.id}
                    className="group bg-surface-2"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openCtxMenu(file, undefined, { x: e.clientX, y: e.clientY });
                    }}
                    style={{
                      borderBottom: i < files.length - 1 ? "1px solid var(--color-border)" : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileIcon type={file.type} />
                        <span className="text-sm font-medium truncate max-w-xs text-text">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-mono"
                        style={{
                          background: `${TYPE_COLOR[file.type] ?? "#888"}15`,
                          color: TYPE_COLOR[file.type] ?? "#888",
                        }}
                      >
                        {file.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{formatData(BigInt(file.sizeBytes))}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{fmtDate(file.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <RowBtn title="Download" onClick={() => handleDownload(file)}>
                          {pendingDownload === file.id ? <Spinner size={12} /> : <DownloadIcon size={12} />}
                        </RowBtn>
                        <RowBtn title="Move" onClick={() => openModal("move", file)}>
                          <MoveIcon size={12} />
                        </RowBtn>
                        <RowBtn title="Copy to…" onClick={() => openModal("copy", file)}>
                          <CopyIcon size={12} />
                        </RowBtn>
                        <RowBtn title="Rename" onClick={() => openModal("rename", file, file.name)}>
                          <PencilIcon size={12} />
                        </RowBtn>
                        <RowBtn title="Share" onClick={() => openShare(file)}>
                          <Share2Icon size={12} />
                        </RowBtn>
                        <button
                          style={{ anchorName } as React.CSSProperties}
                          onClick={(e) => {
                            if (ctxFile?.id === file.id) {
                              closeCtxMenu();
                            } else {
                              openCtxMenu(file, e.currentTarget);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-surface-3 text-text-muted cursor-pointer"
                          title="More"
                        >
                          <MoreVerticalIcon size={12} />
                        </button>
                        <RowBtn title="Delete" onClick={() => openModal("delete", file)} danger>
                          <Trash2Icon size={12} />
                        </RowBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Anchor-positioned context menu popover */}
      <div
        ref={ctxMenuRef}
        popover="manual"
        style={
          ctxFile
            ? ({
                positionAnchor: ctxPos ? "--ctx-file-mouse-anchor" : `--file-menu-${ctxFile.id}`,
                inset: "unset",
                positionArea: "bottom span-right",
                positionTryFallbacks: "flip-block, flip-inline, flip-block flip-inline",
                margin: "0.25rem 0",
              } as React.CSSProperties)
            : undefined
        }
        className="ctx-menu"
      >
        {ctxFile && (
          <>
            <div className="ctx-item" onClick={() => handleDownload(ctxFile)}>
              <DownloadIcon size={14} /> Download
            </div>
            <div className="ctx-item" onClick={() => openModal("move", ctxFile)}>
              <MoveIcon size={14} /> Move to…
            </div>
            <div className="ctx-item" onClick={() => openModal("copy", ctxFile)}>
              <CopyIcon size={14} /> Copy to…
            </div>
            <div className="ctx-item" onClick={() => openModal("rename", ctxFile, ctxFile.name)}>
              <PencilIcon size={14} /> Rename
            </div>
            <div className="ctx-sep" />
            <div className="ctx-item danger" onClick={() => openModal("delete", ctxFile)}>
              <Trash2Icon size={14} /> Delete
            </div>
            <div className="ctx-item" onClick={() => openShare(ctxFile)}>
              <Share2Icon size={14} /> Share
            </div>
          </>
        )}
      </div>

      {/* Rename Modal */}
      <Modal ref={renameRef} modalRef={renameRef} onClose={() => closeModal(renameRef)} title="Rename File">
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
          Delete <strong className="text-text">{selected?.name}</strong>? This cannot be undone.
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
      <Modal ref={moveRef} modalRef={moveRef} onClose={() => closeModal(moveRef)} title="Move File">
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
          <Button className="flex-1 justify-center" disabled={!destId} loading={isMoving} onClick={handleMove}>
            Move Here
          </Button>
        </div>
      </Modal>

      {/* Copy Modal */}
      <Modal ref={copyRef} modalRef={copyRef} onClose={() => closeModal(copyRef)} title="Copy File">
        {!isCopying && copyState?.status === "error" && (
          <div className="mb-2.5">
            <Alert type="error">{copyState.message}</Alert>
          </div>
        )}

        <p className="text-sm mb-3 text-text-muted">
          Copy <strong className="text-text">{selected?.name}</strong> to:
        </p>
        {activeModal === "copy" && <FolderPicker value={destId} onChange={setDestId} />}
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => closeModal(copyRef)}>
            Cancel
          </Button>
          <Button className="flex-1 justify-center" disabled={!destId} loading={isCopying} onClick={handleCopy}>
            Copy Here
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

// ─── Row button ───────────────────────────────────────────────────────────────
function RowBtn({
  title,
  onClick,
  danger = false,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-lg border-none cursor-pointer ${danger ? "bg-[rgba(248,113,113,0.1)] text-error" : "bg-surface-3 text-text-muted"}`}
    >
      {children}
    </button>
  );
}
