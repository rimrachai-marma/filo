"use client";

import React from "react";
import { ChevronDownIcon, ChevronUpIcon, UploadCloudIcon } from "lucide-react";
import { useUploadContext } from "@/lib/context/UploadContext";
import Spinner from "@/components/ui/Spinner";
import UploadRow from "./UploadRow";

export function UploadDrawer() {
  const { items, activeCount, hasFinished, dismissAll } = useUploadContext();
  const [collapsed, setCollapsed] = React.useState(false);

  if (items.length === 0) return null;

  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  let headerLabel: string;
  if (activeCount > 0) {
    headerLabel = `Uploading ${activeCount} file${activeCount > 1 ? "s" : ""}…`;
  } else if (errorCount > 0) {
    headerLabel = `${errorCount} failed · ${doneCount} done`;
  } else {
    headerLabel = `${doneCount} upload${doneCount > 1 ? "s" : ""} complete`;
  }

  return (
    <div className="bg-surface fixed bottom-5 right-5 z-50 w-85 rounded-xl overflow-hidden shadow-2xl border border-border animate-slide-up">
      {/* Header */}
      <div
        className="bg-surface-2 flex items-center justify-between px-4 py-3 border-b border-border cursor-pointer select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <UploadCloudIcon size={15} className={activeCount > 0 ? "text-accent" : "text-text-muted"} />
          <span className="text-sm font-medium text-text">{headerLabel}</span>

          {activeCount > 0 && <Spinner size={12} />}
        </div>

        <div className="flex items-center gap-1.5">
          {hasFinished && !activeCount && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissAll();
              }}
              className="text-[11px] px-2 py-0.5 rounded border border-border text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}

          {collapsed ? (
            <ChevronUpIcon size={14} className="text-text-muted" />
          ) : (
            <ChevronDownIcon size={14} className="text-text-muted" />
          )}
        </div>
      </div>

      {/* List */}
      {!collapsed && (
        <div className="max-h-80 overflow-y-auto">
          {items.map((item) => (
            <UploadRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
