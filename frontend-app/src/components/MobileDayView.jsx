import { useMemo, useState, useRef, useEffect } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PX_PER_HOUR = 64;
const PX_PER_MIN = PX_PER_HOUR / 60;
const SWIPE_THRESHOLD = 50;

function minutesFromMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

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

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MobileDayView({
  events,
  setEvents,
  selectedDay,
  onSelectDay,
  onOpenAdd,
  onOpenEdit,
}) {
  const [now, setNow] = useState(() => new Date());
  const scrollRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Scroll to current time when the day changes
  useEffect(() => {
    if (!scrollRef.current) return;
    const mins = isSameDay(selectedDay, now)
      ? now.getHours() * 60 + now.getMinutes()
      : 9 * 60;
    const scrollTo = Math.max(0, mins * PX_PER_MIN - 120);
    scrollRef.current.scrollTop = scrollTo;
  }, [selectedDay]);

  function goToDay(offset) {
    const next = new Date(selectedDay);
    next.setDate(next.getDate() + offset);
    onSelectDay(next);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Ignore mostly-vertical gestures (those are scrolling, not swiping)
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goToDay(dx < 0 ? 1 : -1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  // 7-day pill strip centered on the selected day
  const pillDates = useMemo(() => {
    const base = new Date(selectedDay);
    const arr = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [selectedDay]);

  const rawEvents = events
    .map((ev) => ({ ...ev, startD: new Date(ev.start), endD: new Date(ev.end) }))
    .filter((ev) => isSameDay(ev.startD, selectedDay));
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

  const isToday = isSameDay(selectedDay, now);
  const nowMins = minutesFromMidnight(now);

  function toggleCountdown(e, evId) {
    e.stopPropagation();
    setEvents((prev) =>
      prev.map((ev) => (ev.id === evId ? { ...ev, countdown: !ev.countdown } : ev))
    );
  }

  return (
    <div className="mdv">
      <div className="mdv__strip">
        <button className="mdv__arrow" type="button" onClick={() => goToDay(-1)} aria-label="Previous day">‹</button>
        <div className="mdv__pills">
          {pillDates.map((d) => {
            const active = isSameDay(d, selectedDay);
            const today = isSameDay(d, now);
            return (
              <button
                key={d.toISOString()}
                className={`mdv__pill${active ? " mdv__pill--active" : ""}${today ? " mdv__pill--today" : ""}`}
                type="button"
                onClick={() => onSelectDay(d)}
              >
                <span className="mdv__pill-dow">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                <span className="mdv__pill-date">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
        <button className="mdv__arrow" type="button" onClick={() => goToDay(1)} aria-label="Next day">›</button>
      </div>

      <div
        className="mdv__scroll"
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mdv__body">
          <div className="mdv__gutter">
            {HOURS.map((h) => (
              <div key={h} className="tg__gutter-cell">
                {h !== 0 && <span className="tg__hour-label">{String(h).padStart(2, "0")}:00</span>}
              </div>
            ))}
          </div>

          <div
            className="mdv__col"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top + e.currentTarget.closest(".mdv__scroll").scrollTop;
              const hour = Math.floor(y / PX_PER_HOUR);
              onOpenAdd(selectedDay, Math.min(23, Math.max(0, hour)));
            }}
          >
            {HOURS.map((h) => (
              <div key={h} className="tg__hour-line" style={{ top: h * PX_PER_HOUR }} />
            ))}

            {isToday && (
              <div className="tg__now" style={{ top: nowMins * PX_PER_MIN }}>
                <div className="tg__now-dot" />
                <div className="tg__now-line" />
              </div>
            )}

            {laid.map((ev) => {
              const startMins = minutesFromMidnight(ev.startD);
              const endMins = minutesFromMidnight(ev.endD);
              const duration = Math.max(endMins - startMins, 15);
              const top = startMins * PX_PER_MIN;
              const height = duration * PX_PER_MIN;
              const width = `calc((100% - 4px) / ${ev.totalCols})`;
              const left = `calc(${ev.col} * (100% - 4px) / ${ev.totalCols} + 2px)`;
              const isConflict = conflictIds.has(ev.id);

              return (
                <div
                  key={ev.id}
                  className={`tg__event event--${ev.category}${isConflict ? " event--conflict" : ""}`}
                  style={{ top, height, width, left }}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onOpenEdit(ev); }}
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
                  <button
                    className={`event__bell${ev.countdown ? " event__bell--on" : ""}`}
                    onClick={(e) => toggleCountdown(e, ev.id)}
                  >🔔</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}