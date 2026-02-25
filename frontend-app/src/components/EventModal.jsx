import { useEffect, useState } from "react";
import "./EventModal.css";

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
  });
  const [error, setError] = useState("");

  // Open modal -> populate form with add/edit
  useEffect(() => {
    if (!open) return;

    setError("");

    if (mode === "edit" && eventToEdit) {
      setForm({
        title: eventToEdit.title ?? "",
        category: eventToEdit.category ?? "lecture",
        start: toLocalInputValue(new Date(eventToEdit.start)),
        end: toLocalInputValue(new Date(eventToEdit.end)),
        location: eventToEdit.location ?? "",
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
    const endDate = new Date(form.end);

    if (!form.title.trim()) return setError("Title is required.");
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return setError("Please enter valid start/end.");
    }
    if (endDate <= startDate) return setError("End time must be after start time.");

    // Return a normalized payload (parent decides add vs edit)
    onSave({
      title: form.title.trim(),
      category: form.category,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      location: form.location.trim(),
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

  return (
    <div className="modal" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal__panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{mode === "edit" ? "Edit event" : "Add event"}</h2>
          <button className="modal__close" type="button" onClick={onClose}>
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

          {error && <div className="form__error">{error}</div>}

          <div className="form__actions">
            {mode === "edit" && (
              <button className="btn btn--danger" type="button" onClick={onDelete}>
                Delete
              </button>
            )}

            <button className="btn" type="button" onClick={onClose}>
              Cancel
            </button>

            <button className="btn btn--primary" type="submit">
              {mode === "edit" ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}