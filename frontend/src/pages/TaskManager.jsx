import { useEffect, useState } from "react";
import { getTasks, createTask, completeTask } from "../api/api";

const CATEGORIES = ["admin", "research", "coding", "writing", "meeting", "other"];
const PRIORITIES = [
  { value: 1, label: "Low", color: "bg-slate-100 text-slate-500" },
  { value: 2, label: "Medium", color: "bg-amber-100 text-amber-600" },
  { value: 3, label: "High", color: "bg-red-100 text-red-600" },
];

const EMPTY_FORM = {
  title: "",
  category: "coding",
  priority: 2,
  effort: 1,
  deadline_days: 7,
};

function AddTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Task name is required.");
    setLoading(true);
    setError("");
    try {
      await createTask({
        ...form,
        priority: Number(form.priority),
        effort: Number(form.effort),
        deadline_days: Number(form.deadline_days),
      });
      onCreated();
      onClose();
    } catch {
      setError("Failed to create task. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">Add New Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Task Name *</label>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Write literature review"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={set("category")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={set("priority")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Effort (hours)</label>
              <input
                type="number"
                min={1}
                max={8}
                value={form.effort}
                onChange={set("effort")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Deadline (days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={form.deadline_days}
                onChange={set("deadline_days")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskRow({ task, onComplete }) {
  const [confirming, setConfirming] = useState(false);
  const priority = PRIORITIES.find((p) => p.value === task.priority);
  const deadlineUrgent = task.deadline_days <= 2;

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-slate-800">{task.title}</td>
      <td className="py-3 px-4">
        <span className="text-xs capitalize bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
          {task.category}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${priority?.color}`}>
          {priority?.label}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-slate-600 text-center">{task.effort}h</td>
      <td className="py-3 px-4 text-center">
        <span className={`text-xs font-medium ${deadlineUrgent ? "text-red-600" : "text-slate-500"}`}>
          {deadlineUrgent ? "⚠️ " : ""}{task.deadline_days}d
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        {confirming ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-slate-500">Mark done?</span>
            <button
              onClick={() => { onComplete(task.id); setConfirming(false); }}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs border border-slate-200 text-slate-500 px-2 py-1 rounded-md hover:bg-slate-100"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs border border-emerald-300 text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded-md transition-colors"
          >
            Complete
          </button>
        )}
      </td>
    </tr>
  );
}

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const loadTasks = () =>
    getTasks().then((r) => setTasks(r.data)).catch(() => {});

  useEffect(() => { loadTasks(); }, []);

  const handleComplete = async (id) => {
    try {
      await completeTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Task marked as complete!");
    } catch {
      showToast("Failed to update task.");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filtered = tasks.filter((t) => {
    const matchesFilter = filter === "all" || t.category === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Task Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            {tasks.length} pending task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Search + category filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-52"
        />
        <div className="flex gap-2 flex-wrap">
          {["all", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${
                filter === c
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Task table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-medium">No tasks found</p>
            <p className="text-xs mt-1">
              {tasks.length === 0
                ? "Add your first task to get started."
                : "Try a different filter or search term."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="py-3 px-4 text-left">Task</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Priority</th>
                <th className="py-3 px-4 text-center">Effort</th>
                <th className="py-3 px-4 text-center">Deadline</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <TaskRow key={t.id} task={t} onComplete={handleComplete} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddTaskModal onClose={() => setShowModal(false)} onCreated={loadTasks} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
