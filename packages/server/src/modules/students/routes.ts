import { Router } from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { parseSf1Pdf } from "../../lib/sf1Parser.js";

export const studentsRouter = Router();
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

function passwordFromBirthday(birthday: string | null): string {
  // "08/05/2008" -> "08052008" — matches the common school convention of
  // using the learner's birthdate as their initial password.
  if (!birthday) return "Learner2026!";
  return birthday.replace(/\//g, "");
}

studentsRouter.post(
  "/import/sf1/preview",
  requireAuth,
  requireRole("teacher"),
  memoryUpload.single("file"),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.file) return res.status(400).json({ error: "PDF file is required" });

    const result = await parseSf1Pdf(req.file.buffer);
    const lrns = result.students.map((s) => s.lrn);
    const existingUsers = await prisma.user.findMany({
      where: { studentId: { in: lrns } },
      select: { studentId: true },
    });
    const existingLrns = new Set(existingUsers.map((u) => u.studentId));

    return res.json({
      meta: result.meta,
      warnings: result.warnings,
      students: result.students.map((s) => ({
        ...s,
        alreadyExists: existingLrns.has(s.lrn),
      })),
    });
  })
);

studentsRouter.post(
  "/import/sf1/confirm",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { courseId, students, gradeLevel } = req.body as {
      courseId: string;
      gradeLevel?: string;
      students: {
        lrn: string;
        firstName: string;
        lastName: string;
        middleName: string | null;
        sex: string;
        birthday: string | null;
        include: boolean;
      }[];
    };

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const created: string[] = [];
    const skipped: string[] = [];

    for (const s of students) {
      if (!s.include) continue;
      if (!s.lrn || !s.firstName || !s.lastName) {
        skipped.push(s.lrn || "(missing LRN)");
        continue;
      }

      const existing = await prisma.user.findUnique({ where: { studentId: s.lrn } });
      if (existing) {
        // Already has an account — just make sure they're enrolled in this course.
        await prisma.enrollment.upsert({
          where: { courseId_studentId: { courseId, studentId: existing.id } },
          update: {},
          create: { courseId, studentId: existing.id, progressPercent: 0 },
        });
        skipped.push(s.lrn);
        continue;
      }

      const passwordHash = await bcrypt.hash(passwordFromBirthday(s.birthday), 10);
      const birthdayDate = s.birthday ? parseMmDdYyyy(s.birthday) : null;

      const user = await prisma.user.create({
        data: {
          studentId: s.lrn,
          passwordHash,
          mustChangePassword: false,
          role: "student",
          firstName: s.firstName,
          lastName: s.lastName,
          studentProfile: {
            create: {
              lrn: s.lrn,
              middleName: s.middleName,
              gender: s.sex === "M" ? "Male" : s.sex === "F" ? "Female" : null,
              birthday: birthdayDate,
              gradeLevel: gradeLevel ?? null,
              sectionId: course.sectionId,
            },
          },
        },
      });

      await prisma.enrollment.create({
        data: { courseId, studentId: user.id, progressPercent: 0 },
      });

      created.push(s.lrn);
    }

    return res.json({ created: created.length, skipped: skipped.length, createdLrns: created, skippedLrns: skipped });
  })
);

function parseMmDdYyyy(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
}
