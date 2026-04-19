import { useEffect, useState } from "react";
import "../styles/components/eventModal.css";

/**
 * Reusable Add/Edit Event modal.
 *
 * Props:
 * - open: boolean
 * - mode: "add" | "edit"
 * - initialStart: Date (used only when opening in "add")
 * - initialEnd: Date (used only when opening in "add")
 * - eventToEdit: existing event object (used only when mode="edit")
 * - onClose: () => void
 * - onSave: (eventPayload) => void
 * - onDelete: () => void   (only used in edit mode)
 */
function toLocalInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const [editScope, setEditScope] = useState(null); // null | "this" | "all"

  // Open modal -> populate form with add/edit
  useEffect(() => {
    if (!open) return;

    setError("");
    setEditScope(null);

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

    // mode === "add"
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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const startDate = new Date(form.start);
    const endDate   = new Date(form.end);

    if (!form.title.trim()) return setError("Title is required.");
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
      return setError("Please enter valid start/end.");
    if (endDate <= startDate) return setError("End time must be after start time.");

    const durationMs = endDate - startDate;
    const recurringId = (mode === "edit" && eventToEdit?.recurringId)
      ? eventToEdit.recurringId
      : crypto.randomUUID();

    const base = {
      title:       form.title.trim(),
      category:    form.category,
      location:    form.location.trim(),
      repeat:      form.repeat,
      repeatUntil: form.repeat !== "none" ? form.repeatUntil : "",
    };

    // Generate all occurrences for a new series
    function buildSeries(anchorStart) {
      if (form.repeat === "none") {
        return [{
          ...base,
          start: anchorStart.toISOString(),
          end:   new Date(anchorStart.getTime() + durationMs).toISOString(),
          recurringId: null,
        }];
      }

      const until = form.repeatUntil
        ? new Date(form.repeatUntil)
        : (() => { const d = new Date(anchorStart); d.setMonth(d.getMonth() + 3); return d; })();

      const events = [];
      let cursor = new Date(anchorStart);

      while (cursor <= until) {
        events.push({
          ...base,
          start: cursor.toISOString(),
          end:   new Date(cursor.getTime() + durationMs).toISOString(),
          recurringId,
        });

        const next = new Date(cursor);
        if (form.repeat === "daily")        next.setDate(next.getDate() + 1);
        else if (form.repeat === "weekly")  next.setDate(next.getDate() + 7);
        else if (form.repeat === "monthly") next.setMonth(next.getMonth() + 1);
        cursor = next;
      }

      return events;
    }

    const isRecurringEdit = mode === "edit" && eventToEdit?.recurringId;

    // Editing a recurring event — ask scope first
    if (isRecurringEdit && editScope === null) {
      setEditScope("ask");
      return;
    }

    onSave({
      ...base,
      start:       startDate.toISOString(),
      end:         endDate.toISOString(),
      recurringId: form.repeat !== "none" ? recurringId : null,
      _series:     form.repeat !== "none" && mode === "add" ? buildSeries(startDate) : null,
      _editScope:  editScope,
    });
  }

  // Close with escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Scope picker shown when editing a recurring event
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

          {/* ── Recurring ── */}
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
              🔁 Repeats {form.repeat}{form.repeatUntil ? ` until ${new Date(form.repeatUntil).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : " (3 months)"}
            </div>
          )}

          {error && <div className="form__error">{error}</div>}

          <div className="form__actions">
            {mode === "edit" && (
              <button className="btn btn--danger" type="button" onClick={onDelete}>
                Delete
              </button>
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