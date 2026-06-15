"use server";

import { post, patch, del } from "@/lib/api.server";
import type { MutationState, Package } from "@/types";
import { type PackageFormData } from "@/lib/schemas/packages";
import { mbToBytes } from "@/lib/utils";

export async function createPackage(
  _prev: MutationState<Package> | null,
  data: PackageFormData,
): Promise<MutationState<Package>> {
  return post<Package>({
    path: "/admin/packages",
    body: {
      name: data.name,
      displayName: data.displayName,
      maxFolders: data.maxFolders,
      maxNestingLevel: data.maxNestingLevel,
      types: data.allowedFileTypes,
      maxFileSizeBytes: Number(mbToBytes(data.maxFileSizeMB)), // Convert to number for API compatibility
      totalFileLimit: data.totalFileLimit,
      filesPerFolder: data.filesPerFolder,
      storageLimitBytes: mbToBytes(data.storageLimitMB).toString(), // Convert to string to handle large values safely
      tierColor: data.tierColor,
    },
    tokenKind: "admin",
  });
}

export async function updatePackage(
  _prev: MutationState<Package> | null,
  payload: { id: string; data: PackageFormData },
): Promise<MutationState<Package>> {
  return patch<Package>({
    path: `/admin/packages/${payload.id}`,
    body: {
      name: payload.data.name,
      displayName: payload.data.displayName,
      maxFolders: payload.data.maxFolders,
      maxNestingLevel: payload.data.maxNestingLevel,
      types: payload.data.allowedFileTypes,
      maxFileSizeBytes: Number(mbToBytes(payload.data.maxFileSizeMB)), // Convert to number for API compatibility
      totalFileLimit: payload.data.totalFileLimit,
      filesPerFolder: payload.data.filesPerFolder,
      storageLimitBytes: mbToBytes(payload.data.storageLimitMB).toString(),
      tierColor: payload.data.tierColor,
    },
    tokenKind: "admin",
  });
}

export async function deletePackage(_prev: MutationState | null, id: string): Promise<MutationState> {
  return del({
    path: `/admin/packages/${id}`,
    tokenKind: "admin",
  });
}
