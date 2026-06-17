import { useEffect, useState, useRef } from "react";
import "../styles/components/eventModal.css";
import { parseEventWithAI } from "../services/api";

function toLocalInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EXAMPLES = [
  "Gym every Tuesday and Thursday at 6pm for 1 hour",
  "COMP16412 lecture Monday 10am–12pm weekly",
  "Dentist appointment next Friday at 2:30pm",
];

export default function EventModal({
  open,
  mode,
  initialStart,
  initialEnd,
  eventToEdit,
  onClose,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState({
    title: "",
    category: "lecture",
    start: "",
    end: "",
    location: "",
    repeat: "none",
    repeatUntil: "",
  });
  const [error, setError] = useState("");
  const [editScope, setEditScope] = useState(null);

  // AI parse state
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState(false);
  const aiInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setError("");
    setEditScope(null);
    setAiText("");
    setAiError("");
    setAiSuccess(false);

    if (mode === "edit" && eventToEdit) {
      setForm({
        title: eventToEdit.title ?? "",
        category: eventToEdit.category ?? "lecture",
        start: toLocalInputValue(new Date(eventToEdit.start)),
        end: toLocalInputValue(new Date(eventToEdit.end)),
        location: eventToEdit.location ?? "",
        repeat: eventToEdit.repeat ?? "none",
        repeatUntil: eventToEdit.repeatUntil ?? "",
      });
      return;
    }

    const s = initialStart ?? new Date();
    const e = initialEnd ?? new Date(s.getTime() + 60 * 60 * 1000);
    setForm({
      title: "",
      category: "lecture",
      start: toLocalInputValue(s),
      end: toLocalInputValue(e),
      location: "",
      repeat: "none",
      repeatUntil: "",
    });
  }, [open, mode, eventToEdit, initialStart, initialEnd]);

  async function handleAIParse() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiSuccess(false);

    try {
      const parsed = await parseEventWithAI(aiText.trim());

      setForm({
        title: parsed.title ?? "",
        category: parsed.category ?? "personal",
        start: parsed.start ? toLocalInputValue(new Date(parsed.start)) : form.start,
        end: parsed.end ? toLocalInputValue(new Date(parsed.end)) : form.end,
        location: parsed.location ?? "",
        repeat: parsed.repeat ?? "none",
        repeatUntil: parsed.repeat_until ?? "",
      });
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 2500);
    } catch {
      setAiError("Couldn't parse that — try rephrasing.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleAIKeyDown(e) {
    if (e.key === "Enter") handleAIParse();
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
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
      return setError("Please enter valid start/end.");
    if (endDate <= startDate) return setError("End time must be after start time.");

    const durationMs = endDate - startDate;
    const recurringId =
      mode === "edit" && eventToEdit?.recurringId
        ? eventToEdit.recurringId
        : crypto.randomUUID();

    const base = {
      title: form.title.trim(),
      category: form.category,
      location: form.location.trim(),
      repeat: form.repeat,
      repeatUntil: form.repeat !== "none" ? form.repeatUntil : "",
    };

    function buildSeries(anchorStart) {
      if (form.repeat === "none") {
        return [{ ...base, start: anchorStart.toISOString(), end: new Date(anchorStart.getTime() + durationMs).toISOString(), recurringId: null }];
      }
      const until = form.repeatUntil
        ? new Date(form.repeatUntil)
        : (() => { const d = new Date(anchorStart); d.setMonth(d.getMonth() + 3); return d; })();

      const events = [];
      let cursor = new Date(anchorStart);
      while (cursor <= until) {
        events.push({ ...base, start: cursor.toISOString(), end: new Date(cursor.getTime() + durationMs).toISOString(), recurringId });
        const next = new Date(cursor);
        if (form.repeat === "daily") next.setDate(next.getDate() + 1);
        else if (form.repeat === "weekly") next.setDate(next.getDate() + 7);
        else if (form.repeat === "monthly") next.setMonth(next.getMonth() + 1);
        cursor = next;
      }
      return events;
    }

    const isRecurringEdit = mode === "edit" && eventToEdit?.recurringId;
    if (isRecurringEdit && editScope === null) { setEditScope("ask"); return; }

    onSave({
      ...base,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      recurringId: form.repeat !== "none" ? recurringId : null,
      _series: form.repeat !== "none" && mode === "add" ? buildSeries(startDate) : null,
      _editScope: editScope,
    });
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  if (editScope === "ask") {
    return (
      <div className="modal" role="dialog" aria-modal="true" onMouseDown={onClose}>
        <div className="modal__panel" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal__header">
            <h2 className="modal__title">Edit recurring event</h2>
            <button className="modal__close" type="button" onClick={onClose}>✕</button>
          </div>
          <div className="form">
            <p className="recur__scope-desc">This event repeats. What do you want to edit?</p>
            <div className="recur__scope-btns">
              <button className="btn recur__scope-btn" type="button"
                onClick={() => { setEditScope("this"); setTimeout(() => document.getElementById("recur-submit")?.click(), 0); }}>
                <span className="recur__scope-icon">📅</span>
                <span>This event only</span>
              </button>
              <button className="btn recur__scope-btn" type="button"
                onClick={() => { setEditScope("all"); setTimeout(() => document.getElementById("recur-submit")?.click(), 0); }}>
                <span className="recur__scope-icon">🔁</span>
                <span>All events in series</span>
              </button>
            </div>
            <button className="btn" type="button" onClick={() => setEditScope(null)}>← Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal__panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{mode === "edit" ? "Edit event" : "Add event"}</h2>
          <button className="modal__close" type="button" onClick={onClose}>✕</button>
        </div>

        {/* ── AI Parse Bar (add mode only) ── */}
        {mode === "add" && (
          <div className="ai-bar">
            <div className="ai-bar__label">
              <span className="ai-bar__badge">✦ AI</span>
              <span className="ai-bar__hint">Describe your event in plain English</span>
            </div>
            <div className="ai-bar__row">
              <input
                ref={aiInputRef}
                className="ai-bar__input"
                type="text"
                value={aiText}
                onChange={(e) => { setAiText(e.target.value); setAiError(""); }}
                onKeyDown={handleAIKeyDown}
                placeholder={EXAMPLES[Math.floor(Date.now() / 10000) % EXAMPLES.length]}
                disabled={aiLoading}
              />
              <button
                className={`ai-bar__btn${aiLoading ? " ai-bar__btn--loading" : ""}${aiSuccess ? " ai-bar__btn--success" : ""}`}
                type="button"
                onClick={handleAIParse}
                disabled={aiLoading || !aiText.trim()}
                aria-label="Parse with AI"
              >
                {aiLoading ? (
                  <span className="ai-bar__spinner" />
                ) : aiSuccess ? (
                  "✓"
                ) : (
                  "→"
                )}
              </button>
            </div>
            {aiError && <p className="ai-bar__error">{aiError}</p>}
            {aiSuccess && <p className="ai-bar__success">Fields filled — check and save ↓</p>}
          </div>
        )}

        {/* ── Manual form ── */}
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
              <option value="society">Society</option>
              <option value="personal">Personal</option>
            </select>
          </label>

          <div className="form__row">
            <label className="field">
              <span className="field__label">Start</span>
              <input className="field__input" type="datetime-local" name="start" value={form.start} onChange={handleChange} />
            </label>
            <label className="field">
              <span className="field__label">End</span>
              <input className="field__input" type="datetime-local" name="end" value={form.end} onChange={handleChange} />
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

          <div className="recur__row">
            <label className="field" style={{ flex: 1 }}>
              <span className="field__label">Repeat</span>
              <select className="field__input" name="repeat" value={form.repeat} onChange={handleChange}>
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            {form.repeat !== "none" && (
              <label className="field" style={{ flex: 1 }}>
                <span className="field__label">Repeat until</span>
                <input
                  className="field__input"
                  type="date"
                  name="repeatUntil"
                  value={form.repeatUntil}
                  onChange={handleChange}
                />
              </label>
            )}
          </div>

          {form.repeat !== "none" && (
            <div className="recur__badge">
              🔁 Repeats {form.repeat}{form.repeatUntil
                ? ` until ${new Date(form.repeatUntil).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                : " (3 months)"}
            </div>
          )}

          {error && <div className="form__error">{error}</div>}

          <div className="form__actions">
            {mode === "edit" && (
              <button className="btn btn--danger" type="button" onClick={onDelete}>Delete</button>
            )}
            <button className="btn" type="button" onClick={onClose}>Cancel</button>
            <button id="recur-submit" className="btn btn--primary" type="submit">
              {mode === "edit" ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}