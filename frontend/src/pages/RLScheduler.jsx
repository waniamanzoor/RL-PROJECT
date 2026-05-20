import { useState, useEffect, useRef } from "react";
import { getRecommendation, logEnergy } from "../api/api";

function deadlineLabel(deadline) {
  if (!deadline) return "No deadline";
  const days = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (days === 0) return "Due today";
  if (days < 0) return `Overdue by ${Math.abs(days)} days`;
  return `Due in ${days} days`;
}

const FOCUS_DURATIONS = [
  { label: "25 min", seconds: 25 * 60 },
  { label: "45 min", seconds: 45 * 60 },
  { label: "60 min", seconds: 60 * 60 },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

function EnergyPicker({ value, onChange }) {
  const labels = ["", "Very Low", "Low", "Moderate", "High", "Peak"];
  const colors = [
    "",
    "bg-red-100 text-red-600 border-red-200",
    "bg-orange-100 text-orange-600 border-orange-200",
    "bg-amber-100 text-amber-600 border-amber-200",
    "bg-lime-100 text-lime-600 border-lime-200",
    "bg-emerald-100 text-emerald-600 border-emerald-200",
  ];
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-2">Your energy level right now</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
              value === n
                ? colors[n] + " scale-105 shadow-sm"
                : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
          >
            <div className="text-lg leading-none mb-0.5">{n}</div>
            <div className="hidden sm:block">{labels[n]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecommendedCard({ rec, productivity, onStart }) {
  if (!rec) return null;
  const priorityLabel = ["", "Low", "Medium", "High"][rec.priority] ?? "—";
  const priorityColor = ["", "text-slate-500", "text-amber-600", "text-red-600"][rec.priority];
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">
            🤖 RL Agent Recommends
          </p>
          <h2 className="text-2xl font-bold leading-tight">{rec.title}</h2>
        </div>
        <span className="bg-white/20 text-white text-xs font-mono px-2 py-1 rounded-lg">
          Q: {rec.q_value}
        </span>
      </div>
      <div className="flex gap-3 text-sm flex-wrap mb-5">
        <span className={`bg-white/20 px-3 py-1 rounded-full text-white text-xs font-medium`}>
          Priority: {priorityLabel}
        </span>
        <span className="bg-white/20 px-3 py-1 rounded-full text-white text-xs font-medium">
          {deadlineLabel(rec.deadline)}
        </span>
        <span className="bg-white/20 px-3 py-1 rounded-full text-white text-xs font-medium">
          Productivity: {(productivity * 100).toFixed(0)}%
        </span>
      </div>
      <button
        onClick={onStart}
        className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm py-2.5 rounded-xl transition-colors"
      >
        Start Focus Timer →
      </button>
    </div>
  );
}

function FocusTimer({ taskTitle, onDone }) {
  const [durationIdx, setDurationIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATIONS[0].seconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  const duration = FOCUS_DURATIONS[durationIdx].seconds;
  const progress = ((duration - timeLeft) / duration) * 100;
  const circumference = 2 * Math.PI * 54;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleDurationChange = (idx) => {
    if (running) return;
    setDurationIdx(idx);
    setTimeLeft(FOCUS_DURATIONS[idx].seconds);
    setFinished(false);
  };

  const handleToggle = () => {
    if (finished) return;
    setRunning((r) => !r);
  };

  const handleReset = () => {
    setRunning(false);
    setFinished(false);
    setTimeLeft(FOCUS_DURATIONS[durationIdx].seconds);
  };

  if (finished) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Focus session complete!</h3>
        <p className="text-sm text-slate-500 mb-5">
          Great work on <span className="font-medium text-slate-700">"{taskTitle}"</span>.
          Take a break before your next session.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 text-left">
          <p className="text-sm font-semibold text-emerald-700 mb-2">☕ Suggested break activities</p>
          <ul className="text-xs text-emerald-600 space-y-1 list-disc list-inside">
            <li>Step away from your screen for 5–10 minutes</li>
            <li>Drink some water or have a snack</li>
            <li>Do a short stretch or walk</li>
            <li>Practice box breathing (4s in → 4s hold → 4s out)</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2 rounded-xl hover:bg-slate-50"
          >
            New Session
          </button>
          <button
            onClick={onDone}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-xl"
          >
            Get Next Task
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-1">Focus Timer</h3>
      <p className="text-xs text-slate-400 mb-5 truncate">
        Focusing on: <span className="text-slate-600 font-medium">{taskTitle}</span>
      </p>

      {/* Duration picker */}
      <div className="flex gap-2 mb-6">
        {FOCUS_DURATIONS.map((d, i) => (
          <button
            key={i}
            onClick={() => handleDurationChange(i)}
            disabled={running}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
              durationIdx === i
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="#6366f1"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold font-mono text-slate-800">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="border border-slate-200 text-slate-500 text-sm px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleToggle}
          className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-colors ${
            running
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {running ? "⏸ Pause" : "▶ Start"}
        </button>
      </div>
    </div>
  );
}

function RankedList({ ranked }) {
  const [open, setOpen] = useState(false);
  if (!ranked || ranked.length <= 1) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span>All tasks ranked by RL agent</span>
        <span className="text-slate-400 text-lg leading-none">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="divide-y divide-slate-100 px-5 pb-4">
          {ranked.map((t, i) => (
            <li key={t.task_id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold w-5 ${i === 0 ? "text-indigo-600" : "text-slate-300"}`}>
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">{t.title}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">Q: {t.q_value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RLScheduler() {
  const [energy, setEnergy] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusing, setFocusing] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    setError("");
    setFocusing(false);
    try {
      await logEnergy(energy);
      const res = await getRecommendation(energy);
      setResult(res.data);
    } catch {
      setError("Could not reach the backend. Make sure the FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setFocusing(false);
    setResult(null);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">RL Scheduler</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ask the DQN agent what to work on next based on your current state.
        </p>
      </div>

      {/* Ask panel */}
      {!focusing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <EnergyPicker value={energy} onChange={setEnergy} />
          <button
            onClick={handleAsk}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Asking the RL agent..." : "🤖 What should I do next?"}
          </button>
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </div>
      )}

      {/* Recommendation */}
      {result?.recommended && !focusing && (
        <RecommendedCard
          rec={result.recommended}
          productivity={result.productivity_score ?? 0}
          onStart={() => setFocusing(true)}
        />
      )}

      {result && !result.recommended && !focusing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-slate-400">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm font-medium">No pending tasks!</p>
          <p className="text-xs mt-1">Add tasks in the Task Manager first.</p>
        </div>
      )}

      {/* Focus timer */}
      {focusing && result?.recommended && (
        <FocusTimer
          taskTitle={result.recommended.title}
          onDone={handleDone}
        />
      )}

      {/* Ranked list */}
      {result && !focusing && (
        <RankedList ranked={result.all_ranked} />
      )}
    </div>
  );
}
