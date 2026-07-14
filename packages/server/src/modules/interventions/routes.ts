import { Router } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import {
  ROOT_CAUSE_LABELS,
  INTERVENTION_STRATEGY_LABELS,
  INTERVENTION_STATUS_META,
  RISK_TIER_COLORS,
} from "@finite-nexus/shared";

export const interventionsRouter = Router();

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

interventionsRouter.get(
  "/roster",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const courses = await prisma.course.findMany({
      where: { teacherId: req.user!.userId },
      include: { enrollments: { include: { student: true } } },
    });
    const studentIds = Array.from(new Set(courses.flatMap((c) => c.enrollments.map((e) => e.studentId))));
    const students = await prisma.user.findMany({ where: { id: { in: studentIds } } });
    const profiles = await prisma.interventionProfile.findMany({ where: { studentId: { in: studentIds } } });
    const profileMap = new Map(profiles.map((p) => [p.studentId, p]));

    return res.json(
      students.map((s) => ({
        studentId: s.id,
        name: `${s.firstName} ${s.lastName}`,
        riskTier: profileMap.get(s.id)?.riskTier ?? "satisfactory",
        interventionStatus: profileMap.get(s.id)?.interventionStatus ?? "no_intervention_required",
      }))
    );
  })
);

interventionsRouter.get(
  "/students/:studentId/profile",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.params.studentId;
    const [user, studentProfile, interventionProfile, gradebook, attendance, plans] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId } }),
      prisma.studentProfile.findUnique({ where: { userId: studentId } }),
      prisma.interventionProfile.findUnique({ where: { studentId } }),
      prisma.gradebookEntry.findMany({ where: { studentId } }),
      prisma.attendanceRecord.findMany({ where: { studentId } }),
      prisma.interventionPlan.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
    ]);
    if (!user) return res.status(404).json({ error: "Student not found" });

    const average = gradebook.length
      ? Math.round((gradebook.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / gradebook.length) * 10) / 10
      : null;
    const attendanceRate = attendance.length
      ? Math.round((100 * attendance.filter((a) => a.status === "present" || a.status === "late").length) / attendance.length)
      : 100;
    const missingActivities = gradebook.filter((g) => g.remarks === "missing").length;
    const failedCompetencies = gradebook.filter((g) => g.score / g.maxScore < 0.75).length;

    return res.json({
      studentId,
      name: `${user.firstName} ${user.lastName}`,
      gradeLevel: studentProfile?.gradeLevel,
      section: studentProfile?.sectionId,
      riskTier: interventionProfile?.riskTier ?? "satisfactory",
      interventionStatus: interventionProfile?.interventionStatus ?? "no_intervention_required",
      stats: { average, attendanceRate, missingActivities, failedCompetencies },
      plans: plans.map((p) => ({
        id: p.id,
        subject: p.subject,
        status: p.status,
        competency: p.competency,
        createdAt: p.createdAt,
      })),
    });
  })
);

interventionsRouter.put(
  "/students/:studentId/profile",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { riskTier, interventionStatus } = req.body;
    const updated = await prisma.interventionProfile.upsert({
      where: { studentId: req.params.studentId },
      update: { riskTier, interventionStatus },
      create: { studentId: req.params.studentId, riskTier, interventionStatus },
    });
    return res.json(updated);
  })
);

interventionsRouter.get(
  "/plans",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { studentId } = req.query as { studentId?: string };
    const where = req.user!.role === "student" ? { studentId: req.user!.userId } : studentId ? { studentId } : { teacherId: req.user!.userId };
    const plans = await prisma.interventionPlan.findMany({ where, include: { teacher: true }, orderBy: { createdAt: "desc" } });
    return res.json(
      plans.map((p) => ({
        id: p.id,
        studentId: p.studentId,
        subject: p.subject,
        teacherName: `${p.teacher.firstName} ${p.teacher.lastName}`,
        competency: p.competency,
        difficulty: p.difficulty,
        rootCauses: parseJson<string[]>(p.rootCauses, []),
        strategies: parseJson<string[]>(p.strategies, []),
        schedule: p.schedule,
        targetScore: p.targetScore,
        expectedCompletion: p.expectedCompletion,
        remarks: p.remarks,
        reflection: p.reflection,
        finalEvaluation: p.finalEvaluation,
        status: p.status,
        createdAt: p.createdAt,
      }))
    );
  })
);

