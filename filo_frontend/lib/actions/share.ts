"use server";

import { post, get, del } from "@/lib/api.server";
import type { MutationState, ShareLink } from "@/types";

export async function createFileShareLink(
  _prev: MutationState<ShareLink> | null,
  payload: { fileId: string; expiresInHours?: number },
): Promise<MutationState<ShareLink>> {
  return post<ShareLink>({ path: "/share/files", body: payload });
}

export async function createFolderShareLink(
  _prev: MutationState<ShareLink> | null,
  payload: { folderId: string; expiresInHours?: number },
): Promise<MutationState<ShareLink>> {
  return post<ShareLink>({ path: "/share/folders", body: payload });
}

export async function shareLinks() {
  return get<ShareLink[]>({ path: "/share" });
}

export async function revokeShareLink(_prev: MutationState | null, payload: { id: string }): Promise<MutationState> {
  return del({ path: `/share/${payload.id}` });
}
