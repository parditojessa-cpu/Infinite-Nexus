import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../lib/authStore";

export function RequireAuth({ role }: { role?: "student" | "teacher" }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  // Only teachers ever have a password to force-change — students log in with
  // just their LRN, so this concept doesn't apply to them.
  if (role && user.role === "teacher" && user.mustChangePassword) return <Navigate to="/set-password" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />;

  return <Outlet />;
}
