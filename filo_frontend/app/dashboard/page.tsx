import type { Folder } from "@/types";
import { get } from "@/lib/api.server";
import { RootEmptyState } from "@/components/Emptystate";
import { FolderGrid } from "@/app/dashboard/_components/Foldergrid";
import { FolderGridSkeleton } from "@/components/ui/Skeleton";
import React, { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TopBar } from "@/components/TopBar";

export default async function FilesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar crumbs={[{ id: null, name: "Root" }]} currentId={null} />

      <div className="flex-1 p-6">
        <ErrorBoundary>
          <Suspense fallback={<FolderGridSkeleton />}>
            <RootFolderList />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

function RootFolderList() {
  const res = React.use(get<Folder[]>({ path: "/folders" }));

  if (res.status === "error") throw new Error(res.message);

  if (res.data.length === 0) return <RootEmptyState />;

  return <FolderGrid folders={res.data} currentId={null} />;
}
