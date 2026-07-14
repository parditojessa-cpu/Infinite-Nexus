import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../lib/authStore";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { MoreDrawer } from "./MoreDrawer";
import { Topbar } from "./Topbar";
import { OfflineBanner } from "./OfflineBanner";
import { STUDENT_NAV, TEACHER_NAV } from "./nav";

export function AppShell() {
  const role = useAuthStore((s) => s.user?.role);
  const items = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <OfflineBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar items={items} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
        <BottomTabBar items={items} onMore={() => setMoreOpen(true)} />
        <MoreDrawer items={items} open={moreOpen} onClose={() => setMoreOpen(false)} />
      </div>
    </div>
  );
}
