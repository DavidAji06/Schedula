import { useMemo, useState, useEffect } from "react";
import "./MonthlyCalendarGrid.css";
import EventModal from "./EventModal";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}
function buildMonthGrid(currentMonth) {
  const first = startOfMonth(currentMonth);
  const last = endOfMonth(currentMonth);
  const firstPad = mondayIndex(first.getDay());
  const totalDays = last.getDate();

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstPad + 1;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
    const inMonth = dayNum >= 1 && dayNum <= totalDays;
    cells.push({ date, inMonth });
  }
  return cells;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function MonthlyCalendarGrid({ theme, onToggleTheme, view, onToggleView, events, setEvents }) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const cells = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const eventToEdit = editingId ? events.find((e) => e.id === editingId) : null;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  function getConflictIds(dayEvents) {
    const ids = new Set();
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const a = dayEvents[i], b = dayEvents[j];
        if (new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end)) {
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
    if (diffMs < 0) return null;
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 60) return `in ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `in ${diffHours}h`;
    return `in ${Math.floor(diffHours / 24)}d`;
  }

  function prevMonth() {
    setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function eventsOnDay(dayDate) {
    return events
      .map((ev) => ({ ...ev, startD: new Date(ev.start) }))
      .filter((ev) => isSameDay(ev.startD, dayDate));
  }

  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div className="month">
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

      <header className="month__topbar">
        <div>
          <h1 className="month__title">Monthly Timetable</h1>
          <p className="month__subtitle">{monthLabel}</p>
        </div>

        <div className="month__actions">
          <button className="month__iconBtn" type="button" onClick={onToggleTheme}>
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>

          <button className="month__iconBtn" type="button" onClick={onToggleView}>
            📆 Week
          </button>
          <button
            className="month__btn"
            type="button"
            onClick={() => openAddForDate(new Date())}
          >
            + Add event
          </button>
        </div>
      </header>

      <section className="month__card">
        <div className="month__nav">
          <button className="month__iconBtn" type="button" onClick={prevMonth}>←</button>
          <div className="month__navLabel">{monthLabel}</div>
          <button className="month__iconBtn" type="button" onClick={nextMonth}>→</button>
        </div>

        <div className="monthGrid monthGrid--head">
          {DOW.map((d) => (
            <div key={d} className="monthCell monthCell--head">{d}</div>
          ))}
        </div>

        <div className="monthGrid monthGrid--body">
          {cells.map(({ date, inMonth }, idx) => {
            const dayEvents = eventsOnDay(date);
            const isToday = isSameDay(date, today);

            return (
              <div
                key={idx}
                className={[
                  "monthCell",
                  "monthCell--day",
                  inMonth ? "" : "monthCell--dim",
                  isToday ? "monthCell--today" : "",
                ].join(" ")}
                onDoubleClick={() => openAddForDate(date)}
              >
                <div className="monthCell__num">{date.getDate()}</div>

                <div className="monthCell__events">
                  {(() => {
                    const conflictIds = getConflictIds(dayEvents);
                    return (
                      <>
                        {dayEvents.slice(0, 3).map((ev) => {
                          const isConflict = conflictIds.has(ev.id);
                          const countdown = ev.countdown ? formatCountdown(ev.start) : null;
                          return (
                            <div
                              key={ev.id}
                              className={`monthChip monthChip--${ev.category}${isConflict ? " monthChip--conflict" : ""}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => openEdit(ev)}
                              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openEdit(ev)}
                            >
                              <span className="monthChip__title">
                                {isConflict && <span className="monthChip__warn">⚠️</span>}
                                {ev.title}
                              </span>
                              <span className="monthChip__right">
                                {countdown && <span className="monthChip__countdown">{countdown}</span>}
                                <button
                                  className={`monthChip__bell${ev.countdown ? " monthChip__bell--on" : ""}`}
                                  title={ev.countdown ? "Remove countdown" : "Add countdown"}
                                  onClick={(e) => toggleCountdown(e, ev.id)}
                                >🔔</button>
                              </span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && <div className="monthMore">+{dayEvents.length - 3} more</div>}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}