import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { checkHealth } from "../api/api";

const links = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/tasks", label: "Task Manager", icon: "📋" },
  { to: "/scheduler", label: "RL Scheduler", icon: "🤖" },
  { to: "/analytics", label: "Analytics", icon: "📊" },
  { to: "/comparison", label: "Comparison", icon: "⚖️" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

const statusConfig = {
  connected:    { bg: "bg-green-50",  text: "text-green-600",  dot: "bg-green-500",  label: "Connected" },
  disconnected: { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500",    label: "Disconnected" },
  checking:     { bg: "bg-yellow-50", text: "text-yellow-600", dot: "bg-yellow-400", label: "Checking..." },
};

export default function Sidebar() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const check = async () => setStatus(await checkHealth());
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const s = statusConfig[status];

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col py-6 px-4 fixed top-0 left-0">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-indigo-600 leading-tight">
            Task Scheduler
          </h1>
          <p className="text-xs text-slate-400 mt-1">RL-Powered · CT-469</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${s.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
        </div>
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