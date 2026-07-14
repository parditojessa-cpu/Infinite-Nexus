import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { setPasswordSchema, type SetPasswordInput } from "@finite-nexus/shared";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { useUiStore } from "../../lib/uiStore";
import { OfflineBanner } from "../../layout/OfflineBanner";

export function SetPasswordPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const pushToast = useUiStore((s) => s.pushToast);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordInput & { confirmPassword: string }>({
    resolver: zodResolver(setPasswordSchema.extend({ confirmPassword: setPasswordSchema.shape.newPassword })),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: SetPasswordInput & { confirmPassword: string }) {
    if (values.newPassword !== values.confirmPassword) {
      pushToast("Passwords don't match", "danger");
      return;
    }
    try {
      const data = await apiFetch<{ user: any }>("/auth/set-password", {
        method: "POST",
        body: JSON.stringify({ newPassword: values.newPassword }),
      });
      setSession(data.user, accessToken!);
      pushToast("Password set — welcome to Finite Nexus!", "success");
      navigate(`/${data.user.role}/dashboard`, { replace: true });
    } catch (err: any) {
      pushToast(err.message ?? "Couldn't set password", "danger");
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
            <h2 className="font-heading font-bold text-[22px]">Set your password</h2>
            <p className="text-sm text-text-secondary">
              Hi {user?.firstName ?? "there"} — for your account's security, please choose your own password before
              continuing.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">New password</label>
              <input
                type="password"
                {...register("newPassword")}
                className="rounded-control border px-3 py-2.5 text-sm"
                style={{ borderColor: "var(--color-border-strong)" }}
                placeholder="At least 8 characters"
              />
              {errors.newPassword && <span className="text-danger text-xs">{errors.newPassword.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Confirm password</label>
              <input
                type="password"
                {...register("confirmPassword")}
                className="rounded-control border px-3 py-2.5 text-sm"
                style={{ borderColor: "var(--color-border-strong)" }}
                placeholder="Re-enter your new password"
              />
              {watch("confirmPassword") && watch("confirmPassword") !== watch("newPassword") && (
                <span className="text-danger text-xs">Passwords don't match</span>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Saving…" : "Save and continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
