import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/tasks", label: "Task Manager", icon: "📋" },
  { to: "/scheduler", label: "RL Scheduler", icon: "🤖" },
  { to: "/analytics", label: "Analytics", icon: "📊" },
  { to: "/comparison", label: "Comparison", icon: "⚖️" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col py-6 px-4 fixed top-0 left-0">
      <div className="mb-8">
        <h1 className="text-lg font-bold text-indigo-600 leading-tight">
          Task Scheduler
        </h1>
        <p className="text-xs text-slate-400 mt-1">RL-Powered · CT-469</p>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
