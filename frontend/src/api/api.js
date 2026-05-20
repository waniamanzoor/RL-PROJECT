import axios from "axios";

const BASE_URL = "https://rl-project-api.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
});

// Tasks
export const getTasks = () => api.get("/tasks");
export const createTask = (data) => api.post("/tasks", data);
export const completeTask = (id) => api.post(`/tasks/${id}/complete`);

// RL Recommendation
export const getRecommendation = (energy) =>
  api.get("/recommend", { params: { energy } });

// Energy
export const logEnergy = (energy_level) =>
  api.post("/energy", { energy_level });

// Reports
export const getWeeklyReport = () => api.get("/report/weekly");

// Health check
export const checkHealth = async () => {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok ? "connected" : "disconnected";
  } catch {
    return "disconnected";
  }
};