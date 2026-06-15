"use server";

import { patch, del, post, upload } from "@/lib/api.server";
import type { MutationState } from "@/types";
import type { FileItem } from "@/types";

export async function uploadFiles(
  _prev: MutationState | null,
  payload: { folderId: string; formData: FormData },
): Promise<MutationState> {
  return upload({ path: `/files`, body: payload.formData });
}

export async function renameFile(
  _prev: MutationState<FileItem> | null,
  payload: { id: string; name: string },
): Promise<MutationState<FileItem>> {
  return patch<FileItem>({ path: `/files/${payload.id}`, body: { name: payload.name } });
}

export async function deleteFile(_prev: MutationState | null, payload: { id: string }): Promise<MutationState> {
  return del({ path: `/files/${payload.id}` });
}

export async function moveFile(
  _prev: MutationState | null,
  payload: { id: string; targetFolderId: string },
): Promise<MutationState> {
  return post({ path: `/files/${payload.id}/move`, body: { targetFolderId: payload.targetFolderId } });
}

export async function copyFile(
  _prev: MutationState<FileItem> | null,
  payload: { id: string; targetFolderId: string },
): Promise<MutationState<FileItem>> {
  return post<FileItem>({ path: `/files/${payload.id}/copy`, body: { targetFolderId: payload.targetFolderId } });
}
