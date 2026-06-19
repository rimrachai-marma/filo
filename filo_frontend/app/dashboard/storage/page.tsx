import React, { Suspense } from "react";

import { get } from "@/lib/api.server";
import type { StorageStats } from "@/types";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarTrigger } from "@/components/Sidebar/SidebarTrigger";
import StorageDashboard from "./_components/StorageDashboard";
import { StorageDashboardSkeleton } from "@/components/ui/Skeleton";

export default function StoragePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 flex h-16 items-center px-6 border-b border-border bg-surface/85 backdrop-blur-md">
        <SidebarTrigger />
        <h1 className="ml-2 font-display font-bold text-text">Storage Insights</h1>
      </div>

      <div className="p-6 max-w-4xl w-full mx-auto">
        <Suspense fallback={<StorageDashboardSkeleton />}>
          <ErrorBoundary>
            <StorageStatsLoader />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}

function StorageStatsLoader() {
  const res = React.use(get<StorageStats>({ path: "/stats/storage" }));
  if (res.status === "error") throw new Error(res.message);
  return <StorageDashboard stats={res.data} />;
}
