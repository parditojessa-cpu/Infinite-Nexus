import { z } from "zod";
import { ROLES } from "../enums/index.js";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Student/Employee ID is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(ROLES),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  studentId: z.string().nullable(),
  role: z.enum(ROLES),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
  mustChangePassword: z.boolean(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const setPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
