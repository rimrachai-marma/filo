export type MutationState<T = unknown> =
  | {
      status: "success";
      message: string;
      data?: T;
    }
  | {
      status: "error";
      message: string;
      errors?: Record<string, string[]>;
    };

export type FileType = "IMAGE" | "VIDEO" | "PDF" | "AUDIO";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Admin {
  id: string;
  email: string;
  createdAt: string;
}

export interface Token {
  token: string;
  tokenType: "Bearer";
}

export interface Package {
  id: string;
  name: string;
  displayName: string;
  maxFolders: number;
  maxNestingLevel: number;
  allowedFileTypes: FileType[];
  maxFileSizeBytes: number;
  totalFileLimit: number;
  filesPerFolder: number;
  storageLimitBytes: string;
  tierColor: string;
  createdAt: string;
  _count?: { userSubscriptions: number };
}

export interface Subscription {
  id: string;
  userId: string;
  packageId: string;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  package: Package;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { children: number; files: number };
}

export interface FileItem {
  id: string;
  name: string;
  userId: string;
  folderId: string;
  type: FileType;
  sizeBytes: number;
  mimeType: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

// Storage Stats
export interface StorageStats {
  usedBytes: string;
  limitBytes: string;
  percentUsed: number;
  totalFiles: number;
  totalFolders: number;
  byType: Record<FileType, { sizeBytes: number; count: number }>;
  topFiles: {
    id: string;
    name: string;
    sizeBytes: number;
    type: FileType;
    folderId: string;
  }[];
  package: {
    name: string;
    displayName: string;
    tierColor: string;
  } | null;
}

// Share Link
export interface ShareLink {
  id: string;
  token: string;
  userId: string;
  fileId: string | null;
  folderId: string | null;
  expiresAt: string | null;
  createdAt: string;
  file: { id: string; name: string } | null;
  folder: { id: string; name: string } | null;
}

export interface PublicShareFile {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  type: FileType;
}

export interface PublicShareFolderChild {
  id: string;
  name: string;
  _count: { children: number; files: number };
}

export type PublicShareInfo =
  | { type: "file"; file: PublicShareFile }
  | {
      type: "folder";
      folder: { id: string; name: string };
      children: PublicShareFolderChild[];
      files: PublicShareFile[];
    };

export interface PublicFolderContents {
  folder: { id: string; name: string };
  children: PublicShareFolderChild[];
  files: PublicShareFile[];
  breadcrumbs: { id: string; name: string }[];
}
