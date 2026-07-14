import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { LEVEL_LADDER, levelForXp, nextLevelForXp } from "@finite-nexus/shared";

export const gamificationRouter = Router();

gamificationRouter.get(
  "/me",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.userId;
    const [studentLevel, badges, earnedBadges, studentProfile] = await Promise.all([
      prisma.studentLevel.findUnique({ where: { studentId } }),
      prisma.badge.findMany(),
      prisma.studentBadge.findMany({ where: { studentId } }),
      prisma.studentProfile.findUnique({ where: { userId: studentId } }),
    ]);

    const xp = studentLevel?.currentXp ?? 0;
    const level = levelForXp(xp);
    const next = nextLevelForXp(xp);
    const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));

    return res.json({
      xp,
      level: level.level,
      levelName: level.name,
      xpToNext: next ? next.xpRequired - xp : 0,
      nextLevelXp: next?.xpRequired ?? null,
      sectionId: studentProfile?.sectionId ?? null,
      ladder: LEVEL_LADDER,
      badges: badges.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        earned: earnedIds.has(b.id),
        earnedAt: earnedBadges.find((eb) => eb.badgeId === b.id)?.earnedAt ?? null,
      })),
    });
  })
);

gamificationRouter.get(
  "/leaderboard/:sectionId",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const students = await prisma.studentProfile.findMany({
      where: { sectionId: req.params.sectionId },
      include: { user: { include: { studentLevel: true } } },
    });
    const ranked = students
      .map((s) => ({
        studentId: s.userId,
        name: `${s.user.firstName} ${s.user.lastName}`,
        xp: s.user.studentLevel?.currentXp ?? 0,
        level: s.user.studentLevel?.currentLevel ?? 1,
      }))
      .sort((a, b) => b.xp - a.xp);

    return res.json(
      ranked.map((r, i) => ({ ...r, rank: i + 1, isMe: r.studentId === req.user!.userId }))
    );
  })
);
