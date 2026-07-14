import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@finite-nexus/shared";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { useUiStore } from "../../lib/uiStore";
import { OfflineBanner } from "../../layout/OfflineBanner";

export function LoginPage() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const pushToast = useUiStore((s) => s.pushToast);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: "student", identifier: "", password: "" },
  });

  function selectRole(next: "student" | "teacher") {
    setRole(next);
    setValue("role", next);
  }

  async function onSubmit(values: LoginInput) {
    try {
      const data = await apiFetch<{ accessToken: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSession(data.user, data.accessToken);
      if (data.user.mustChangePassword) {
        navigate("/set-password");
        return;
      }
      pushToast(`Welcome back, ${data.user.firstName}!`, "success");
      navigate(`/${data.user.role}/dashboard`);
    } catch (err: any) {
      pushToast(err.message ?? "Login failed", "danger");
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
        className="w-full max-w-[920px] rounded-card overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-surface"
        style={{ boxShadow: "0 20px 60px rgba(26,36,48,0.12)" }}
      >
        <div className="hidden md:flex flex-col justify-center gap-8 p-10 text-white" style={{ background: "var(--color-primary)" }}>
          <div className="flex items-center gap-5">
            <img src="/icons/finite-nexus-logo.png" alt="" className="w-[110px] h-[110px] rounded-[22px] shrink-0" />
            <span className="font-heading font-extrabold text-[50px] leading-[1.05]">Finite Nexus</span>
          </div>
          <p className="italic text-white/90 leading-relaxed text-2xl">
            The <strong className="not-italic font-bold">smarter way</strong> to teach and learn — built for Senior
            High School.
          </p>
        </div>

        <div className="p-8 md:p-10 flex flex-col gap-6">
          <h2 className="font-heading font-bold text-[22px]">Welcome back</h2>

          <div className="flex rounded-pill bg-bg p-1">
            {(["student", "teacher"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => selectRole(r)}
                className={`flex-1 py-2 rounded-pill text-sm font-semibold capitalize transition-colors ${
                  role === r ? "bg-primary text-white" : "text-text-secondary"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">{role === "student" ? "Student ID or Email" : "Email"}</label>
              <input
                {...register("identifier")}
                className="rounded-control border px-3 py-2.5 text-sm"
                style={{ borderColor: "var(--color-border-strong)" }}
                placeholder={role === "student" ? "e.g. 2026-00123" : "you@finitenexus.edu"}
              />
              {errors.identifier && <span className="text-danger text-xs">{errors.identifier.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                {...register("password")}
                className="rounded-control border px-3 py-2.5 text-sm"
                style={{ borderColor: "var(--color-border-strong)" }}
                placeholder="••••••••"
              />
              {errors.password && <span className="text-danger text-xs">{errors.password.message}</span>}
            </div>

            <button type="button" className="text-sm text-primary self-start">
              Forgot password?
            </button>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-xs text-text-secondary">
            Demo: teacher@finitenexus.edu / 2026-00123 &middot; password123
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
