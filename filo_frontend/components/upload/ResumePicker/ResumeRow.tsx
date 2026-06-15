"use client";

import React from "react";
import { RefreshCwIcon, ClockIcon } from "lucide-react";

import type { PendingSession } from "@/lib/hooks/useUpload";
import { formatData, timeUntil } from "@/lib/utils";

interface Props {
  session: PendingSession;
  onResume: (session: PendingSession, file: File) => void;
}

export default function ResumeRow({ session, onResume }: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onResume(session, file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border last:border-0">
      {/* Progress ring */}
      <div className="relative shrink-0 w-9 h-9">
        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-surface-3)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 15}`}
            strokeDashoffset={`${2 * Math.PI * 15 * (1 - session.percentComplete / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-accent">
          {session.percentComplete}%
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate" title={session.fileName}>
          {session.fileName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-text-muted font-mono">
            {formatData(BigInt(session.uploadedBytes))} / {formatData(BigInt(session.sizeBytes))}
          </span>
          <span className="text-[11px] text-text-muted">·</span>
          <span className="text-[11px] text-text-muted flex items-center gap-0.5">
            <ClockIcon size={9} />
            {timeUntil(session.expiresAt)}
          </span>
        </div>
      </div>

      {/* Resume — clicking opens the file picker */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgba(56,189,248,0.3)] text-accent bg-[rgba(56,189,248,0.08)] hover:bg-[rgba(56,189,248,0.15)] transition-colors cursor-pointer"
        title="Select the same file to resume uploading"
      >
        <RefreshCwIcon size={11} />
        Resume
      </button>

      {/* Hidden file input — user must re-select the original file */}
      <input ref={fileInputRef} type="file" className="hidden" accept={session.mimeType} onChange={handleFileSelect} />
    </div>
  );
}
