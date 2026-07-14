import { NavLink } from "react-router-dom";
import { useUiStore } from "../lib/uiStore";
import { useInstallPrompt } from "../lib/useInstallPrompt";
import type { NavItem } from "./nav";

export function Sidebar({ items }: { items: NavItem[] }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 border-r border-border bg-surface transition-all duration-[180ms] ease-in-out"
      style={{ width: collapsed ? 72 : 240 }}
    >
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border overflow-hidden">
        <img src="/icons/finite-nexus-logo.png" alt="" className="w-8 h-8 rounded-[9px] shrink-0" />
        {!collapsed && <span className="font-heading font-extrabold text-[19px] truncate">Finite Nexus</span>}
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm mx-2 rounded-control ${
                isActive ? "bg-primary text-white" : "text-text-primary hover:bg-bg"
              }`
            }
            title={item.label}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      {canInstall && (
        <button
          onClick={promptInstall}
          className="mx-2 mb-2 py-2 text-xs rounded-control bg-primary text-white hover:opacity-90"
          title="Install Finite Nexus"
        >
          {collapsed ? "⬇" : "⬇ Install App"}
        </button>
      )}
      <button
        onClick={toggleSidebar}
        className="border-t border-border py-3 text-sm text-text-secondary hover:bg-bg"
      >
        {collapsed ? "»" : "« Collapse"}
      </button>
    </aside>
  );
}
