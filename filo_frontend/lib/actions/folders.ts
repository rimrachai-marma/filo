"use server";

import { patch, del, post } from "@/lib/api.server";
import type { MutationState } from "@/types";
import type { Folder } from "@/types";

export async function createFolder(
  _prev: MutationState<Folder> | null,
  payload: { name: string; parentId: string | null },
): Promise<MutationState<Folder>> {
  return post<Folder>({ path: "/folders", body: payload });
}

export async function renameFolder(
  _prev: MutationState<Folder> | null,
  payload: { id: string; name: string },
): Promise<MutationState<Folder>> {
  return patch<Folder>({ path: `/folders/${payload.id}`, body: { name: payload.name } });
}

export async function deleteFolder(_prev: MutationState | null, payload: { id: string }): Promise<MutationState> {
  return del({ path: `/folders/${payload.id}` });
}

export async function moveFolder(
  _prev: MutationState | null,
  payload: { id: string; targetParentId: string | null },
): Promise<MutationState> {
  return post({ path: `/folders/${payload.id}/move`, body: { targetParentId: payload.targetParentId } });
}
