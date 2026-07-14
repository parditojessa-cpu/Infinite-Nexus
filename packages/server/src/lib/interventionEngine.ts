import { prisma } from "./prisma.js";
import { DEFAULT_PASSING_THRESHOLD } from "@finite-nexus/shared";

const STATUS_ESCALATION_ORDER = [
  "no_intervention_required",
  "under_monitoring",
  "under_intervention",
  "intensive_intervention",
  "completed",
];

function riskTierForPercent(percent: number): string {
  if (percent >= 90) return "excellent";
  if (percent >= 80) return "satisfactory";
  if (percent >= 75) return "needs_monitoring";
  if (percent >= 60) return "at_risk";
  return "critical";
}

/**
 * Auto-places a student into the intervention program whenever a written
 * activity (quiz) score is at or below the passing threshold. Escalates
 * status without downgrading an existing further-along intervention, and
 * opens an IIP + logs a timeline event + records a progress metric so the
 * Progress Monitoring chart has real data from the moment of the flag.
 */
export async function checkAndTriggerIntervention(params: {
  studentId: string;
  teacherId: string;
  subject: string;
  competency: string;
  percent: number;
}) {
  const { studentId, teacherId, subject, competency, percent } = params;
  if (percent > DEFAULT_PASSING_THRESHOLD) return;

  const existingProfile = await prisma.interventionProfile.findUnique({ where: { studentId } });
  const currentIndex = existingProfile ? STATUS_ESCALATION_ORDER.indexOf(existingProfile.interventionStatus) : 0;
  const newRiskTier = riskTierForPercent(percent);
  const nextStatus = currentIndex <= 0 ? "under_monitoring" : existingProfile!.interventionStatus;

  await prisma.interventionProfile.upsert({
    where: { studentId },
    update: { interventionStatus: nextStatus, riskTier: newRiskTier },
    create: { studentId, interventionStatus: "under_monitoring", riskTier: newRiskTier },
  });

  let plan = await prisma.interventionPlan.findFirst({
    where: { studentId, subject, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  if (!plan) {
    plan = await prisma.interventionPlan.create({
      data: {
        studentId,
        teacherId,
        subject,
        competency,
        difficulty: `Score of ${percent.toFixed(1)}% is at or below the ${DEFAULT_PASSING_THRESHOLD}% threshold`,
        rootCauses: JSON.stringify(["low_assessment_scores"]),
        strategies: JSON.stringify(["remediation", "practice_worksheets"]),
        targetScore: DEFAULT_PASSING_THRESHOLD,
        status: "active",
      },
    });
    await prisma.interventionTimelineEvent.create({
      data: {
        planId: plan.id,
        eventType: "started",
        description: `Auto-enrolled: scored ${percent.toFixed(1)}% on "${competency}", at or below the ${DEFAULT_PASSING_THRESHOLD}% threshold.`,
      },
    });
  } else {
    await prisma.interventionTimelineEvent.create({
      data: {
        planId: plan.id,
        eventType: "weekly_progress",
        description: `New low score recorded: ${percent.toFixed(1)}% on "${competency}".`,
      },
    });
  }

  await prisma.interventionProgressMetric.create({
    data: {
      planId: plan.id,
      metricType: "assessment_score",
      value: percent,
      metricDate: new Date(),
    },
  });

  return plan;
}
