import { useEffect, useState } from "react";
import { getTasks, getRecommendation, logEnergy, getWeeklyReport } from "../api/api";

function deadlineLabel(deadline) {
  if (!deadline) return "No deadline";
  const days = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (days === 0) return "Due today";
  if (days < 0) return `Overdue by ${Math.abs(days)} days`;
  return `Due in ${days} days`;
}

function EnergySlider({ value, onChange, onSubmit }) {
  const labels = ["", "Very Low", "Low", "Moderate", "High", "Peak"];
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        How is your energy right now?
      </h2>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n} — {labels[n]}</span>
        ))}
      </div>
      <button
        onClick={onSubmit}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Log Energy
      </button>
    </div>
  );
}

function RecommendedTask({ task, productivity }) {
  if (!task) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-base font-semibold text-slate-700 mb-2">
          Today's Recommended Task
        </h2>
        <p className="text-slate-400 text-sm">No pending tasks. Add tasks to get a recommendation.</p>
      </div>
    );
  }
  const priorityLabel = ["", "Low", "Medium", "High"][task.priority] || "—";
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl shadow-sm p-6 border border-indigo-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-indigo-700">
          🤖 RL Recommended Task
        </h2>
        <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
          Q-score: {task.q_value}
        </span>
      </div>
      <p className="text-xl font-bold text-slate-800 mb-3">{task.title}</p>
      <div className="flex gap-3 text-sm text-slate-600 flex-wrap">
        <span className="bg-white px-2 py-1 rounded-md border border-indigo-200">
          Priority: {priorityLabel}
        </span>
        <span className="bg-white px-2 py-1 rounded-md border border-indigo-200">
          {deadlineLabel(task.deadline)}
        </span>
        <span className="bg-white px-2 py-1 rounded-md border border-indigo-200">
          Productivity: {(productivity * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color ?? "text-slate-800"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [energy, setEnergy] = useState(3);
  const [recommendation, setRecommendation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [report, setReport] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    getTasks().then((r) => setTasks(r.data)).catch(() => {});
    getRecommendation(3).then((r) => setRecommendation(r.data)).catch(() => {});
    getWeeklyReport().then((r) => setReport(r.data)).catch(() => {});
  }, []);

  const handleLogEnergy = async () => {
    try {
      await logEnergy(energy);
      const rec = await getRecommendation(energy);
      setRecommendation(rec.data);
      showToast("Energy logged!");
    } catch {
      showToast("Backend not reachable.");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Tasks" value={pendingCount} sub="in queue" color="text-indigo-600" />
        <StatCard label="Completed" value={report?.completed_tasks ?? "—"} sub="all time" color="text-emerald-600" />
        <StatCard label="Avg Energy" value={report?.average_energy ?? "—"} sub="this week" color="text-amber-500" />
        <StatCard label="Sessions" value={report?.total_sessions ?? "—"} sub="this week" />
      </div>

      {/* Energy input */}
      <EnergySlider value={energy} onChange={setEnergy} onSubmit={handleLogEnergy} />

      {/* Recommendation */}
      <RecommendedTask
        task={recommendation?.recommended}
        productivity={recommendation?.productivity_score ?? 0}
      />

      {/* Pending task list */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Pending Tasks</h2>
          <ul className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{t.title}</p>
                  <p className="text-xs text-slate-400">{t.category} · {deadlineLabel(t.deadline)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium
                  ${t.priority === 3 ? "bg-red-100 text-red-600" :
                    t.priority === 2 ? "bg-amber-100 text-amber-600" :
                    "bg-slate-100 text-slate-500"}`}>
                  {["", "Low", "Medium", "High"][t.priority]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
