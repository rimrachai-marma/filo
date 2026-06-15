import { get } from "@/lib/api.server";
import { notFound } from "next/navigation";
import type { PublicFolderContents } from "@/types";
import SharedFolderView from "@/app/share/_components/SharedFolderView";

interface Props {
  params: Promise<{ token: string; folderId: string }>;
}

export default async function SharedSubFolderPage({ params }: Props) {
  const { token, folderId } = await params;

  const res = await get<PublicFolderContents>({
    path: `/public/share/${token}/folders/${folderId}`,
  });

  if (res.status === "error") notFound();

  return (
    <SharedFolderView
      token={token}
      child={res.data.children}
      files={res.data.files}
      breadcrumbs={res.data.breadcrumbs}
    />
  );
}
