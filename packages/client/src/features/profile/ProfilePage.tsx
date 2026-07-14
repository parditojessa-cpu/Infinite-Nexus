import { RISK_TIER_COLORS } from "@finite-nexus/shared";
import { StatCard } from "../../components/StatCard";
import { Badge } from "../../components/Badge";
import { ProgressBar } from "../../components/ProgressBar";
import { useProfile } from "./api";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <span className="block text-xs text-text-secondary uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function ProfilePage() {
  const { data, isLoading, isError } = useProfile();

  if (isLoading) return <p className="text-sm text-text-secondary">Loading profile…</p>;
  if (isError || !data) return <p className="text-sm text-danger">Couldn't load your profile.</p>;

  const { user, studentProfile, interventionProfile } = data;
  const riskColor = RISK_TIER_COLORS[interventionProfile.riskTier] ?? RISK_TIER_COLORS.satisfactory;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
        <div className="card flex flex-col items-center text-center gap-2">
          <div className="w-[120px] h-[120px] rounded-full bg-bg border border-border flex items-center justify-center text-3xl">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <h2 className="font-heading font-bold text-lg">
            {user.firstName} {user.lastName}
          </h2>
          <span className="text-sm text-text-secondary">{user.studentId}</span>
          {studentProfile && (
            <Badge label={`${studentProfile.gradeLevel} · ${studentProfile.section?.name ?? ""}`} color="var(--color-primary)" />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="card">
            <h3 className="font-heading font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Student ID" value={user.studentId} />
              <Field label="LRN" value={studentProfile?.lrn} />
              <Field label="First Name" value={user.firstName} />
              <Field label="Last Name" value={user.lastName} />
              <Field label="Gender" value={studentProfile?.gender} />
              <Field label="Birthday" value={studentProfile?.birthday ? new Date(studentProfile.birthday).toLocaleDateString() : null} />
              <Field label="Address" value={studentProfile?.address} />
              <Field label="Contact Number" value={studentProfile?.contactNumber} />
              <Field label="Parent Name" value={studentProfile?.parentName} />
              <Field label="Parent Contact" value={studentProfile?.parentContact} />
              <Field label="Email" value={user.email} />
            </div>
          </div>

          <div className="card">
            <h3 className="font-heading font-semibold mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Grade Level" value={studentProfile?.gradeLevel} />
              <Field label="Section" value={studentProfile?.section?.name} />
              <Field label="Strand" value={studentProfile?.strand} />
              <Field label="School Year" value={studentProfile?.schoolYear} />
              <Field label="Semester" value={studentProfile?.semester} />
              <Field label="Adviser" value={studentProfile?.section ? "Assigned" : null} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold">Intervention Profile</h3>
          <Badge label={interventionProfile.riskTier.replace(/_/g, " ")} color={riskColor} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Average" value={interventionProfile.stats.average ?? "—"} />
          <StatCard label="Attendance" value={`${interventionProfile.stats.attendanceRate}%`} />
          <StatCard label="Missing Activities" value={interventionProfile.stats.missingActivities} />
          <StatCard label="Failed Competencies" value={interventionProfile.stats.failedCompetencies} />
        </div>
        {interventionProfile.activePlan ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <Field label="Status" value={interventionProfile.activePlan.status} />
              <Field label="Program" value={interventionProfile.activePlan.program} />
              <Field label="Assigned Teacher" value={interventionProfile.activePlan.assignedTeacher} />
              <Field
                label="Expected Completion"
                value={interventionProfile.activePlan.expectedCompletion ? new Date(interventionProfile.activePlan.expectedCompletion).toLocaleDateString() : null}
              />
            </div>
            <ProgressBar value={60} color={riskColor} />
          </>
        ) : (
          <p className="text-sm text-text-secondary">No active intervention plan.</p>
        )}
      </div>
    </div>
  );
}
