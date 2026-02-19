import { useEffect, useState } from "react";
import WeeklyCalendarGrid from "./components/WeeklyCalendarGrid";
import MonthlyCalendarGrid from "./components/MonthlyCalendarGrid";

function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;

  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  return prefersLight ? "light" : "dark";
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [view, setView] = useState("week"); // "week" | "month"
  const [events, setEvents] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function toggleView() {
    setView((v) => (v === "week" ? "month" : "week"));
  }

  return view === "week" ? (
    <WeeklyCalendarGrid
      theme={theme}
      onToggleTheme={toggleTheme}
      view={view}
      onToggleView={toggleView}
      events={events}
      setEvents={setEvents}
    />
  ) : (
    <MonthlyCalendarGrid
      theme={theme}
      onToggleTheme={toggleTheme}
      view={view}
      onToggleView={toggleView}
      events={events}
      setEvents={setEvents}
    />
  );
}
