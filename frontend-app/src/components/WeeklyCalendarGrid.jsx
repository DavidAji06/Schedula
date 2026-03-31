import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/components/weeklyCalendarGrid.css";
import EventModal from "./EventModal";
import TodoSidebar from "./Todosidebar";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PX_PER_HOUR = 64;
const PX_PER_MIN  = PX_PER_HOUR / 60;

function minutesFromMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

// Assign columns to overlapping events so they sit side-by-side
function layoutEvents(evs) {
  const sorted = [...evs].sort((a, b) => a.startD - b.startD);
  const columns = [];
  const result = [];

  for (const ev of sorted) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const last = columns[col];
      if (last.endD <= ev.startD) {
        columns[col] = ev;
        result.push({ ...ev, col, totalCols: null });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push(ev);
      result.push({ ...ev, col: columns.length - 1, totalCols: null });
    }
  }

  // Second pass: set totalCols for each event based on max overlapping column
  return result.map((ev) => {
    let maxCol = ev.col;
    for (const other of result) {
      if (other.startD < ev.endD && other.endD > ev.startD) {
        maxCol = Math.max(maxCol, other.col);
      }
    }
    return { ...ev, totalCols: maxCol + 1 };
  });
}



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

export default function WeeklyCalendarGrid({ theme, onToggleTheme, view, onToggleView, events, setEvents, username }) {
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    today.setDate(today.getDate() + diff);
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [todoOpen, setTodoOpen] = useState(false);
  const scrollRef = React.useRef(null);
  const navigate = useNavigate();

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const mins = new Date().getHours() * 60 + new Date().getMinutes();
      const scrollTo = Math.max(0, mins * PX_PER_MIN - 120);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  // Tick every minute so countdowns stay fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  function prevWeek() {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  }

  function nextWeek() {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  }

  function goToToday() {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    today.setDate(today.getDate() + diff);
    today.setHours(0, 0, 0, 0);
    setWeekStart(today);
  }

  const isThisWeek = isSameDay(weekDates[0], (() => {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const mon = new Date(today);
    mon.setDate(today.getDate() + diff);
    return mon;
  })());

  const eventToEdit = editingId ? events.find((e) => e.id === editingId) : null;

  function openAddForDate(date, hour = 9) {
    setEditingId(null);
    setSelectedDate({ date, hour });
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
    const { _series, _editScope, ...base } = payload;

    if (editingId) {
      // Editing existing event
      if (_editScope === "all" && base.recurringId) {
        // Update every event in the series
        setEvents((prev) => prev.map((e) =>
          e.recurringId === base.recurringId
            ? { ...e, title: base.title, category: base.category, location: base.location }
            : e
        ));
      } else {
        // Edit just this one
        setEvents((prev) => prev.map((e) =>
          e.id === editingId ? { ...e, ...base } : e
        ));
      }
    } else if (_series) {
      // New recurring series — add all occurrences
      setEvents((prev) => [
        ...prev,
        ..._series.map((ev) => ({ id: crypto.randomUUID(), ...ev })),
      ]);
    } else {
      // Single new event
      setEvents((prev) => [...prev, { id: crypto.randomUUID(), ...base }]);
    }
    closeModal();
  }

  function handleDelete() {
    if (!editingId) return;
    const ev = events.find((e) => e.id === editingId);
    if (ev?.recurringId) {
      // Ask: delete this or all
      const all = window.confirm("Delete all events in this recurring series?\n\nOK = delete all   Cancel = delete only this one");
      if (all) {
        setEvents((prev) => prev.filter((e) => e.recurringId !== ev.recurringId));
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== editingId));
      }
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== editingId));
    }
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

  const initialStart = useMemo(() => {
    const d = new Date(selectedDate.date || selectedDate);
    d.setHours(selectedDate.hour ?? 9, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const initialEnd = useMemo(() => {
    const d = new Date(selectedDate.date || selectedDate);
    d.setHours((selectedDate.hour ?? 9) + 1, 0, 0, 0);
    return d;
  }, [selectedDate]);

  return (
    <div className="week">
      <EventModal
        open={modalOpen}
        mode={editingId ? "edit" : "add"}
        initialStart={initialStart}
        initialEnd={initialEnd}
        eventToEdit={eventToEdit}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <header className="week__topbar">
        <div className="week__topbar__left">
          <div>
            {username && <p className="week__welcome">Welcome {username}</p>}
            <h1 className="week__title">Weekly Timetable</h1>
            <p className="week__subtitle">
              {weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
              {weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="week__nav">
            <button className="week__navBtn" type="button" onClick={prevWeek} aria-label="Previous week">←</button>
            {!isThisWeek && (
              <button className="week__todayBtn" type="button" onClick={goToToday}>Today</button>
            )}
            <button className="week__navBtn" type="button" onClick={nextWeek} aria-label="Next week">→</button>
          </div>
        </div>

        <div className="week__actions">
          <button className="week__iconBtn" type="button" onClick={() => navigate("/")}>
            ← Home
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

      <TodoSidebar open={todoOpen} onClose={() => setTodoOpen(false)} />

      <section className="week__card">
        {/* ── Day header row ── */}
        <div className="tg__header">
          <div className="tg__gutter-corner" />
          {DAYS.map((label, i) => {
            const d = weekDates[i];
            const isToday = isSameDay(d, new Date());
            return (
              <div key={label} className={`tg__head-cell${isToday ? " tg__head-cell--today" : ""}`}>
                <span className="tg__dow">{label}</span>
                <span className={`tg__date${isToday ? " tg__date--today" : ""}`}>{d.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* ── Scrollable time grid ── */}
        <div className="tg__scroll" ref={scrollRef}>
          <div className="tg__body">

            {/* Hour gutter */}
            <div className="tg__gutter">
              {HOURS.map((h) => (
                <div key={h} className="tg__gutter-cell">
                  {h !== 0 && (
                    <span className="tg__hour-label">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((label, i) => {
              const dayDate = weekDates[i];
              const isToday = isSameDay(dayDate, new Date());
              const rawEvents = events
                .map((ev) => ({ ...ev, startD: new Date(ev.start), endD: new Date(ev.end) }))
                .filter((ev) => isSameDay(ev.startD, dayDate));
              const laid = layoutEvents(rawEvents);
              const conflictIds = (() => {
                const ids = new Set();
                for (let a = 0; a < laid.length; a++)
                  for (let b = a + 1; b < laid.length; b++)
                    if (laid[a].startD < laid[b].endD && laid[b].startD < laid[a].endD) {
                      ids.add(laid[a].id); ids.add(laid[b].id);
                    }
                return ids;
              })();

              // Now indicator
              const nowMins = minutesFromMidnight(now);

              return (
                <div
                  key={label}
                  className={`tg__col${isToday ? " tg__col--today" : ""}`}
                  onClick={(e) => {
                    // Calculate hour from click position
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top + e.currentTarget.closest(".tg__scroll").scrollTop;
                    const hour = Math.floor(y / PX_PER_HOUR);
                    openAddForDate(dayDate, Math.min(23, Math.max(0, hour)));
                  }}
                >
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div key={h} className="tg__hour-line" style={{ top: h * PX_PER_HOUR }} />
                  ))}

                  {/* Now indicator */}
                  {isToday && (
                    <div className="tg__now" style={{ top: nowMins * PX_PER_MIN }}>
                      <div className="tg__now-dot" />
                      <div className="tg__now-line" />
                    </div>
                  )}

                  {/* Events */}
                  {laid.map((ev) => {
                    const startMins = minutesFromMidnight(ev.startD);
                    const endMins   = minutesFromMidnight(ev.endD);
                    const duration  = Math.max(endMins - startMins, 15);
                    const top       = startMins * PX_PER_MIN;
                    const height    = duration * PX_PER_MIN;
                    const width     = `calc((100% - 4px) / ${ev.totalCols})`;
                    const left      = `calc(${ev.col} * (100% - 4px) / ${ev.totalCols} + 2px)`;
                    const isConflict = conflictIds.has(ev.id);
                    const countdown  = ev.countdown ? formatCountdown(ev.start) : null;

                    return (
                      <div
                        key={ev.id}
                        className={`tg__event event--${ev.category}${isConflict ? " event--conflict" : ""}`}
                        style={{ top, height, width, left }}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openEdit(ev); }}
                      >
                        <div className="tg__event-title">
                          {isConflict && <span className="event__conflict-icon">⚠️</span>}
                          {ev.recurringId && <span className="event__recur-icon">🔁</span>}
                          {ev.title}
                        </div>
                        {height >= 36 && (
                          <div className="tg__event-time">
                            {formatTime(ev.startD)}–{formatTime(ev.endD)}
                            {ev.location ? ` · ${ev.location}` : ""}
                          </div>
                        )}
                        {height >= 56 && countdown && (
                          <span className="event__countdown">{countdown}</span>
                        )}
                        <button
                          className={`event__bell${ev.countdown ? " event__bell--on" : ""}`}
                          onClick={(e) => toggleCountdown(e, ev.id)}
                          title={ev.countdown ? "Remove countdown" : "Add countdown"}
                        >🔔</button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}