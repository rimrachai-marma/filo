import Link from "next/link";

import { formatData } from "@/lib/utils";
import SharedFileDownloadButton from "./SharedFileDownloadButton";
import type { PublicShareFile, PublicShareFolderChild, FileType } from "@/types";
import { FolderIcon, ImageIcon, VideoIcon, MusicIcon, FileIcon, ChevronRightIcon } from "lucide-react";

const TYPE_ICONS: Record<FileType, React.ReactNode> = {
  IMAGE: <ImageIcon size={16} />,
  VIDEO: <VideoIcon size={16} />,
  PDF: <FileIcon size={16} />,
  AUDIO: <MusicIcon size={16} />,
};

interface Props {
  token: string;
  child: PublicShareFolderChild[];
  files: PublicShareFile[];
  breadcrumbs: { id: string; name: string }[];
}

export default function SharedFolderView({ token, child, files, breadcrumbs }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 mb-6 flex-wrap">
          {breadcrumbs.map((crumb, i) => {
            const href = i === 0 ? `/share/${token}` : `/share/${token}/folders/${crumb.id}`;

            return (
              <span key={crumb.id} className="flex items-center gap-1">
                {i > 0 && <ChevronRightIcon className="size-4 text-text-muted" />}

                {i === breadcrumbs.length - 1 ? (
                  <span className="text-sm font-medium text-text px-0.5">{crumb.name}</span>
                ) : (
                  <Link
                    href={href}
                    className="text-sm font-medium text-text-muted hover:text-text px-0.5 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        {/* Contents */}
        <div className="rounded-2xl overflow-hidden border border-border">
          {child.length === 0 && files.length === 0 ? (
            <p className="text-sm text-text-muted p-6 text-center">This folder is empty.</p>
          ) : (
            <>
              {child.map((c) => (
                <Link
                  key={c.id}
                  href={`/share/${token}/folders/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-surface hover:bg-surface-2 transition-colors"
                >
                  <FolderIcon className="fill-warning text-warning size-5 shrink-0" />
                  <span className="text-sm text-text flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-text-muted shrink-0">
                    {c._count.children} sub · {c._count.files} files
                  </span>
                </Link>
              ))}

              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-surface-2"
                >
                  <span className="text-text-muted shrink-0">{TYPE_ICONS[f.type]}</span>
                  <span className="text-sm text-text flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-text-muted shrink-0 font-mono">{formatData(BigInt(f.sizeBytes))}</span>
                  <SharedFileDownloadButton token={token} fileId={f.id} />
                </div>
              ))}
            </>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">Shared via Filo</p>
      </div>
    </div>
  );
}
