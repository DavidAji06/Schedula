import { useMemo, useState, useEffect } from "react";
import "./WeeklyCalendarGrid.css";
import EventModal from "./EventModal";
import TodoSidebar from "./Todosidebar";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(startDate = new Date()) {
  const date = new Date(startDate);
  const day = date.getDay(); // Sun=0..Sat=6
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diffToMonday);
  

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() + i);
    week.push(d);
  }
  return week;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function WeeklyCalendarGrid({ theme, onToggleTheme, view, onToggleView, events, setEvents }) {
  const weekDates = useMemo(() => getWeekDates(new Date()), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [todoOpen, setTodoOpen] = useState(false);

  // Tick every minute so countdowns stay fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const eventToEdit = editingId ? events.find((e) => e.id === editingId) : null;

  function openAddForDate(date) {
    setEditingId(null);
    setSelectedDate(date);
    setModalOpen(true);
  }

  function openEdit(ev) {
    setEditingId(ev.id);
    setSelectedDate(new Date(ev.start));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  function handleSave(payload) {
    if (editingId) {
      setEvents((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...payload } : e)));
    } else {
      setEvents((prev) => [...prev, { id: crypto.randomUUID(), ...payload }]);
    }
    closeModal();
  }

  function handleDelete() {
    if (!editingId) return;
    setEvents((prev) => prev.filter((e) => e.id !== editingId));
    closeModal();
  }

  // Returns a Set of event IDs that conflict with at least one other event on the same day
  function getConflictIds(dayEvents) {
    const ids = new Set();
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const a = dayEvents[i], b = dayEvents[j];
        // Overlap when a starts before b ends AND b starts before a ends
        if (a.startD < b.endD && b.startD < a.endD) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return ids;
  }

  function toggleCountdown(e, evId) {
    e.stopPropagation();
    setEvents((prev) =>
      prev.map((ev) => ev.id === evId ? { ...ev, countdown: !ev.countdown } : ev)
    );
  }

  function formatCountdown(start) {
    const diffMs = new Date(start) - now;
    if (diffMs < 0) return null; // past
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 60) return `in ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `in ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `in ${diffDays}d`;
  }

  function eventsForDay(dayDate) {
    return events
      .map((ev) => ({ ...ev, startD: new Date(ev.start), endD: new Date(ev.end) }))
      .filter((ev) => isSameDay(ev.startD, dayDate))
      .sort((a, b) => a.startD - b.startD);
  }

  function formatTime(d) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="week">
      <EventModal
        open={modalOpen}
        mode={editingId ? "edit" : "add"}
        initialStart={(() => {
          const d = new Date(selectedDate);
          d.setHours(9, 0, 0, 0);
          return d;
        })()}
        initialEnd={(() => {
          const d = new Date(selectedDate);
          d.setHours(10, 0, 0, 0);
          return d;
        })()}
        eventToEdit={eventToEdit}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <header className="week__topbar">
        <div>
          <h1 className="week__title">Weekly Timetable</h1>
          <p className="week__subtitle">
            {weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
            {weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        </div>

        <div className="week__actions">
          <button className="week__iconBtn" type="button" onClick={onToggleTheme}>
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>

          <button className="week__iconBtn" type="button" onClick={onToggleView}>
            {view === "week" ? "🗓️ Month" : "📆 Week"}
          </button>

          <button className="week__btn" type="button" onClick={() => openAddForDate(new Date())}>
            + Add event
          </button>

          <button className="week__iconBtn" type="button" onClick={() => setTodoOpen(true)}>
            ✓ Tasks
          </button>
        </div>
      </header>

      <section className="week__card">
        <div className="grid grid--header">
          {DAYS.map((label, i) => {
            const d = weekDates[i];
            const isToday = new Date().toDateString() === d.toDateString();
            return (
              <div key={label} className={`cell cell--head ${isToday ? "cell--today" : ""}`}>
                <span className="cell__dow">{label}</span>
                <span className="cell__date">{d.getDate()}</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid--body">
          {DAYS.map((label, i) => {
            const dayDate = weekDates[i];
            const dayEvents = eventsForDay(dayDate);

            return (
              <div key={label} className="cell cell--col" onDoubleClick={() => openAddForDate(dayDate)}>
                {dayEvents.length === 0 ? (
                  <div className="cell__empty">No events</div>
                ) : (
                  <div className="events">
                    {(() => {
                      const conflictIds = getConflictIds(dayEvents);
                      return dayEvents.map((ev) => {
                        const s = new Date(ev.start);
                        const en = new Date(ev.end);
                        const isConflict = conflictIds.has(ev.id);
                        const countdown = ev.countdown ? formatCountdown(ev.start) : null;
                        return (
                          <div
                            key={ev.id}
                            className={`event event--${ev.category}${isConflict ? " event--conflict" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => openEdit(ev)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") openEdit(ev);
                            }}
                          >
                            <div className="event__title">
                              {isConflict && <span className="event__conflict-icon" title="Time conflict">⚠️</span>}
                              {ev.title}
                            </div>
                            <div className="event__meta">
                              {formatTime(s)}–{formatTime(en)}
                              {ev.location ? ` • ${ev.location}` : ""}
                            </div>
                            <div className="event__footer">
                              {countdown && (
                                <span className="event__countdown">{countdown}</span>
                              )}
                              <button
                                className={`event__bell${ev.countdown ? " event__bell--on" : ""}`}
                                title={ev.countdown ? "Remove countdown" : "Add countdown"}
                                onClick={(e) => toggleCountdown(e, ev.id)}
                              >
                                🔔
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <TodoSidebar open={todoOpen} onClose={() => setTodoOpen(false)} />
    </div>
  );
}