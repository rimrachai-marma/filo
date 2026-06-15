import { FolderEmptyState } from "@/components/Emptystate";
import { FileTable } from "@/app/dashboard/_components/FileTable";
import { FolderGrid } from "@/app/dashboard/_components/Foldergrid";
import { get } from "@/lib/api.server";
import { FileItem, Folder } from "@/types";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FolderContentSkeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/TopBar";

interface Props {
  params: Promise<{ folderId: string }>;
}

export default async function FolderPage({ params }: Props) {
  const { folderId } = await params;

  const crumbsRes = await get<{ id: string; name: string }[]>({ path: `/folders/${folderId}/breadcrumbs` });

  if (crumbsRes.status !== "success") notFound();

  const crumbs = [{ id: null, name: "Root" }, ...crumbsRes.data];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar crumbs={crumbs} currentId={folderId} />

      <div className="flex-1 p-6">
        <ErrorBoundary>
          <Suspense fallback={<FolderContentSkeleton />}>
            <FolderFileList folderId={folderId} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

async function FolderFileList({ folderId }: { folderId: string }) {
  const [subfolderRes, fileRes] = await Promise.all([
    get<Folder[]>({ path: "/folders", query: { parentId: folderId } }),
    get<FileItem[]>({ path: "/files", query: { folderId } }),
  ]);

  if (subfolderRes.status === "error" || fileRes.status === "error") throw new Error("Failed to load folder contents");

  if (subfolderRes.data.length === 0 && fileRes.data.length === 0) return <FolderEmptyState />;

  return (
    <>
      <FolderGrid folders={subfolderRes.data} currentId={folderId} />
      <FileTable files={fileRes.data} />
    </>
  );
}
