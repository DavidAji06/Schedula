import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./MonthlyCalendarGrid.css";
import EventModal from "./EventModal";
import TodoSidebar from "./Todosidebar";

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
  const [todoOpen, setTodoOpen] = useState(false);

  const cells = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
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
    const { _series, _editScope, ...base } = payload;

    if (editingId) {
      if (_editScope === "all" && base.recurringId) {
        setEvents((prev) => prev.map((e) =>
          e.recurringId === base.recurringId
            ? { ...e, title: base.title, category: base.category, location: base.location }
            : e
        ));
      } else {
        setEvents((prev) => prev.map((e) =>
          e.id === editingId ? { ...e, ...base } : e
        ));
      }
    } else if (_series) {
      setEvents((prev) => [
        ...prev,
        ..._series.map((ev) => ({ id: crypto.randomUUID(), ...ev })),
      ]);
    } else {
      setEvents((prev) => [...prev, { id: crypto.randomUUID(), ...base }]);
    }
    closeModal();
  }

  function handleDelete() {
    if (!editingId) return;
    const ev = events.find((e) => e.id === editingId);
    if (ev?.recurringId) {
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
          <button className="month__iconBtn" type="button" onClick={() => setTodoOpen(true)}>
            ✓ Tasks
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
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className={`monthChip monthChip--${ev.category}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEdit(ev)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openEdit(ev)}
                    >
                      <span className="monthChip__time">{new Date(ev.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="monthMore">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {createPortal(
        <TodoSidebar open={todoOpen} onClose={() => setTodoOpen(false)} />,
        document.body
      )}
    </div>
  );
}