interventionsRouter.post(
  "/plans",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const b = req.body;
    const plan = await prisma.interventionPlan.create({
      data: {
        studentId: b.studentId,
        teacherId: req.user!.userId,
        subject: b.subject,
        competency: b.competency,
        difficulty: b.difficulty,
        rootCauses: b.rootCauses ? JSON.stringify(b.rootCauses) : null,
        strategies: b.strategies ? JSON.stringify(b.strategies) : null,
        schedule: b.schedule,
        targetScore: b.targetScore ? Number(b.targetScore) : null,
        expectedCompletion: b.expectedCompletion ? new Date(b.expectedCompletion) : null,
        status: "active",
      },
    });
    await prisma.interventionTimelineEvent.create({
      data: {
        planId: plan.id,
        eventType: "started",
        description: `Intervention plan started for ${b.subject}`,
        createdById: req.user!.userId,
      },
    });
    return res.status(201).json(plan);
  })
);

interventionsRouter.patch(
  "/plans/:id",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const b = req.body;
    const plan = await prisma.interventionPlan.update({
      where: { id: req.params.id },
      data: {
        remarks: b.remarks,
        reflection: b.reflection,
        finalEvaluation: b.finalEvaluation,
        status: b.status,
        rootCauses: b.rootCauses ? JSON.stringify(b.rootCauses) : undefined,
        strategies: b.strategies ? JSON.stringify(b.strategies) : undefined,
      },
    });
    return res.json(plan);
  })
);

interventionsRouter.get(
  "/plans/:id/activities",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const activities = await prisma.interventionActivity.findMany({ where: { planId: req.params.id } });
    return res.json(
      activities.map((a) => ({
        id: a.id,
        title: a.title,
        instructions: a.instructions,
        materials: parseJson(a.materials, []),
        deadline: a.deadline,
        status: a.status,
        teacherFeedback: a.teacherFeedback,
        studentReflection: a.studentReflection,
      }))
    );
  })
);

interventionsRouter.post(
  "/plans/:id/activities",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const b = req.body;
    const activity = await prisma.interventionActivity.create({
      data: {
        planId: req.params.id,
        title: b.title,
        instructions: b.instructions,
        materials: b.materials ? JSON.stringify(b.materials) : null,
        deadline: b.deadline ? new Date(b.deadline) : null,
        status: "assigned",
      },
    });
    await prisma.interventionTimelineEvent.create({
      data: {
        planId: req.params.id,
        eventType: "activity_completed",
        description: `Activity assigned: ${b.title}`,
        createdById: req.user!.userId,
      },
    });
    return res.status(201).json(activity);
  })
);

interventionsRouter.patch(
  "/activities/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const b = req.body;
    const activity = await prisma.interventionActivity.update({
      where: { id: req.params.id },
      data: {
        status: b.status,
        teacherFeedback: b.teacherFeedback,
        studentReflection: b.studentReflection,
        completedAt: b.status === "completed" ? new Date() : undefined,
      },
    });
    if (b.status === "completed") {
      await prisma.interventionTimelineEvent.create({
        data: {
          planId: activity.planId,
          eventType: "activity_completed",
          description: `Activity completed: ${activity.title}`,
          createdById: req.user!.userId,
        },
      });
    }
    if (b.studentReflection) {
      await prisma.interventionTimelineEvent.create({
        data: {
          planId: activity.planId,
          eventType: "student_reflection",
          description: `Student reflection submitted for: ${activity.title}`,
          createdById: req.user!.userId,
        },
      });
    }
    return res.json(activity);
  })
);

interventionsRouter.get(
  "/plans/:id/progress",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const metrics = await prisma.interventionProgressMetric.findMany({
      where: { planId: req.params.id },
      orderBy: { metricDate: "asc" },
    });
    const byType = new Map<string, { date: string; value: number }[]>();
    for (const m of metrics) {
      const arr = byType.get(m.metricType) ?? [];
      arr.push({ date: m.metricDate.toISOString(), value: m.value });
      byType.set(m.metricType, arr);
    }
    const latestByType: Record<string, number> = {};
    for (const [type, points] of byType) {
      latestByType[type] = points[points.length - 1]?.value ?? 0;
    }
    return res.json({
      series: Object.fromEntries(byType),
      radar: latestByType,
    });
  })
);

interventionsRouter.post(
  "/plans/:id/progress",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { metricType, value, metricDate } = req.body;
    const metric = await prisma.interventionProgressMetric.create({
      data: {
        planId: req.params.id,
        metricType,
        value: Number(value),
        metricDate: metricDate ? new Date(metricDate) : new Date(),
      },
    });
    return res.status(201).json(metric);
  })
);

interventionsRouter.get(
  "/plans/:id/timeline",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const events = await prisma.interventionTimelineEvent.findMany({
      where: { planId: req.params.id },
      orderBy: { eventDate: "desc" },
    });
    return res.json(events);
  })
);

