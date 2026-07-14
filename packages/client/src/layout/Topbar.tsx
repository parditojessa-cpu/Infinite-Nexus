import { useAuthStore } from "../lib/authStore";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { STUDENT_NAV, TEACHER_NAV } from "./nav";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const location = useLocation();

  const items = user?.role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  const title = items.find((item) => location.pathname.startsWith(item.path))?.label ?? "Finite Nexus";

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    clear();
    navigate("/login");
  }

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-surface sticky top-0 z-30">
      <h1 className="font-heading font-bold text-[17px] md:text-[19px] truncate">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-text-secondary truncate max-w-[160px]">
          {user ? `${user.firstName} ${user.lastName}` : ""}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded-control border border-border hover:bg-bg"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
