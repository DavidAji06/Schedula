import { useMemo, useState } from "react";
import "./MonthlyCalendarGrid.css";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// Monday-based week: Mon=0..Sun=6
function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}

function buildMonthGrid(currentMonth) {
  const first = startOfMonth(currentMonth);
  const last = endOfMonth(currentMonth);

  const firstPad = mondayIndex(first.getDay());
  const totalDays = last.getDate();

  // 42 cells (6 rows x 7 cols) is standard
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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MonthlyCalendarGrid({
  theme,
  onToggleTheme,
  view,
  onToggleView,
  events,
}) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  const cells = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);

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
              >
                <div className="monthCell__num">{date.getDate()}</div>

                <div className="monthCell__events">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div key={ev.id} className={`monthChip monthChip--${ev.category}`}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="monthMore">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
