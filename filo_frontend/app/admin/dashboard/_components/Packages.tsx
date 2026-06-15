"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { updatePackage, deletePackage } from "@/lib/actions/packages";
import { packageFormSchema, type PackageFormData, type FileType } from "@/lib/schemas/packages";
import type { Package } from "@/types";
import PackageCard from "./PackageCard";
import PackageForm from "./PackageForm";
import { bytesToMB } from "@/lib/utils";
import Alert from "@/components/ui/Alert";

interface Props {
  packages: Package[];
}

export default function Packages({ packages }: Props) {
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<Package | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);

  const editModalRef = useRef<HTMLDialogElement>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);

  const [updateState, updateAction, isUpdating] = React.useActionState(updatePackage, null);

  const editForm = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
  });

  React.useEffect(() => {
    if (updateState?.status === "success") {
      editModalRef.current?.close();
      router.refresh();
    }

    if (updateState?.status === "error") {
      if (updateState.errors) {
        Object.entries(updateState.errors).forEach(([f, messages]) => {
          editForm.setError(f as keyof PackageFormData, { message: messages[0] });
        });
      }
    }
  }, [updateState, router, editForm]);

  const [deleteState, deleteAction, isDeleting] = React.useActionState(deletePackage, null);

  React.useEffect(() => {
    if (deleteState?.status === "success") {
      deleteModalRef.current?.close();
      router.refresh();
    }
  }, [deleteState, router]);

  const openEdit = (pkg: Package) => {
    setEditTarget(pkg);
    editForm.reset({
      name: pkg.name,
      displayName: pkg.displayName,
      maxFolders: pkg.maxFolders,
      maxNestingLevel: pkg.maxNestingLevel,
      allowedFileTypes: pkg.allowedFileTypes as FileType[],
      maxFileSizeMB: bytesToMB(BigInt(pkg.maxFileSizeBytes)),
      storageLimitMB: bytesToMB(BigInt(pkg.storageLimitBytes)),
      totalFileLimit: pkg.totalFileLimit,
      filesPerFolder: pkg.filesPerFolder,
      tierColor: pkg.tierColor,
    });
    requestAnimationFrame(() => editModalRef.current?.showModal());
  };

  const openDelete = (pkg: Package) => {
    setDeleteTarget(pkg);
    requestAnimationFrame(() => deleteModalRef.current?.showModal());
  };

  // ─── Submit handlers ─────────────────────────────────────────────────────────
  const onEditSubmit = (data: PackageFormData) => {
    if (!editTarget) return;
    React.startTransition(() => updateAction({ id: editTarget.id, data }));
  };

  const onDeleteConfirm = () => {
    if (!deleteTarget) return;
    React.startTransition(() => deleteAction(deleteTarget.id));
  };

  if (packages.length === 0) {
    return (
      <div className="text-center py-24 text-text-muted">
        <p className="text-lg font-display mb-1">No packages yet</p>
        <p className="text-sm">Create your first subscription package above.</p>
      </div>
    );
  }

  return (
    <>
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} onEdit={() => openEdit(pkg)} onDelete={() => openDelete(pkg)} />
      ))}

      <Modal ref={editModalRef} modalRef={editModalRef} title="Edit Package" onClose={() => setEditTarget(null)}>
        {!isUpdating && updateState?.status === "error" && (
          <div className="mb-2.5">
            <Alert type="error">{updateState.message}</Alert>
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto">
          <PackageForm
            form={editForm}
            onSubmit={onEditSubmit}
            isPending={isUpdating}
            mode="edit"
            onCancel={() => editModalRef.current?.close()}
          />
        </div>
      </Modal>

      <Modal
        ref={deleteModalRef}
        modalRef={deleteModalRef}
        title="Delete Package?"
        onClose={() => setDeleteTarget(null)}
      >
        {!isDeleting && deleteState?.status === "error" && (
          <div className="mb-2.5">
            <Alert type="error">{deleteState.message}</Alert>
          </div>
        )}

        <p className="text-sm mb-6 text-text-muted">
          Are you sure you want to delete <strong className="text-text">{deleteTarget?.displayName}</strong>? This
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => deleteModalRef.current?.close()}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1 justify-center" loading={isDeleting} onClick={onDeleteConfirm}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
