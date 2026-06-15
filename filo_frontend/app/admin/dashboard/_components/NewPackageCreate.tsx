"use client";

import Button from "@/components/ui/Button";
import { createPackage } from "@/lib/actions/packages";
import { PackageFormData, packageFormSchema } from "@/lib/schemas/packages";
import { useForm } from "react-hook-form";
import React, { useRef } from "react";
import Modal from "@/components/ui/Modal";
import PackageForm from "./PackageForm";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@/components/ui/Alert";

export const NewPackageCreate: React.FC = () => {
  const router = useRouter();

  const createModalRef = useRef<HTMLDialogElement>(null);

  const [createState, createAction, isCreating] = React.useActionState(createPackage, null);

  const createForm = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      maxFolders: 10,
      maxNestingLevel: 3,
      allowedFileTypes: ["IMAGE", "PDF"],
      maxFileSizeMB: 10,
      storageLimitMB: 512,
      totalFileLimit: 50,
      filesPerFolder: 10,
      tierColor: "#38bdf8",
    },
  });

  React.useEffect(() => {
    if (createState?.status === "success") {
      createModalRef.current?.close();
      router.refresh();
    }

    if (createState?.status === "error") {
      if (createState.errors) {
        Object.entries(createState.errors).forEach(([f, messages]) => {
          createForm.setError(f as keyof PackageFormData, { message: messages[0] });
        });
      }
    }
  }, [createState, router, createForm]);

  const onCreateSubmit = (data: PackageFormData) => {
    React.startTransition(() => createAction(data));
  };

  const openCreate = () => {
    requestAnimationFrame(() => createModalRef.current?.showModal());
  };

  return (
    <>
      <Button onClick={openCreate} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-[#0a0f1e] border-none">
        + New Package
      </Button>

      <Modal
        ref={createModalRef}
        modalRef={createModalRef}
        title="Create Package"
        onClose={() =>
          createForm.reset({
            name: "",
            displayName: "",
            maxFolders: 10,
            maxNestingLevel: 3,
            allowedFileTypes: ["IMAGE", "PDF"],
            maxFileSizeMB: 10,
            storageLimitMB: 512,
            totalFileLimit: 50,
            filesPerFolder: 10,
            tierColor: "#38bdf8",
          })
        }
      >
        {!isCreating && createState?.status === "error" && (
          <div className="mb-2.5">
            <Alert type="error">{createState.message}</Alert>
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto">
          <PackageForm
            form={createForm}
            onSubmit={onCreateSubmit}
            isPending={isCreating}
            mode="create"
            onCancel={() => createModalRef.current?.close()}
          />
        </div>
      </Modal>
    </>
  );
};

export default NewPackageCreate;
