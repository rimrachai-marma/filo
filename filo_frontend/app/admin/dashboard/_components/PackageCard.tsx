"use client";

import { formatData } from "@/lib/utils";
import { FileType, Package } from "@/types";
import { FileIcon, ImageIcon, MusicIcon, PencilIcon, Trash2Icon, VideoIcon } from "lucide-react";
import React from "react";

const TYPE_ICONS: Record<FileType, React.ReactNode> = {
  IMAGE: <ImageIcon size={14} />,
  VIDEO: <VideoIcon size={14} />,
  PDF: <FileIcon size={14} />,
  AUDIO: <MusicIcon size={14} />,
};

interface Props {
  pkg: Package;
  onEdit: () => void;
  onDelete: () => void;
}

const PackageCard: React.FC<Props> = ({ pkg, onEdit, onDelete }) => {
  return (
    <div
      className="relative overflow-hidden rounded-lg border-[1.5px] border-[color-mix(in_srgb,var(--tc)_15%,transparent)] p-6"
      style={{ "--tc": pkg.tierColor } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-mono font-semibold mb-0.5 text-(--tc)">{pkg.name}</div>
          <h3 className="text-xl font-display font-bold text-text">{pkg.displayName}</h3>
          <div className="text-xs mt-0.5 text-text-muted">{pkg._count?.userSubscriptions ?? 0} active subscribers</div>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={onEdit}
            title="Edit"
            className="p-1.5 rounded-lg bg-surface-2 border border-border text-text-muted cursor-pointer"
          >
            <PencilIcon size={13} />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-1.5 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-error cursor-pointer"
          >
            <Trash2Icon size={13} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {(
          [
            ["Max Folders", pkg.maxFolders],
            ["Nesting Levels", pkg.maxNestingLevel],
            ["Max File Size", formatData(BigInt(pkg.maxFileSizeBytes))],
            ["Storage Limit", formatData(BigInt(pkg.storageLimitBytes))],
            ["Total Files", pkg.totalFileLimit],
            ["Files per Folder", pkg.filesPerFolder],
          ] as [string, string | number][]
        ).map(([label, value]) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-text-muted">{label}</span>
            <span className="text-xs font-mono text-text">{value}</span>
          </div>
        ))}

        <div className="pt-2 border-t border-border">
          <div className="flex gap-1.5 flex-wrap mt-1">
            {pkg.allowedFileTypes.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded-md font-mono flex items-center gap-1 text-(--tc) bg-[color-mix(in_srgb,var(--tc)_7%,transparent)] border border-[color-mix(in_srgb,var(--tc)_19%,transparent)]"
              >
                {TYPE_ICONS[t as FileType]} {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
