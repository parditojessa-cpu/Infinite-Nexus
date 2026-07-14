import { prisma } from "./prisma.js";
import { levelForXp } from "@finite-nexus/shared";

export async function awardXp(studentId: string, sourceType: string, sourceId: string | null, amount: number) {
  await prisma.xpLog.create({ data: { studentId, sourceType, sourceId, xpAmount: amount } });

  const existing = await prisma.studentLevel.findUnique({ where: { studentId } });
  const newXp = (existing?.currentXp ?? 0) + amount;
  const newLevel = levelForXp(newXp).level;

  await prisma.studentLevel.upsert({
    where: { studentId },
    update: { currentXp: newXp, currentLevel: newLevel },
    create: { studentId, currentXp: newXp, currentLevel: newLevel },
  });
}

export async function hasAwardedToday(studentId: string, sourceType: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const existing = await prisma.xpLog.findFirst({
    where: { studentId, sourceType, createdAt: { gte: startOfDay } },
  });
  return !!existing;
}
