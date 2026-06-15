import { FileType } from "@/generated/prisma/enums";
import z from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(16, { message: "Password must be at most 16 characters long." })
    .regex(/[a-zA-Z]/, {
      message: "Password must contain at least one letter.",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one special character.",
    })
    .trim(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(16, { message: "Password must be at most 16 characters long." })
    .regex(/[a-zA-Z]/, {
      message: "Password must contain at least one letter.",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one special character.",
    })
    .trim(),
});

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminLoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const addPackageSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  displayName: z.string().min(1, "Display name is required").max(100),
  maxFolders: z.number().int().positive("maxFolders must be a positive integer"),
  maxNestingLevel: z.number().int().min(0, "maxNestingLevel must be 0 or greater"),
  types: z.array(z.enum(Object.values(FileType) as [string, ...string[]])).min(1, "At least one file type is required"),
  maxFileSizeBytes: z.number().positive("maxFileSizeBytes must be positive"),
  totalFileLimit: z.number().int().positive("totalFileLimit must be a positive integer"),
  filesPerFolder: z.number().int().positive("filesPerFolder must be a positive integer"),
  storageLimitBytes: z.string().transform((val) => BigInt(val)),
  tierColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color code"),
});

export const updatePackageSchema = z
  .object({
    displayName: z.string().min(1).max(100).optional(),
    maxFolders: z.number().int().positive().optional(),
    maxNestingLevel: z.number().int().min(0).optional(),
    types: z
      .array(z.enum(Object.values(FileType) as [string, ...string[]]))
      .min(1)
      .optional(),
    maxFileSizeBytes: z.number().positive().optional(),
    totalFileLimit: z.number().int().positive().optional(),
    filesPerFolder: z.number().int().positive().optional(),
    storageLimitBytes: z
      .string()
      .transform((val) => BigInt(val))
      .optional(),
    tierColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// ─── Folders ─────────────────────────────────────────────────────────────────
export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255),
  parentId: z.cuid("Invalid parentId").optional().nullable(),
});

export const renameFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255),
});

export const moveFolderSchema = z.object({
  // null means move to root level
  targetParentId: z.string().min(1).nullable().default(null),
});

// ─── Files ───────────────────────────────────────────────────────────────────
export const uploadFileSchema = z.object({
  folderId: z.string().min(1, "folderId is required"),
});

export const renameFileSchema = z.object({
  name: z.string().min(1, "File name is required").max(255),
});

export const moveFileSchema = z.object({
  targetFolderId: z.string().min(1, "targetFolderId is required"),
});

export const copyFileSchema = z.object({
  targetFolderId: z.string().min(1, "targetFolderId is required"),
});

export const getFilesQuerySchema = z.object({
  folderId: z.string().min(1, "folderId is required"),
});

// ─── Subscriptions ───────────────────────────────────────────────────────────
export const createSubscriptionSchema = z.object({
  packageId: z.string().min(1, "packageId is required"),
});

 
// ─── Simple presigned PUT ─────────────────────────────────────────────────────
export const presignSimpleSchema = z.object({
  folderId: z.string().min(1, "folderId is required"),
  fileName: z.string().min(1, "fileName is required").max(255),
  mimeType: z.string().min(1, "mimeType is required"),
  sizeBytes: z
    .number({ error: "sizeBytes must be a number." })
    .int()
    .positive("sizeBytes must be positive.")
});
 
export const confirmSimpleSchema = z.object({
  r2Key: z
    .string()
    .min(1, "r2Key is required."),
  folderId: z.string().min(1, "folderId is required."),
  fileName: z.string().min(1, "fileName is required.").max(255),
  mimeType: z.string().min(1, "mimeType is required"),
  sizeBytes: z
    .number()
    .int()
    .positive()
});
 
// ─── Multipart: init ──────────────────────────────────────────────────────────
export const initMultipartSchema = z.object({
  folderId: z.string().min(1, "folderId is required."),
  fileName: z.string().min(1, "fileName is required.").max(255),
  mimeType: z.string().min(1, "mimeType is required"),
  sizeBytes: z
    .number({ error: "sizeBytes must be a number." })
    .int()
    .positive("sizeBytes must be positive.")
    // Multipart minimum: > 5 MB (R2 enforces 5 MB minimum per part except last)
    .min(5 * 1024 * 1024 + 1, "Use simple upload for files under 5 MB.")
});
 
// ─── Multipart: confirm one part ──────────────────────────────────────────────
export const confirmPartSchema = z.object({
  partNumber: z
    .number({ error: "partNumber must be a number." })
    .int()
    .min(1, "partNumber must be at least 1.")
    .max(10000, "partNumber cannot exceed 10000."),
  etag: z
    .string()
    .min(1, "etag is required."),
  sizeBytes: z.number().int().positive("sizeBytes must be positive."),
});
 
// ─── Multipart: complete ──────────────────────────────────────────────────────
export const completeMultipartSchema = z.object({
  parts: z
    .array(
      z.object({
        partNumber: z.number().int().min(1).max(10000),
        etag: z
          .string()
          .min(1)
      }),
    )
    .min(1, "At least one part is required.")
    .max(10000, "Too many parts.")
    .refine(
      (parts) => {
        const nums = parts.map((p) => p.partNumber);
        return new Set(nums).size === nums.length;
      },
      { message: "Duplicate partNumber values are not allowed." },
    ),
});
 
//
export const createFileShareLinkSchema = z.object({
  fileId: z.string().min(1, "fileId is required"),
  expiresInHours: z.number().int().positive().max(24 * 30).optional(),
});

export const createFolderShareLinkSchema = z.object({
  folderId: z.string().min(1, "folderId is required"),
  expiresInHours: z.number().int().positive().max(24 * 30).optional(),
});