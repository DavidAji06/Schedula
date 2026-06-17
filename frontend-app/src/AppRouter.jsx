import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth.jsx";
import Landing from "./pages/Landing.jsx";
import WeeklyCalendarGrid from "./components/WeeklyCalendarGrid.jsx";
import MonthlyCalendarGrid from "./components/MonthlyCalendarGrid.jsx";
import { fetchEvents } from "./services/api.js";

export default function AppRouter() {
  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || ""
  );
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("week");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchEvents().then(setEvents).catch(() => {});
    }
  }, []);

  function handleLogin(name) {
    setUsername(name);
    localStorage.setItem("username", name);
    fetchEvents().then(setEvents).catch(() => {});
  }

  function toggleTheme() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }

  function toggleView() {
    setView((v) => (v === "week" ? "month" : "week"));
  }

  const calendarProps = {
    theme,
    onToggleTheme: toggleTheme,
    view,
    onToggleView: toggleView,
    events,
    setEvents,
    username,
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
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
  );
}