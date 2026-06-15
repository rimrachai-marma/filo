"use client";

import React from "react";
import { DownloadIcon } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api/v1";

export default function SharedFileDownloadButton({ token, fileId }: { token: string; fileId: string }) {
  const [loading, setLoading] = React.useState(false);

  const handleDownload = async () => {
    setLoading(true);

    const res = await fetch(`${API_BASE}/public/share/${token}/files/${fileId}/download`);
    const json = await res.json();

    setLoading(false);

    if (json.status === "success") window.open(json.data.url, "_blank");
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title="Download"
      className="p-1.5 rounded-lg bg-surface-3 text-text-muted cursor-pointer shrink-0 disabled:opacity-50"
    >
      {loading ? <Spinner size={13} /> : <DownloadIcon size={13} />}
    </button>
  );
}
