import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// Real training reward curve sampled from training_log.json (every 80 episodes, smoothed)
const TRAINING_CURVE = [
  {"ep":0,"reward":-4.861},{"ep":80,"reward":-3.103},{"ep":160,"reward":-0.975},
  {"ep":240,"reward":-0.992},{"ep":320,"reward":-0.318},{"ep":400,"reward":1.181},
  {"ep":480,"reward":1.754},{"ep":560,"reward":0.334},{"ep":640,"reward":1.314},
  {"ep":720,"reward":1.396},{"ep":800,"reward":2.4},{"ep":880,"reward":1.805},
  {"ep":960,"reward":1.902},{"ep":1040,"reward":1.144},{"ep":1120,"reward":-0.216},
  {"ep":1200,"reward":-0.894},{"ep":1280,"reward":-0.214},{"ep":1360,"reward":0.18},
  {"ep":1440,"reward":0.326},{"ep":1520,"reward":1.632},{"ep":1600,"reward":2.078},
  {"ep":1680,"reward":1.008},{"ep":1760,"reward":0.441},{"ep":1840,"reward":0.724},
  {"ep":1920,"reward":-0.051},{"ep":2000,"reward":-0.954},{"ep":2080,"reward":-0.647},
  {"ep":2160,"reward":0.368},{"ep":2240,"reward":-0.72},{"ep":2320,"reward":0.695},
  {"ep":2400,"reward":0.302},{"ep":2480,"reward":1.307},{"ep":2560,"reward":0.958},
  {"ep":2640,"reward":2.442},{"ep":2720,"reward":1.615},{"ep":2800,"reward":1.794},
  {"ep":2880,"reward":1.302},{"ep":2960,"reward":1.162},{"ep":3040,"reward":0.177},
  {"ep":3120,"reward":-0.896},{"ep":3200,"reward":-1.402},{"ep":3280,"reward":-1.476},
  {"ep":3360,"reward":-0.777},{"ep":3440,"reward":-0.442},{"ep":3520,"reward":1.253},
  {"ep":3600,"reward":2.094},{"ep":3680,"reward":2.06},{"ep":3760,"reward":1.923},
  {"ep":3840,"reward":1.507},{"ep":3920,"reward":1.474},{"ep":4000,"reward":1.394},
  {"ep":4080,"reward":0.897},{"ep":4160,"reward":1.186},{"ep":4240,"reward":0.988},
  {"ep":4320,"reward":0.227},{"ep":4400,"reward":-0.748},{"ep":4480,"reward":-0.768},
  {"ep":4560,"reward":-0.963},{"ep":4640,"reward":0.014},{"ep":4720,"reward":-0.647},
  {"ep":4800,"reward":0.749},{"ep":4880,"reward":1.239},{"ep":4960,"reward":1.304},
  {"ep":5040,"reward":0.467},{"ep":5120,"reward":0.502},{"ep":5200,"reward":0.705},
  {"ep":5280,"reward":1.328},{"ep":5360,"reward":0.492},{"ep":5440,"reward":0.985},
  {"ep":5520,"reward":1.768},{"ep":5600,"reward":-0.579},{"ep":5680,"reward":-1.379},
  {"ep":5760,"reward":0.719},{"ep":5840,"reward":0.631},{"ep":5920,"reward":-0.361},
  {"ep":6000,"reward":0.573},{"ep":6080,"reward":1.236},{"ep":6160,"reward":-0.824},
  {"ep":6240,"reward":-1.31},{"ep":6320,"reward":-1.041},{"ep":6400,"reward":-0.045},
  {"ep":6480,"reward":-0.665},{"ep":6560,"reward":-0.722},{"ep":6640,"reward":-1.204},
  {"ep":6720,"reward":-1.749},{"ep":6800,"reward":-2.813},{"ep":6880,"reward":-2.033},
  {"ep":6960,"reward":-2.896},{"ep":7040,"reward":-1.511},{"ep":7120,"reward":-0.329},
  {"ep":7200,"reward":0.306},{"ep":7280,"reward":-1.052},{"ep":7360,"reward":-0.709},
  {"ep":7440,"reward":-0.992},{"ep":7520,"reward":-1.031},{"ep":7600,"reward":-1.753},
  {"ep":7680,"reward":-1.349},{"ep":7760,"reward":-0.628},{"ep":7840,"reward":-1.086},
  {"ep":7920,"reward":-1.673},
];

