"use client";

import React from "react";
import { UploadCloudIcon } from "lucide-react";
import { useUploadContext } from "@/lib/context/UploadContext";
import type { PendingSession } from "@/lib/hooks/useUpload";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ResumeRow from "./ResumeRow";

interface ResumePickerProps {
  modalRef: React.RefObject<HTMLDialogElement | null>;
}

export function ResumePicker({ modalRef }: ResumePickerProps) {
  const { pendingSessions, resumeSession } = useUploadContext();

  if (pendingSessions.length === 0) return null;

  const handleResume = (session: PendingSession, file: File) => {
    resumeSession(session, file);
    modalRef.current?.close();
  };

  return (
    <Modal
      ref={modalRef}
      modalRef={modalRef}
      title="Resume Uploads"
      subtitle={`${pendingSessions.length} interrupted upload${pendingSessions.length > 1 ? "s" : ""} found`}
      maxWidth="max-w-lg"
    >
      <div className="rounded-xl overflow-hidden border border-border -mx-1">
        {pendingSessions.map((session) => (
          <ResumeRow key={session.sessionId} session={session} onResume={handleResume} />
        ))}
      </div>

      <p className="mt-3 text-xs text-text-muted">
        Select the same file again to continue where you left off. Sessions expire after 24 hours.
      </p>

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => modalRef.current?.close()}>
          Dismiss
        </Button>
      </div>
    </Modal>
  );
}

export function ResumePickerTrigger() {
  const { pendingSessions } = useUploadContext();

  const modalRef = React.useRef<HTMLDialogElement>(null);

  if (pendingSessions.length === 0) return null;

  return (
    <>
      <button
        onClick={() => modalRef.current?.showModal()}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium border border-[rgba(56,189,248,0.25)] bg-[rgba(56,189,248,0.06)] text-accent cursor-pointer hover:bg-[rgba(56,189,248,0.12)] transition-colors"
      >
        <UploadCloudIcon size={14} />
        <span className="flex-1 text-left">
          {pendingSessions.length} upload{pendingSessions.length > 1 ? "s" : ""} paused
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-background font-bold">
          {pendingSessions.length}
        </span>
      </button>

      <ResumePicker modalRef={modalRef} />
    </>
  );
}