interventionsRouter.get(
  "/plans/:id/report",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const plan = await prisma.interventionPlan.findUnique({
      where: { id: req.params.id },
      include: {
        student: { include: { studentProfile: { include: { section: true } } } },
        teacher: true,
        activities: true,
        progressMetrics: { orderBy: { metricDate: "asc" } },
        timelineEvents: { orderBy: { eventDate: "asc" } },
      },
    });
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const interventionProfile = await prisma.interventionProfile.findUnique({ where: { studentId: plan.studentId } });
    const rootCauses = parseJson<string[]>(plan.rootCauses, []);
    const strategies = parseJson<string[]>(plan.strategies, []);
    const metrics = plan.progressMetrics;
    const latestMetric = metrics[metrics.length - 1];
    const firstMetric = metrics[0];
    const improvement =
      firstMetric && latestMetric && metrics.length > 1 ? latestMetric.value - firstMetric.value : null;
    const completedActivities = plan.activities.filter((a) => a.status === "completed").length;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="intervention-report-${plan.id}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(18).fillColor("#0f4c81").text("Individual Intervention Plan — Progress Report", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666").text(`Generated ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#1a2430").text(`Student: ${plan.student.firstName} ${plan.student.lastName}`);
    if (plan.student.studentProfile) {
      doc
        .fontSize(10)
        .fillColor("#444")
        .text(
          `Grade/Section: ${plan.student.studentProfile.gradeLevel ?? "—"} / ${plan.student.studentProfile.section?.name ?? "—"}`
        );
    }
    if (interventionProfile) {
      const riskColor = RISK_TIER_COLORS[interventionProfile.riskTier] ?? "#444";
      const statusLabel = INTERVENTION_STATUS_META[interventionProfile.interventionStatus]?.label ?? interventionProfile.interventionStatus;
      doc.fillColor(riskColor).fontSize(11).text(`Risk Tier: ${interventionProfile.riskTier.replace(/_/g, " ")}`);
      doc.fillColor("#1a2430").text(`Intervention Status: ${statusLabel}`);
    }
    doc.moveDown();

    doc.fontSize(13).fillColor("#0f4c81").text("Plan Details");
    doc.fontSize(10).fillColor("#1a2430");
    doc.text(`Subject: ${plan.subject}`);
    doc.text(`Competency: ${plan.competency ?? "—"}`);
    doc.text(`Difficulty Identified: ${plan.difficulty ?? "—"}`);
    doc.text(`Root Cause(s): ${rootCauses.map((c) => ROOT_CAUSE_LABELS[c] ?? c).join(", ") || "—"}`);
    doc.text(`Strategies: ${strategies.map((s) => INTERVENTION_STRATEGY_LABELS[s] ?? s).join(", ") || "—"}`);
    doc.text(`Target Score: ${plan.targetScore ?? "—"}%`);
    doc.text(`Expected Completion: ${plan.expectedCompletion ? plan.expectedCompletion.toLocaleDateString() : "—"}`);
    doc.text(`Status: ${plan.status}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#0f4c81").text("Progress Summary (from recorded assessment scores)");
    doc.fontSize(10).fillColor("#1a2430");
    doc.text(`Data points recorded: ${metrics.length}`);
    doc.text(`Most recent score: ${latestMetric ? `${latestMetric.value.toFixed(1)}%` : "No data yet"}`);
    doc.text(
      `Change since first recorded score: ${
        improvement !== null ? `${improvement >= 0 ? "+" : ""}${improvement.toFixed(1)} points` : "Not enough data yet"
      }`
    );
    doc.text(`Activities completed: ${completedActivities} / ${plan.activities.length}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#0f4c81").text("Timeline");
    doc.fontSize(10).fillColor("#1a2430");
    if (plan.timelineEvents.length === 0) {
      doc.text("No timeline events recorded yet.");
    }
    for (const event of plan.timelineEvents) {
      doc.text(`- [${event.eventDate.toLocaleDateString()}] ${event.description}`);
    }

    doc.end();
  })
);

interventionsRouter.get(
  "/programs",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const programs = await prisma.interventionProgram.findMany({ orderBy: { name: "asc" } });
    return res.json(programs);
  })
);

interventionsRouter.post(
  "/programs",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const b = req.body;
    const program = await prisma.interventionProgram.create({
      data: {
        name: b.name,
        description: b.description,
        subject: b.subject,
        gradeLevel: b.gradeLevel,
        competency: b.competency,
        targetLearners: b.targetLearners,
        startDate: b.startDate ? new Date(b.startDate) : null,
        endDate: b.endDate ? new Date(b.endDate) : null,
        expectedOutcome: b.expectedOutcome,
        successIndicators: b.successIndicators,
        monitoringFrequency: b.monitoringFrequency,
        resourcesNeeded: b.resourcesNeeded,
        personResponsibleId: req.user!.userId,
        status: "draft",
        tier: b.tier ?? "tier1",
      },
    });
    return res.status(201).json(program);
  })
);

interventionsRouter.patch(
  "/programs/:id",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const program = await prisma.interventionProgram.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    return res.json(program);
  })
);

interventionsRouter.delete(
  "/programs/:id",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.interventionProgram.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  })
);
