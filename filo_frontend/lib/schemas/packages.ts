import { z } from "zod";

export const ALL_FILE_TYPES = ["IMAGE", "VIDEO", "PDF", "AUDIO"] as const;
export type FileType = (typeof ALL_FILE_TYPES)[number];

export const packageFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name is too long.")
    .regex(/^[A-Z0-9_]+$/, "Must be uppercase letters, numbers, or underscores."),

  displayName: z.string().min(1, "Display name is required.").max(100, "Display name is too long."),

  maxFolders: z.number().int("Must be a whole number.").positive("Must be at least 1."),

  maxNestingLevel: z.number().int("Must be a whole number.").min(0, "Must be 0 or greater."),

  maxFileSizeMB: z.number().positive("Must be greater than 0."),

  storageLimitMB: z.number().positive("Must be greater than 0."),

  totalFileLimit: z.number().int("Must be a whole number.").positive("Must be at least 1."),

  filesPerFolder: z.number().int("Must be a whole number.").positive("Must be at least 1."),

  allowedFileTypes: z.array(z.enum(ALL_FILE_TYPES)).min(1, "Select at least one file type."),

  tierColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a valid hex color code."),
});

export type PackageFormData = z.infer<typeof packageFormSchema>;
