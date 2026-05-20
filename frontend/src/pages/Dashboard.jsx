import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTasks, getRecommendation, logEnergy, getWeeklyReport } from "../api/api";

// ── Category colours ──────────────────────────────────────────────
const CATEGORY_COLORS = {
  work:        { bg: "#B3E5FC", text: "#0277BD", dot: "#29B6F6" },
  personal:    { bg: "#E1BEE7", text: "#6A1B9A", dot: "#AB47BC" },
  "self care": { bg: "#F8BBD0", text: "#AD1457", dot: "#EC407A" },
  home:        { bg: "#C8E6C9", text: "#2E7D32", dot: "#66BB6A" },
  study:       { bg: "#FFF9C4", text: "#F57F17", dot: "#FFCA28" },
};

// ── Calendar helpers ──────────────────────────────────────────────
function getAbsoluteDeadline(deadlineDays) {
  if (deadlineDays == null) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + deadlineDays);
  return d;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LETTERS = ["M","T","W","T","F","S","S"];

// ── Mini Calendar ─────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, deadlineDates = [] }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDow = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const hasDeadline = (day) => deadlineDates.some((dl) => dl && isSameDay(dl, day));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-800">
          {MONTH_SHORT[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LETTERS.map((d, i) => (
          <div key={i} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: startOffset }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasDL = hasDeadline(day);
          return (
            <div key={i} className="flex flex-col items-center">
              <button
                onClick={() => onSelect(day)}
                className={`flex items-center justify-center text-xs h-6 w-6 rounded-full transition-colors
                  ${isSelected ? "bg-indigo-600 text-white" :
                    isToday ? "bg-indigo-50 text-indigo-600 font-semibold" :
                    "text-slate-600 hover:bg-slate-100"}`}
              >
                {i + 1}
              </button>
              {hasDL && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, color = "text-slate-900" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex-1">
      <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value ?? "—"}</p>
      <p className="text-xs text-slate-400 mt-1">Task count</p>
    </div>
  );
}

// ── Energy Picker ─────────────────────────────────────────────────
function EnergyPicker({ value, onChange }) {
  const labels = ["", "Very Low", "Low", "Moderate", "High", "Peak"];
  const activeColors = [
    "",
    "bg-red-100 text-red-600 border-red-300",
    "bg-orange-100 text-orange-600 border-orange-300",
    "bg-amber-100 text-amber-600 border-amber-300",
    "bg-lime-100 text-lime-600 border-lime-300",
    "bg-emerald-100 text-emerald-600 border-emerald-300",
  ];
  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-2">Your energy level right now</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
              value === n
                ? activeColors[n] + " scale-105 shadow-sm"
                : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
          >
            <div className="text-base leading-none mb-0.5">{n}</div>
            <div className="opacity-80">{labels[n]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Today Task Card (RL scheduler inline) ─────────────────────────
function TodayTaskCard() {
  const [open, setOpen] = useState(false);
  const [energy, setEnergy] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    setLoading(true);
    setError("");
    try {
      await logEnergy(energy);
      const res = await getRecommendation(energy);
      setResult(res.data);
    } catch {
      setError("Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  };

  const rec = result?.recommended;
  const priorityLabel = ["", "Low", "Medium", "High"][rec?.priority] ?? "—";

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
      <h2 className="text-xl font-bold text-slate-800">Today Task</h2>
      <p className="text-sm text-slate-500 mt-0.5 mb-4">Check your daily tasks and schedules</p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Today's schedule
        </button>
      ) : (
        <div className="space-y-4">
          <EnergyPicker value={energy} onChange={setEnergy} />
          <button
            onClick={handleAsk}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? "Asking the RL agent..." : "What should I do next?"}
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}

          {rec && (
            <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide">RL Recommends</p>
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-mono">
                  Q: {rec.q_value}
                </span>
              </div>
              <p className="text-base font-bold text-slate-800 mb-2">{rec.title}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                  Priority: {priorityLabel}
                </span>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                  Productivity: {((result?.productivity_score ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {result && !rec && (
            <p className="text-sm text-center text-slate-400">
              No pending tasks. Add tasks in Task Manager first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Right Calendar Panel ──────────────────────────────────────────
function TaskCalendarPanel({ tasks }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDates = tasks.map((t) => getAbsoluteDeadline(t.deadline_days)).filter(Boolean);

  const tasksOnDay = tasks.filter((t) => {
    const dl = getAbsoluteDeadline(t.deadline_days);
    return dl && isSameDay(dl, selectedDate);
  });

  const isToday = isSameDay(selectedDate, today);
  const dateLabel = isToday
    ? "Today"
    : selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="w-60 flex-shrink-0 space-y-4">
      <MiniCalendar
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        deadlineDates={deadlineDates}
      />
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-700 mb-3">{dateLabel}</p>
        {tasksOnDay.length === 0 ? (
          <p className="text-xs text-slate-400">No tasks due</p>
        ) : (
          <div className="space-y-2">
            {tasksOnDay.map((t) => {
              const c = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.work;
              return (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl border-l-[3px]"
                  style={{ backgroundColor: c.bg, borderLeftColor: c.dot, color: c.text }}
                >
                  <p className="text-xs font-semibold leading-tight">{t.title}</p>
                  <p className="text-xs mt-0.5 opacity-60 capitalize">{t.category}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [report, setReport] = useState(null);

  useEffect(() => {
    getTasks().then((r) => setTasks(r.data)).catch(() => {});
    getWeeklyReport().then((r) => setReport(r.data)).catch(() => {});
  }, []);

  const completedCount   = report?.completed_tasks ?? "—";
  const incompletedCount = tasks.length;
  const overdueCount     = tasks.filter((t) => t.deadline_days != null && t.deadline_days < 0).length;
  const totalCount       = typeof completedCount === "number" ? completedCount + tasks.length : "—";

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hi! Let's get productive today.</h1>
        <p className="text-sm text-slate-400 mt-1">{todayLabel}</p>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex gap-4">
            <StatCard label="Completed Tasks"   value={completedCount}   color="text-emerald-600" />
            <StatCard label="Incompleted Tasks" value={incompletedCount} color="text-indigo-600" />
            <StatCard label="Overdue Tasks"     value={overdueCount}     color="text-red-500" />
            <StatCard label="Total Tasks"       value={totalCount} />
          </div>
          <TodayTaskCard />
        </div>
        <TaskCalendarPanel tasks={tasks} />
      </div>
    </div>
  );
}
