import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import WeeklyCalendarGrid from "./components/WeeklyCalendarGrid";
import MonthlyCalendarGrid from "./components/MonthlyCalendarGrid";
import { fetchEvents, fetchTasks } from "./services/api";

export default function App() {
  const [view, setView] = useState("week");
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [username, setUsername] = useState("");

  // Load events and tasks when a token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetchEvents().then(setEvents).catch(console.error);
    fetchTasks().then(setTasks).catch(console.error);
  }, []);

  function toggleView() {
    setView((v) => (v === "week" ? "month" : "week"));
  }

  const calendarProps = { view, onToggleView: toggleView, events, setEvents, username, tasks, setTasks };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth onLogin={setUsername} />} />
        <Route
          path="/app"
          element={
            view === "week"
              ? <WeeklyCalendarGrid {...calendarProps} />
              : <MonthlyCalendarGrid {...calendarProps} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}