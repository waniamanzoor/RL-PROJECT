import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import TaskManager from "./pages/TaskManager";
import RLScheduler from "./pages/RLScheduler";
import Analytics from "./pages/Analytics";
import Comparison from "./pages/Comparison";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="ml-60 flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/scheduler" element={<RLScheduler />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
