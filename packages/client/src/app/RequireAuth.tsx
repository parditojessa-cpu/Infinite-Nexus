import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../lib/authStore";

export function RequireAuth({ role }: { role?: "student" | "teacher" }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.mustChangePassword) return <Navigate to="/set-password" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />;

  return <Outlet />;
}
