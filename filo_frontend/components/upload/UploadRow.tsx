import { CheckIcon, XIcon, AlertCircleIcon, ZapIcon, RefreshCwIcon } from "lucide-react";

import Spinner from "@/components/ui/Spinner";
import type { UploadItem } from "@/lib/hooks/useUpload";
import { useUploadContext } from "@/lib/context/UploadContext";
import { formatData, formatSpeed, formatTime, truncateName } from "@/lib/utils";

function getDisplayName(item: UploadItem): string {
  if (item.file?.name) return item.file.name;
  return item.sessionId ? "Resuming upload…" : "Unknown file";
}

export default function UploadRow({ item }: { item: UploadItem }) {
  const { abortUpload, dismissItem, retryUpload } = useUploadContext();

  const isActive = item.status === "uploading" || item.status === "completing";
  const isDone = item.status === "done";
  const isError = item.status === "error";
  const isAborted = item.status === "aborted";

  const progressColor = isError ? "var(--color-error)" : isDone ? "var(--color-success)" : "var(--color-accent)";

  const displayName = getDisplayName(item);

  return (
    <div className="px-4 py-3 border-b border-border last:border-0">
      {/* File name + status icon */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Status icon */}
          <span className="shrink-0">
            {isActive && <Spinner size={14} />}
            {isDone && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[rgba(52,211,153,0.15)]">
                <CheckIcon size={10} className="text-success" />
              </span>
            )}
            {isError && <AlertCircleIcon size={14} className="text-error" />}
            {isAborted && <XIcon size={14} className="text-text-muted" />}
          </span>

          <span className="text-xs font-medium truncate text-text" title={displayName}>
            {truncateName(displayName)}
          </span>

          {item.strategy === "multipart" && isActive && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-mono bg-[rgba(56,189,248,0.08)] text-accent border border-[rgba(56,189,248,0.15)]">
              multipart
            </span>
          )}
        </div>

        {/* Action button */}
        {isError && (
          <button
            onClick={() => retryUpload(item.id)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-[rgba(56,189,248,0.3)] text-accent bg-[rgba(56,189,248,0.08)] hover:bg-[rgba(56,189,248,0.15)] transition-colors cursor-pointer"
            title="Retry upload"
          >
            <RefreshCwIcon size={9} />
            Retry
          </button>
        )}

        {(isDone || isError || isAborted) && (
          <button
            onClick={() => dismissItem(item.id)}
            className="shrink-0 p-0.5 rounded text-text-muted hover:text-text transition-colors cursor-pointer"
            title="Dismiss"
          >
            <XIcon size={12} />
          </button>
        )}

        {isActive && (
          <button
            onClick={() => abortUpload(item.id)}
            className="shrink-0 text-[10px] px-2 py-0.5 rounded border border-border text-text-muted hover:text-error hover:border-error/40 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress bar */}
      {(isActive || isDone) && (
        <div className="h-1 rounded-full bg-surface-3 overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${item.progress}%`,
              background: progressColor,
              boxShadow: isDone ? "none" : `0 0 6px ${progressColor}60`,
            }}
          />
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between">
        {item.status === "uploading" && (
          <>
            <span className="text-[11px] text-text-muted font-mono">
              {formatData(BigInt(item.uploadedBytes))} / {formatData(BigInt(item.totalBytes))}
            </span>

            <div className="flex items-center gap-2">
              {item.speed > 0 && (
                <span className="text-[11px] text-text-muted font-mono flex items-center gap-0.5">
                  <ZapIcon size={9} className="text-accent" />
                  {formatSpeed(item.speed, "en-US")}
                </span>
              )}

              {item.timeRemaining !== null && item.timeRemaining > 0 && (
                <span className="text-[11px] text-text-muted font-mono">{formatTime(item.timeRemaining, "en-US")}</span>
              )}

              <span className="text-[11px] font-mono text-accent">{item.progress}%</span>
            </div>
          </>
        )}

        {item.status === "completing" && <span className="text-[11px] text-text-muted">Finalising…</span>}

        {isDone && <span className="text-[11px] text-success">{formatData(BigInt(item.totalBytes))} · Done</span>}

        {isError && (
          <span className="text-[11px] text-error truncate max-w-full" title={item.error ?? ""}>
            {item.error ?? "Upload failed"}
          </span>
        )}

        {isAborted && <span className="text-[11px] text-text-muted">Cancelled</span>}
      </div>
    </div>
  );
}
