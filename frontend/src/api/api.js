import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

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
