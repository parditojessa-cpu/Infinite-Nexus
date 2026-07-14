import { NavLink } from "react-router-dom";
import type { NavItem } from "./nav";
import { MOBILE_TAB_COUNT } from "./nav";

export function BottomTabBar({ items, onMore }: { items: NavItem[]; onMore: () => void }) {
  const primary = items.slice(0, MOBILE_TAB_COUNT - 1);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border flex pb-[env(safe-area-inset-bottom)]">
      {primary.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] min-h-[44px] ${
              isActive ? "text-primary font-semibold" : "text-text-secondary"
            }`
          }
        >
          <span className="text-lg leading-none">{item.icon}</span>
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
      <button
        onClick={onMore}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] min-h-[44px] text-text-secondary"
      >
        <span className="text-lg leading-none">⋯</span>
        <span>More</span>
      </button>
    </nav>
  );
}
