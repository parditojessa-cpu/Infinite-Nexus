import { Router, type Response } from "express";
import bcrypt from "bcryptjs";
import {
  loginSchema,
  setPasswordSchema,
  teacherSignupRequestSchema,
  teacherSignupCompleteSchema,
  TEACHER_SIGNUP_EMAIL_DOMAIN,
} from "@finite-nexus/shared";
import { prisma } from "../../lib/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { asyncHandler, HttpError } from "../../middleware/errorHandler.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { awardXp, hasAwardedToday } from "../../lib/xpEngine.js";
import { sendVerificationCodeEmail } from "../../lib/email.js";
import { XP_RULES } from "@finite-nexus/shared";

export const authRouter = Router();

const REFRESH_COOKIE = "fn_refresh";
const isProd = process.env.NODE_ENV === "production";
const SIGNUP_CODE_TTL_MS = 15 * 60 * 1000;

function toAuthUser(user: {
  id: string;
  email: string | null;
  studentId: string | null;
  role: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  mustChangePassword: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    studentId: user.studentId,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    mustChangePassword: user.mustChangePassword,
  };
}

function issueSession(res: Response, user: { id: string; role: string }): string {
  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  return accessToken;
}

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: {
        role: input.role,
        OR: [{ email: input.identifier }, { studentId: input.identifier }],
      },
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Students log in with just their LRN — no password to check. Teachers
    // still authenticate with a password.
    if (input.role === "teacher") {
      const valid = await bcrypt.compare(input.password ?? "", user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = issueSession(res, user);

    if (user.role === "student" && !(await hasAwardedToday(user.id, "daily_login"))) {
      await awardXp(user.id, "daily_login", null, XP_RULES.daily_login);
    }

    return res.json({ accessToken, user: toAuthUser(user) });
  })
);

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

authRouter.post(
  "/teacher-signup/request-code",
  asyncHandler(async (req, res) => {
    const input = teacherSignupRequestSchema.parse(req.body);
    const email = input.email.toLowerCase();

    if (!email.endsWith(`@${TEACHER_SIGNUP_EMAIL_DOMAIN}`)) {
      throw new HttpError(400, `Signup is only available for @${TEACHER_SIGNUP_EMAIL_DOMAIN} email addresses`);
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(400, "An account with this email already exists — please log in instead");
    }

    const code = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + SIGNUP_CODE_TTL_MS);
    await prisma.teacherSignupCode.upsert({
      where: { email },
      update: { code, expiresAt },
      create: { email, code, expiresAt },
    });

    await sendVerificationCodeEmail(email, code);
    return res.status(204).send();
  })
);

authRouter.post(
  "/teacher-signup/complete",
  asyncHandler(async (req, res) => {
    const input = teacherSignupCompleteSchema.parse(req.body);
    const email = input.email.toLowerCase();

    const record = await prisma.teacherSignupCode.findUnique({ where: { email } });
    if (!record || record.code !== input.code || record.expiresAt < new Date()) {
      throw new HttpError(400, "Invalid or expired verification code");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(400, "An account with this email already exists — please log in instead");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        mustChangePassword: false,
        role: "teacher",
        firstName: input.firstName,
        lastName: input.lastName,
        teacherProfile: { create: {} },
      },
    });
    await prisma.teacherSignupCode.delete({ where: { email } });

    const accessToken = issueSession(res, user);
    return res.status(201).json({ accessToken, user: toAuthUser(user) });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ error: "No refresh token" });
    try {
      const payload = verifyRefreshToken(token);
      const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
      return res.json({ accessToken });
    } catch {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  return res.status(204).send();
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user: toAuthUser(user) });
  })
);

authRouter.post(
  "/set-password",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = setPasswordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash, mustChangePassword: false },
    });
    return res.json({ user: toAuthUser(user) });
  })
);
