import { formatData } from "@/lib/utils";
import type { StorageStats, FileType } from "@/types";
import { ImageIcon, VideoIcon, MusicIcon, FileIcon } from "lucide-react";

const TYPE_META: Record<FileType, { label: string; color: string; icon: React.ReactNode }> = {
  IMAGE: { label: "Images", color: "#38bdf8", icon: <ImageIcon size={14} /> },
  VIDEO: { label: "Videos", color: "#f472b6", icon: <VideoIcon size={14} /> },
  PDF: { label: "PDFs", color: "#fb923c", icon: <FileIcon size={14} /> },
  AUDIO: { label: "Audio", color: "#a78bfa", icon: <MusicIcon size={14} /> },
};

export default function StorageDashboard({ stats }: { stats: StorageStats }) {
  const used = BigInt(stats.usedBytes);
  const limit = BigInt(stats.limitBytes);
  const percentUsed = Math.min(100, stats.percentUsed);

  const totalForBar = used > BigInt(0) ? used : BigInt(1);

  return (
    <div className="space-y-8">
      {/* Overview card */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Storage Used</p>
            <p className="text-2xl font-display font-bold text-text">
              {formatData(used)} <span className="text-sm font-normal text-text-muted">/ {formatData(limit)}</span>
            </p>
          </div>
          {stats.package && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium border"
              style={{
                color: stats.package.tierColor,
                borderColor: `${stats.package.tierColor}40`,
                background: `${stats.package.tierColor}10`,
              }}
            >
              {stats.package.displayName} plan
            </span>
          )}
        </div>

        {/* Stacked usage bar */}
        <div className="h-3 rounded-full bg-surface-3 overflow-hidden flex">
          {Object.entries(stats.byType).map(([type, val]) => {
            if (val.sizeBytes === 0) return null;

            const width = (BigInt(val.sizeBytes) * BigInt(10000)) / totalForBar;

            return (
              <div
                key={type}
                style={{ width: `${Number(width) / 100}%`, background: TYPE_META[type as FileType].color }}
                title={`${TYPE_META[type as FileType].label}: ${formatData(BigInt(val.sizeBytes))}`}
              />
            );
          })}
        </div>

        <p className="text-xs text-text-muted mt-2">{percentUsed.toFixed(1)}% of your plan&apos;s storage used</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {Object.entries(stats.byType).map(([type, val]) => {
            const meta = TYPE_META[type as FileType];
            return (
              <div key={type} className="rounded-xl border border-border bg-surface-2 p-3">
                <div className="flex items-center gap-1.5 mb-1" style={{ color: meta.color }}>
                  {meta.icon}
                  <span className="text-xs font-medium">{meta.label}</span>
                </div>
                <p className="text-sm font-semibold text-text">{formatData(BigInt(val.sizeBytes))}</p>
                <p className="text-xs text-text-muted">{val.count} files</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Files</p>
          <p className="text-2xl font-display font-bold text-text">{stats.totalFiles}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Folders</p>
          <p className="text-2xl font-display font-bold text-text">{stats.totalFolders}</p>
        </div>
      </div>

      {/* Largest files */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Largest Files</h2>
        </div>
        {stats.topFiles.length === 0 ? (
          <p className="text-sm text-text-muted px-5 py-6">No files yet.</p>
        ) : (
          <div>
            {stats.topFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span style={{ color: TYPE_META[f.type].color }}>{TYPE_META[f.type].icon}</span>
                  <span className="text-sm text-text truncate">{f.name}</span>
                </div>
                <span className="text-xs text-text-muted font-mono shrink-0 ml-3">
                  {formatData(BigInt(f.sizeBytes))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
