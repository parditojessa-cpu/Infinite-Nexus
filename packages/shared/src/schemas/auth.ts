import { z } from "zod";
import { ROLES } from "../enums/index.js";

export const loginSchema = z
  .object({
    identifier: z.string().min(1, "Email, LRN, or Student/Employee ID is required"),
    password: z.string().optional(),
    role: z.enum(ROLES),
  })
  .superRefine((data, ctx) => {
    if (data.role === "teacher" && !data.password) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password is required", path: ["password"] });
    }
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

export const teacherSignupRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type TeacherSignupRequestInput = z.infer<typeof teacherSignupRequestSchema>;

export const teacherSignupCompleteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  code: z.string().length(6, "Enter the 6-digit code"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});
export type TeacherSignupCompleteInput = z.infer<typeof teacherSignupCompleteSchema>;
