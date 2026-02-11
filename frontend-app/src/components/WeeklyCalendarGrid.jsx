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

export default function WeeklyCalendarGrid() {
  const weekDates = getWeekDates(new Date());

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

        <button className="week__btn" type="button">
          + Add event
        </button>
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
          {DAYS.map((label) => (
            <div key={label} className="cell cell--col">
              <div className="cell__empty">Drop events here</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
