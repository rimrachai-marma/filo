"use client";

import { PanelLeft } from "lucide-react";
import { useSidebar } from "./SidebarContext";

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      className={`p-2 rounded-lg text-text-muted hover:bg-surface-2 transition cursor-pointer ${className ?? ""}`}
    >
      <PanelLeft className="size-4" />
    </button>
  );
}
