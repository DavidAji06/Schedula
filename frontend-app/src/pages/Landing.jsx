import "../styles/pages/landing.css";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  function goToApp() {
    navigate("/app");
  }

  return (
    <div className="landing">

      {/* ── Nav ── */}
      <nav className="ln__nav">
        <span className="ln__logo">Schedul<em>a</em></span>
        <div className="ln__nav-links">
          <a href="#features">Features</a>
          <a href="#" className="ln__nav-signin">Sign in</a>
          <button className="ln__btn-primary" onClick={goToApp}>Start without saving</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="ln__hero">
        <div className="ln__hero-content">
          <p className="ln__eyebrow">Built for students</p>
          <h1 className="ln__headline">
            Your timetable,<br /><em>the way it should be.</em>
          </h1>
          <p className="ln__sub">
            Schedule lectures, track deadlines, manage your week — all in one clean, focused place.
          </p>
          <div className="ln__hero-actions">
            <button className="ln__btn-primary ln__btn-primary--lg" onClick={() => navigate("/auth")}>
              Sign in to save your timetable
            </button>
            <a href="#features" className="ln__btn-ghost">See features →</a>
          </div>
        </div>

        {/* Minimal calendar illustration */}
        <div className="ln__hero-visual" aria-hidden="true">
          <div className="ln__cal">
            <div className="ln__cal-header">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
                <div key={d} className={`ln__cal-day${i === 2 ? " ln__cal-day--today" : ""}`}>
                  <span className="ln__cal-dow">{d}</span>
                  <span className="ln__cal-date">{23 + i}</span>
                </div>
              ))}
            </div>
            <div className="ln__cal-body">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="ln__cal-hline" style={{ top: i * 56 }} />
              ))}
              <div className="ln__cal-col" style={{ gridColumn: 1 }}>
                <div className="ln__ev ln__ev--lecture" style={{ top: 28, height: 56 }}>COMP101</div>
                <div className="ln__ev ln__ev--personal" style={{ top: 168, height: 56 }}>Study</div>
              </div>
              <div className="ln__cal-col" style={{ gridColumn: 2 }}>
                <div className="ln__ev ln__ev--assignment" style={{ top: 84, height: 84 }}>Essay due</div>
              </div>
              <div className="ln__cal-col" style={{ gridColumn: 3 }}>
                <div className="ln__ev ln__ev--lecture" style={{ top: 0, height: 56 }}>Lecture</div>
                <div className="ln__ev ln__ev--society" style={{ top: 196, height: 56 }}>Society</div>
              </div>
              <div className="ln__cal-col" style={{ gridColumn: 4 }}>
                <div className="ln__ev ln__ev--lecture" style={{ top: 56, height: 112 }}>Lab</div>
              </div>
              <div className="ln__cal-col" style={{ gridColumn: 5 }}>
                <div className="ln__ev ln__ev--personal" style={{ top: 28, height: 56 }}>Gym</div>
                <div className="ln__ev ln__ev--assignment" style={{ top: 140, height: 70 }}>Coursework</div>
              </div>
              <div className="ln__now" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="ln__features" id="features">
        <p className="ln__section-label">Features</p>
        <div className="ln__feat-grid">
          {[
            { icon: "⏱", title: "Time-grid view", body: "Events placed by actual start time and sized by duration." },
            { icon: "🔁", title: "Recurring events", body: "Set a weekly lecture once. It repeats for the whole semester. Edit one or the whole series." },
            { icon: "⚡", title: "Conflict detection", body: "Overlapping events are flagged instantly. No more accidentally double-booking yourself." },
            { icon: "✅", title: "Integrated to-do list", body: "A slide-out task panel with priorities and due dates — right beside your calendar." },
            { icon: "🗓️", title: "Weekly & monthly views", body: "Switch between a detailed weekly time-grid and a monthly overview." },
            { icon: "🎨", title: "Colour-coded categories", body: "Lectures, assignments, societies, personal. Each category with its own colour." },
          ].map((f) => (
            <div className="ln__feat-card" key={f.title}>
              <span className="ln__feat-icon">{f.icon}</span>
              <h3 className="ln__feat-title">{f.title}</h3>
              <p className="ln__feat-body">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      {/* <section className="ln__cta">
        <h2 className="ln__cta-headline">Ready to own your week?</h2>
        <p className="ln__cta-sub">Free for students. No credit card required.</p>
        <button className="ln__btn-primary ln__btn-primary--lg" onClick={goToApp}>
          Create free account
        </button>
      </section> */}

      {/* ── Footer ── */}
      <footer className="ln__footer">
        <span className="ln__logo">Schedul<em>a</em></span>
        <div className="ln__footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">GitHub</a>
        </div>
        <span className="ln__footer-copy">© 2026 Schedula</span>
      </footer>

    </div>
  );
}