import { NavLink } from "react-router-dom";
import { useInstallPrompt } from "../lib/useInstallPrompt";
import type { NavItem } from "./nav";
import { MOBILE_TAB_COUNT } from "./nav";

export function MoreDrawer({
  items,
  open,
  onClose,
}: {
  items: NavItem[];
  open: boolean;
  onClose: () => void;
}) {
  const { canInstall, promptInstall } = useInstallPrompt();
  if (!open) return null;
  const rest = items.slice(MOBILE_TAB_COUNT - 1);

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-72 max-w-[80vw] bg-surface h-full p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="font-heading font-bold text-lg">More</span>
          <button onClick={onClose} className="text-xl leading-none px-2">
            ×
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {rest.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-control text-sm min-h-[44px] ${
                  isActive ? "bg-primary text-white" : "hover:bg-bg"
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          {canInstall && (
            <button
              onClick={() => {
                promptInstall();
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-3 rounded-control text-sm min-h-[44px] bg-primary text-white mt-2"
            >
              <span className="text-base">⬇</span>
              <span>Install App</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
