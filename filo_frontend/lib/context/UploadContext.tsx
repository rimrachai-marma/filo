"use client";

import React, { createContext, useContext } from "react";
import { useUpload, UploadItem, PendingSession } from "@/lib/hooks/useUpload";

interface UploadContextValue {
  items: UploadItem[];
  pendingSessions: PendingSession[];
  activeCount: number;
  hasFinished: boolean;
  upload: (file: File, folderId: string) => string;
  uploads: (files: FileList | File[], folderId: string) => void;
  abortUpload: (uploadId: string) => void;
  dismissItem: (itemId: string) => void;
  dismissAll: () => void;
  loadPendingSessions: () => Promise<void>;
  resumeSession: (session: PendingSession, file: File) => void;
  retryUpload: (itemId: string) => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const upload = useUpload();

  upload.items.map((i) => i.status === "error");

  React.useEffect(() => {
    upload.loadPendingSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <UploadContext.Provider value={upload}>{children}</UploadContext.Provider>;
}

export function useUploadContext() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUploadContext must be used within UploadProvider");
  return ctx;
}
