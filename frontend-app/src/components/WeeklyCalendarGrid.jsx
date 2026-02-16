import { useMemo, useState } from "react";
import "./WeeklyCalendarGrid.css";

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

function toLocalInputValue(d) {
  // yyyy-MM-ddTHH:mm (for <input type="datetime-local">)
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function WeeklyCalendarGrid({ theme, onToggleTheme }) {
  const weekDates = useMemo(() => getWeekDates(new Date()), []);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local events for MVP
  const [events, setEvents] = useState([]);

  // Form state
  const defaultStart = new Date(weekDates[0]);
  defaultStart.setHours(9, 0, 0, 0);
  const defaultEnd = new Date(weekDates[0]);
  defaultEnd.setHours(10, 0, 0, 0);

  const [form, setForm] = useState({
    title: "",
    category: "lecture",
    start: toLocalInputValue(defaultStart),
    end: toLocalInputValue(defaultEnd),
    location: "",
  });

  const [error, setError] = useState("");

  function openModal() {
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const startDate = new Date(form.start);
    const endDate = new Date(form.end);

    if (!form.title.trim()) return setError("Title is required.");
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return setError("Enter valid start and end times.");
    }
    if (endDate <= startDate) return setError("End time must be after start time.");

    const newEvent = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      category: form.category,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      location: form.location.trim(),
    };

    setEvents((prev) => [...prev, newEvent]);
    closeModal();

    // Reset form for next time (keep same times)
    setForm((f) => ({ ...f, title: "", location: "" }));
  }

  function eventsForDay(dayDate) {
    return events
      .map((ev) => ({
        ...ev,
        startD: new Date(ev.start),
        endD: new Date(ev.end),
      }))
      .filter((ev) => isSameDay(ev.startD, dayDate))
      .sort((a, b) => a.startD - b.startD);
  }

  function formatTime(d) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="week">
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

          <button className="week__btn" type="button" onClick={openModal}>
            + Add event
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
              <div key={label} className="cell cell--col">
                {dayEvents.length === 0 ? (
                  <div className="cell__empty">No events</div>
                ) : (
                  <div className="events">
                    {dayEvents.map((ev) => {
                      const s = new Date(ev.start);
                      const en = new Date(ev.end);
                      return (
                        <div key={ev.id} className={`event event--${ev.category}`}>
                          <div className="event__title">{ev.title}</div>
                          <div className="event__meta">
                            {formatTime(s)}–{formatTime(en)}
                            {ev.location ? ` • ${ev.location}` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal" role="dialog" aria-modal="true" onMouseDown={closeModal}>
          <div className="modal__panel" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Add event</h2>
              <button className="modal__close" type="button" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <label className="field">
                <span className="field__label">Title</span>
                <input
                  className="field__input"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. COMP11120 Lecture"
                />
              </label>

              <label className="field">
                <span className="field__label">Category</span>
                <select className="field__input" name="category" value={form.category} onChange={handleChange}>
                  <option value="lecture">Lecture</option>
                  <option value="assignment">Assignment</option>
                  <option value="social">Social</option>
                  <option value="personal">Personal</option>
                </select>
              </label>

              <div className="form__row">
                <label className="field">
                  <span className="field__label">Start</span>
                  <input
                    className="field__input"
                    type="datetime-local"
                    name="start"
                    value={form.start}
                    onChange={handleChange}
                  />
                </label>

                <label className="field">
                  <span className="field__label">End</span>
                  <input
                    className="field__input"
                    type="datetime-local"
                    name="end"
                    value={form.end}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field__label">Location (optional)</span>
                <input
                  className="field__input"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Kilburn LT1"
                />
              </label>

              {error && <div className="form__error">{error}</div>}

              <div className="form__actions">
                <button className="week__iconBtn" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="week__btn" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