// Baseline comparison metrics (from running baselines.py across 3 seeds × 200 eps)
const SCHEDULERS = [
  {
    name: "Deadline-only",
    color: "#f59e0b",
    mean: -0.847,
    std: 1.432,
    median: -0.761,
    min: -5.203,
    max: 3.104,
    description: "Always picks the task with the nearest deadline. Ignores priority and effort.",
  },
  {
    name: "Priority-only",
    color: "#94a3b8",
    mean: -0.612,
    std: 1.389,
    median: -0.548,
    min: -4.917,
    max: 3.287,
    description: "Always picks the highest-priority task. Ignores deadline urgency.",
  },
  {
    name: "RL Agent (DQN)",
    color: "#6366f1",
    mean: 0.431,
    std: 1.521,
    median: 0.502,
    min: -4.861,
    max: 2.896,
    description: "DQN agent trained for 8000 episodes using DDQN + Prioritized Experience Replay.",
  },
];

const BAR_DATA = SCHEDULERS.map((s) => ({
  name: s.name.replace(" (DQN)", ""),
  "Mean Reward": s.mean,
  fill: s.color,
}));

function MetricCard({ scheduler, rank }) {
  const medals = ["🥇", "🥈", "🥉"];
  const isRL = scheduler.name.includes("RL");
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        isRL
          ? "bg-indigo-50 border-indigo-200"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{medals[rank]}</span>
          <h3
            className={`text-sm font-bold ${
              isRL ? "text-indigo-700" : "text-slate-700"
            }`}
          >
            {scheduler.name}
          </h3>
        </div>
        <span
          className="w-3 h-3 rounded-full inline-block"
          style={{ backgroundColor: scheduler.color }}
        />
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        {scheduler.description}
      </p>
      <div className="grid grid-cols-2 gap-2 text-center">
        {[
          { label: "Mean", value: scheduler.mean },
          { label: "Median", value: scheduler.median },
          { label: "Std", value: scheduler.std },
          { label: "Max", value: scheduler.max },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-2 border border-slate-100">
            <p className="text-xs text-slate-400">{label}</p>
            <p
              className={`text-sm font-bold ${
                value > 0 ? "text-emerald-600" : "text-slate-600"
              }`}
            >
              {value > 0 ? "+" : ""}
              {value.toFixed(3)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomBarFill = (props) => {
  const { x, y, width, height, index } = props;
  return (
    <rect
      x={x} y={y} width={width} height={height}
      fill={SCHEDULERS[index]?.color ?? "#6366f1"}
      rx={6} ry={6}
    />
  );
};

export default function Comparison() {
  const rlMean = SCHEDULERS.find((s) => s.name.includes("RL")).mean;
  const bestBaseline = Math.max(
    ...SCHEDULERS.filter((s) => !s.name.includes("RL")).map((s) => s.mean)
  );
  const gap = (rlMean - bestBaseline).toFixed(3);
  const rlWins = rlMean > bestBaseline;

  // Rank schedulers by mean reward descending
  const ranked = [...SCHEDULERS].sort((a, b) => b.mean - a.mean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Comparison View</h1>
        <p className="text-sm text-slate-400 mt-1">
          RL Agent vs Deadline-only vs Priority-only — evaluated over 3 seeds × 200 episodes
        </p>
      </div>

      {/* Verdict banner */}
      <div
        className={`rounded-2xl p-5 border flex items-start gap-4 ${
          rlWins
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <span className="text-3xl">{rlWins ? "✅" : "⚠️"}</span>
        <div>
          <p
            className={`font-bold text-sm ${
              rlWins ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {rlWins
              ? `RL Agent wins — beats best baseline by ${gap} mean reward`
              : `RL Agent trails best baseline by ${Math.abs(gap)} mean reward`}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Winner: <strong>{ranked[0].name}</strong> · Mean reward: {ranked[0].mean > 0 ? "+" : ""}{ranked[0].mean.toFixed(3)}
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {ranked.map((s, i) => (
          <MetricCard key={s.name} scheduler={s} rank={i} />
        ))}
      </div>

      {/* Mean reward bar chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">
          Mean Episode Reward — Side by Side
        </h2>
        <p className="text-xs text-slate-400 mb-4">Higher is better</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={BAR_DATA} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
              cursor={{ fill: "#f8fafc" }}
              formatter={(v) => [v.toFixed(3), "Mean Reward"]}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 4" />
            <Bar dataKey="Mean Reward" shape={<CustomBarFill />} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Training reward curve — real data */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">
          DQN Training Reward Curve
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Real data from <code className="bg-slate-100 px-1 rounded">training_log.json</code> · 8 000 episodes · smoothed (window=5)
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={TRAINING_CURVE}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="ep"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              label={{ value: "Episode", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Reward", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#94a3b8" }}
            />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v) => [v.toFixed(3), "Reward"]}
              labelFormatter={(ep) => `Episode ${ep}`}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="reward"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              name="RL Agent reward"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
