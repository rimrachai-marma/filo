import React, { Suspense } from "react";

import { get } from "@/lib/api.server";
import type { ShareLink } from "@/types";
import { SidebarTrigger } from "@/components/Sidebar/SidebarTrigger";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SharesListSkeleton } from "@/components/ui/Skeleton";
import SharesList from "./_components/SharesList";

export default function SharesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 flex h-16 items-center px-6 border-b border-border bg-surface/85 backdrop-blur-md">
        <SidebarTrigger />
        <h1 className="ml-2 font-display font-bold text-text">Shared Links</h1>
      </div>

      <div className="p-6 max-w-3xl w-full mx-auto">
        <Suspense fallback={<SharesListSkeleton />}>
          <ErrorBoundary>
            <SharesLoader />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}

function SharesLoader() {
  const res = React.use(get<ShareLink[]>({ path: "/share" }));

  if (res.status === "error") throw new Error(res.message);

  return <SharesList links={res.data} />;
}
