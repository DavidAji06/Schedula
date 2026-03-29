import { useEffect, useState } from "react";
import WeeklyCalendarGrid from "./components/WeeklyCalendarGrid";
import MonthlyCalendarGrid from "./components/MonthlyCalendarGrid";

export default function App() {
  const [view, setView] = useState("week");
  const [events, setEvents] = useState([]);

  // Force dark theme permanently
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  function toggleView() {
    setView((v) => (v === "week" ? "month" : "week"));
  }

  return view === "week" ? (
    <WeeklyCalendarGrid
      view={view}
      onToggleView={toggleView}
      events={events}
      setEvents={setEvents}
    />
  ) : (
    <MonthlyCalendarGrid
      view={view}
      onToggleView={toggleView}
      events={events}
      setEvents={setEvents}
    />
  );
}