import React from "react";
import { UseFormReturn } from "react-hook-form";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { FileIcon, ImageIcon, MusicIcon, VideoIcon } from "lucide-react";

import { ALL_FILE_TYPES, FileType, PackageFormData } from "@/lib/schemas/packages";

const TYPE_ICONS: Record<FileType, React.ReactNode> = {
  IMAGE: <ImageIcon size={14} />,
  VIDEO: <VideoIcon size={14} />,
  PDF: <FileIcon size={14} />,
  AUDIO: <MusicIcon size={14} />,
};

const NUMERIC_FIELDS: {
  label: string;
  key: keyof PackageFormData;
  step?: string;
  min?: string;
}[] = [
  { label: "Max Folders", key: "maxFolders" },
  { label: "Max Nesting Levels", key: "maxNestingLevel", min: "0" },
  { label: "Max File Size (MB)", key: "maxFileSizeMB", step: "0.01" },
  { label: "Storage Limit (MB)", key: "storageLimitMB", step: "0.01" },
  { label: "Total File Limit", key: "totalFileLimit" },
  { label: "Files per Folder", key: "filesPerFolder" },
];

interface Props {
  form: UseFormReturn<PackageFormData>;
  onSubmit: (data: PackageFormData) => void;
  isPending: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
}

const PackageForm: React.FC<Props> = ({ form, onSubmit, isPending, mode, onCancel }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedTypes = watch("allowedFileTypes");

  const toggleType = (t: FileType) => {
    const current = selectedTypes ?? [];
    setValue("allowedFileTypes", current.includes(t) ? current.filter((x) => x !== t) : [...current, t], {
      shouldValidate: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Name row — name is immutable after creation */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Name (ID)"
          placeholder="SILVER"
          error={errors.name?.message}
          disabled={mode === "edit"}
          {...register("name", {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              e.target.value = e.target.value.toUpperCase();
            },
          })}
        />
        <Input
          label="Display Name"
          placeholder="Silver"
          error={errors.displayName?.message}
          {...register("displayName")}
        />
      </div>

      {/* Numeric fields */}
      {NUMERIC_FIELDS.map(({ label, key, step, min }) => (
        <Input
          key={key}
          label={label}
          type="number"
          step={step ?? "1"}
          min={min ?? "1"}
          error={errors[key]?.message as string | undefined}
          {...register(key, { valueAsNumber: true })}
        />
      ))}

      <Input label="Tier Color" placeholder="#38bdf8" error={errors.tierColor?.message} {...register("tierColor")} />

      {/* File type toggles */}
      <div>
        <p className="text-sm font-medium mb-2 text-text">Allowed File Types</p>
        <div className="flex gap-2 flex-wrap">
          {ALL_FILE_TYPES.map((t) => {
            const isSelected = selectedTypes?.includes(t);

            const conditionalClasses = isSelected
              ? "bg-amber-400/15 border-amber-400/50 text-amber-400"
              : "bg-surface-2 border-border text-text-muted";

            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 border ${conditionalClasses}`}
              >
                {TYPE_ICONS[t]} {t}
              </button>
            );
          })}
        </div>
        {errors.allowedFileTypes && (
          <p className="mt-1.5 text-xs text-error">{errors.allowedFileTypes.message as string}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isPending}
          className="flex-1 justify-center bg-[#fbbf24] text-[#0a0f1e] border-none"
        >
          {mode === "create" ? "Create" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default PackageForm;
