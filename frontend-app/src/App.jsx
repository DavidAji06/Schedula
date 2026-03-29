import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Landing from "./pages/Landing";
import WeeklyCalendarGrid from "./components/WeeklyCalendarGrid";
import MonthlyCalendarGrid from "./components/MonthlyCalendarGrid";

export default function App() {
  const [view, setView] = useState("week");
  const [events, setEvents] = useState([]);


  function toggleView() {
    setView((v) => (v === "week" ? "month" : "week"));
  }

  const calendarProps = { view, onToggleView: toggleView, events, setEvents };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/app"
          element={
            view === "week"
              ? <WeeklyCalendarGrid {...calendarProps} />
              : <MonthlyCalendarGrid {...calendarProps} />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}