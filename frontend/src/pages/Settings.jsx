import { useState, useEffect } from "react";

const DEFAULTS = {
  name: "",
  workStart: "09:00",
  workEnd: "17:00",
  workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  defaultFocus: 25,
  breakReminder: true,
  energyReminder: true,
  backendUrl: "http://localhost:8000",
};

const STORAGE_KEY = "rl_scheduler_settings";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FOCUS_OPTIONS = [25, 45, 60];

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors ${
        value ? "bg-indigo-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          value ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(load);
  const [saved, setSaved] = useState(false);

  const set = (key) => (value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const toggleDay = (day) => {
    const days = settings.workDays.includes(day)
      ? settings.workDays.filter((d) => d !== day)
      : [...settings.workDays, day];
    set("workDays")(days);
  };

  const handleSave = () => {
    save(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Preferences are saved locally in your browser.
        </p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <Field label="Your Name" hint="Shown on the dashboard header">
          <input
            type="text"
            value={settings.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Muskan"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </Field>
      </Section>

      {/* Work Hours */}
      <Section title="Work Hours">
        <Field label="Work Window" hint="Hours during which tasks are scheduled">
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={settings.workStart}
              onChange={(e) => set("workStart")(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="time"
              value={settings.workEnd}
              onChange={(e) => set("workEnd")(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </Field>

        <Field label="Work Days" hint="Days the RL agent considers active">
          <div className="flex gap-1.5">
            {ALL_DAYS.map((day) => {
              const active = settings.workDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {day.slice(0, 1)}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      {/* Focus Session */}
      <Section title="Focus Session">
        <Field label="Default Focus Duration" hint="Pre-selected timer length on the RL Scheduler page">
          <div className="flex gap-2">
            {FOCUS_OPTIONS.map((mins) => (
              <button
                key={mins}
                onClick={() => set("defaultFocus")(mins)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  settings.defaultFocus === mins
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Break Reminders"
          hint="Show break suggestions after each completed focus session"
        >
          <Toggle value={settings.breakReminder} onChange={set("breakReminder")} />
        </Field>

        <Field
          label="Energy Check-in Reminder"
          hint="Prompt to log energy when opening the app"
        >
          <Toggle value={settings.energyReminder} onChange={set("energyReminder")} />
        </Field>
      </Section>

      {/* Backend */}
      <Section title="Backend Connection">
        <Field label="API Base URL" hint="FastAPI server address">
          <input
            type="text"
            value={settings.backendUrl}
            onChange={(e) => set("backendUrl")(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
          />
        </Field>
      </Section>

      {/* About */}
      <Section title="About">
        <div className="text-sm text-slate-500 space-y-1">
          <p><span className="font-medium text-slate-700">Project:</span> Intelligent Task Scheduler & Productivity Optimizer</p>
          <p><span className="font-medium text-slate-700">Course:</span> CT-469 — Reinforcement Learning</p>
          <p><span className="font-medium text-slate-700">Agent:</span> DQN with DDQN + Prioritized Experience Replay</p>
          <p><span className="font-medium text-slate-700">Training:</span> 8 000 episodes across 3 seeds</p>
          <p><span className="font-medium text-slate-700">Frontend:</span> React + Vite + Tailwind CSS + Recharts</p>
          <p><span className="font-medium text-slate-700">Backend:</span> FastAPI + SQLAlchemy + PyTorch</p>
        </div>
      </Section>

      {/* Save / Reset */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
        >
          {saved ? "✓ Saved!" : "Save Settings"}
        </button>
        <button
          onClick={handleReset}
          className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
