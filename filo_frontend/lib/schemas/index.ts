import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required."),
    email: z.string().min(1, "Email is required.").email("Invalid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(16, "Password must be at most 16 characters.")
      .regex(/[a-zA-Z]/, "Must contain at least one letter.")
      .regex(/[0-9]/, "Must contain at least one number.")
      .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character."),
    confirm: z.string().min(1, "Please confirm your password."),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });
export type RegisterFormData = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(16, "Password must be at most 16 characters.")
      .regex(/[a-zA-Z]/, "Must contain at least one letter.")
      .regex(/[0-9]/, "Must contain at least one number.")
      .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character."),
    confirm: z.string().min(1, "Please confirm your password."),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const adminLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
