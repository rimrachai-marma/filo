"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { formatData } from "@/lib/utils";
import type { PublicShareFile, FileType } from "@/types";
import { FileIcon, ImageIcon, VideoIcon, MusicIcon, DownloadIcon, FolderOpen } from "lucide-react";

const TYPE_ICONS: Record<FileType, React.ReactNode> = {
  IMAGE: <ImageIcon className="size-8" />,
  VIDEO: <VideoIcon className="size-8" />,
  PDF: <FileIcon className="size-8" />,
  AUDIO: <MusicIcon className="size-8" />,
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api/v1";

export default function SharedFileView({ token, file }: { token: string; file: PublicShareFile }) {
  const [pending, setPending] = React.useState(false);

  const handleDownload = async () => {
    setPending(true);

    const res = await fetch(`${API_BASE}/public/share/${token}/download`);
    const json = await res.json();

    setPending(false);

    if (json.status === "success") window.open(json.data.url, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface border border-border text-center animate-slide-up">
        <div className="flex justify-center mb-4 text-accent">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent-dim">
            {TYPE_ICONS[file.type]}
          </div>
        </div>

        <h1 className="text-lg font-display font-bold text-text mb-1 wrap-break-word">{file.name}</h1>
        <p className="text-sm text-text-muted mb-6">{formatData(BigInt(file.sizeBytes))}</p>

        <Button onClick={handleDownload} loading={pending} className="w-full justify-center flex items-center gap-2">
          <DownloadIcon size={14} /> Download
        </Button>

        <Link href="/" className="mt-4 inline-flex items-center gap-1.5 text-xs text-text-muted">
          <FolderOpen className="size-3.5" /> Powered by Filo
        </Link>
      </div>
    </div>
  );
}
