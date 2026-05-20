import { NavLink } from "react-router-dom";
import { Home, ClipboardList, BarChart2, Scale, Settings } from "lucide-react";

const mainLinks = [
  { to: "/", label: "Dashboard", Icon: Home },
  { to: "/tasks", label: "Task Manager", Icon: ClipboardList },
  { to: "/analytics", label: "Analytics", Icon: BarChart2 },
  { to: "/comparison", label: "Comparison", Icon: Scale },
];

export default function Sidebar() {
  return (
    <aside className="w-44 min-h-screen bg-white border-r border-slate-200 flex flex-col py-5 px-3 fixed top-0 left-0 z-40">
      <div className="px-2 mb-7">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">RL</span>
          </div>
          <span className="text-sm font-bold text-slate-800">Scheduler</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {mainLinks.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`
            }
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            isActive
              ? "bg-indigo-600 text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`
        }
      >
        <Settings size={16} strokeWidth={1.75} />
        Settings
      </NavLink>
    </aside>
  );
}
