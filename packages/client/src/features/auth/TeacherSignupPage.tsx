import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import {
  teacherSignupRequestSchema,
  teacherSignupCompleteSchema,
  TEACHER_SIGNUP_EMAIL_DOMAIN,
  type TeacherSignupRequestInput,
  type TeacherSignupCompleteInput,
} from "@finite-nexus/shared";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { useUiStore } from "../../lib/uiStore";
import { OfflineBanner } from "../../layout/OfflineBanner";

export function TeacherSignupPage() {
  const [step, setStep] = useState<"email" | "complete">("email");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const pushToast = useUiStore((s) => s.pushToast);

  const emailForm = useForm<TeacherSignupRequestInput>({
    resolver: zodResolver(teacherSignupRequestSchema),
    defaultValues: { email: "" },
  });

  const completeForm = useForm<TeacherSignupCompleteInput>({
    resolver: zodResolver(teacherSignupCompleteSchema),
    defaultValues: { email: "", code: "", password: "", firstName: "", lastName: "" },
  });

  async function requestCode(values: TeacherSignupRequestInput) {
    try {
      await apiFetch("/auth/teacher-signup/request-code", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setEmail(values.email);
      completeForm.setValue("email", values.email);
      setStep("complete");
      pushToast("Verification code sent — check your inbox.", "success");
    } catch (err: any) {
      pushToast(err.message ?? "Couldn't send verification code", "danger");
    }
  }

  async function completeSignup(values: TeacherSignupCompleteInput) {
    try {
      const data = await apiFetch<{ accessToken: string; user: any }>("/auth/teacher-signup/complete", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSession(data.user, data.accessToken);
      pushToast(`Welcome to Finite Nexus, ${data.user.firstName}!`, "success");
      navigate("/teacher/dashboard");
    } catch (err: any) {
      pushToast(err.message ?? "Couldn't create account", "danger");
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <OfflineBanner />
      <div
        className="flex-1 flex items-center justify-center p-4"
        style={{ background: "radial-gradient(circle at top, #f5f3ee, #eef1ee, #e9eef2)" }}
      >
        <div
          className="w-full max-w-[440px] rounded-card bg-surface p-8 md:p-10 flex flex-col gap-6"
          style={{ boxShadow: "0 20px 60px rgba(26,36,48,0.12)" }}
        >
          <div className="flex flex-col gap-2">
            <h2 className="font-heading font-bold text-[22px]">Create a teacher account</h2>
            <p className="text-sm text-text-secondary">
              {step === "email"
                ? `Signup is available for @${TEACHER_SIGNUP_EMAIL_DOMAIN} email addresses.`
                : `We sent a 6-digit code to ${email}.`}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={emailForm.handleSubmit(requestCode)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  {...emailForm.register("email")}
                  className="rounded-control border px-3 py-2.5 text-sm"
                  style={{ borderColor: "var(--color-border-strong)" }}
                  placeholder={`you@${TEACHER_SIGNUP_EMAIL_DOMAIN}`}
                />
                {emailForm.formState.errors.email && (
                  <span className="text-danger text-xs">{emailForm.formState.errors.email.message}</span>
                )}
              </div>
              <button type="submit" disabled={emailForm.formState.isSubmitting} className="btn-primary w-full">
                {emailForm.formState.isSubmitting ? "Sending…" : "Send verification code"}
              </button>
            </form>
          ) : (
            <form onSubmit={completeForm.handleSubmit(completeSignup)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Verification code</label>
                <input
                  {...completeForm.register("code")}
                  className="rounded-control border px-3 py-2.5 text-sm"
                  style={{ borderColor: "var(--color-border-strong)" }}
                  placeholder="123456"
                  maxLength={6}
                />
                {completeForm.formState.errors.code && (
                  <span className="text-danger text-xs">{completeForm.formState.errors.code.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">First name</label>
                  <input
                    {...completeForm.register("firstName")}
                    className="rounded-control border px-3 py-2.5 text-sm"
                    style={{ borderColor: "var(--color-border-strong)" }}
                  />
                  {completeForm.formState.errors.firstName && (
                    <span className="text-danger text-xs">{completeForm.formState.errors.firstName.message}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Last name</label>
                  <input
                    {...completeForm.register("lastName")}
                    className="rounded-control border px-3 py-2.5 text-sm"
                    style={{ borderColor: "var(--color-border-strong)" }}
                  />
                  {completeForm.formState.errors.lastName && (
                    <span className="text-danger text-xs">{completeForm.formState.errors.lastName.message}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Choose a password</label>
                <input
                  type="password"
                  {...completeForm.register("password")}
                  className="rounded-control border px-3 py-2.5 text-sm"
                  style={{ borderColor: "var(--color-border-strong)" }}
                  placeholder="At least 8 characters"
                />
                {completeForm.formState.errors.password && (
                  <span className="text-danger text-xs">{completeForm.formState.errors.password.message}</span>
                )}
              </div>

              <button type="submit" disabled={completeForm.formState.isSubmitting} className="btn-primary w-full">
                {completeForm.formState.isSubmitting ? "Creating account…" : "Create account"}
              </button>
              <button type="button" className="text-sm text-primary" onClick={() => setStep("email")}>
                Use a different email
              </button>
            </form>
          )}

          <p className="text-sm text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
