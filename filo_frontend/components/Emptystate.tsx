"use client";

import React, { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "./ui/Modal";
import { createFolder } from "@/lib/actions/folders";
import { useRouter } from "next/navigation";
import { FolderIcon } from "lucide-react";

export function RootEmptyState() {
  const router = useRouter();
  const [name, setName] = useState("");
  const ref = useRef<HTMLDialogElement>(null);

  const [state, dispatch, isPending] = React.useActionState(createFolder, null);

  const handleCreate = async () => {
    if (!name.trim()) return;

    React.startTransition(() => dispatch({ name: name.trim(), parentId: null }));
  };

  const closeModal = (ref: React.RefObject<HTMLDialogElement | null>) => {
    ref.current?.close();

    setName("");
  };

  React.useEffect(() => {
    if (!state || state.status !== "success") return;
    ref.current?.close();
    router.refresh();
  }, [state, router]);

  return (
    <>
      <div className="text-center py-28">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border bg-surface">
          <FolderIcon className="size-6 text-text-muted" />
        </div>
        <h3 className="text-lg font-display font-semibold mb-2 text-text">No folders yet</h3>
        <p className="text-sm mb-5 text-text-muted">Create your first folder to get started</p>
        <Button onClick={() => ref.current?.showModal()}>Create Folder</Button>
      </div>

      <Modal ref={ref} modalRef={ref} onClose={() => closeModal(ref)} title="New Folder">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          placeholder="Folder name"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => closeModal(ref)}>
            Cancel
          </Button>
          <Button className="flex-1 justify-center" loading={isPending} onClick={handleCreate}>
            Create
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function FolderEmptyState() {
  return (
    <div className="text-center py-16 rounded-2xl" style={{ border: "1px dashed var(--color-border)" }}>
      <p className="text-sm mb-1 text-text-muted">This folder is empty</p>
      <p className="text-xs text-text-muted">Use the buttons above to create a subfolder or upload files</p>
    </div>
  );
}
