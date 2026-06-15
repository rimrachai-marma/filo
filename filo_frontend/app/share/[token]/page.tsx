import { get } from "@/lib/api.server";
import type { PublicShareInfo } from "@/types";
import SharedFileView from "../_components/SharedFileView";
import SharedFolderView from "../_components/SharedFolderView";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const res = await get<PublicShareInfo>({ path: `/public/share/${token}` });

  if (res.status === "error") {
    return <SharedError message={res.message} />;
  }

  if (res.data.type === "file") {
    return <SharedFileView token={token} file={res.data.file} />;
  } else {
    return (
      <SharedFolderView
        token={token}
        child={res.data.children}
        files={res.data.files}
        breadcrumbs={[{ id: res.data.folder.id, name: res.data.folder.name }]}
      />
    );
  }
}

function SharedError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface border border-border text-center">
        <h1 className="text-xl font-display font-bold text-text mb-2">Link unavailable</h1>
        <p className="text-sm text-text-muted">{message}</p>
      </div>
    </div>
  );
}
