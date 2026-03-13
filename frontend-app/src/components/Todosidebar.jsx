import { useState, useEffect, useRef } from "react";
import "./Todosidebar.css";

const PRIORITIES = ["high", "medium", "low"];

function formatDue(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86_400_000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Due today", overdue: false };
  if (diff === 1) return { label: "Due tomorrow", overdue: false };
  return { label: `Due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`, overdue: false };
}

export default function TodoSidebar({ open, onClose }) {
  const [tasks, setTasks]     = useState([]);
  const [filter, setFilter]   = useState("all"); // all | active | done
  const [title, setTitle]     = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const inputRef = useRef(null);

  // Focus input when sidebar opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 360);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  function addTask() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      {
        id: crypto.randomUUID(),
        title: trimmed,
        priority,
        due: dueDate || null,
        done: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setTitle("");
    setDueDate("");
    setPriority("medium");
  }

  function toggleDone(id) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTasks((prev) => prev.filter((t) => !t.done));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") addTask();
  }

  const filtered = tasks.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done")   return t.done;
    return true;
  });

  // Sort: undone first, then by priority, then by due date
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    if (a.due && b.due) return new Date(a.due) - new Date(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });

  const doneCount   = tasks.filter((t) => t.done).length;
  const activeCount = tasks.filter((t) => !t.done).length;

  return (
    <>
      {/* Tab toggle button */}
      <button
        className="todo-toggle"
        onClick={open ? onClose : () => {}}
        aria-label="Toggle to-do list"
        style={{ display: open ? "none" : undefined }}
      >
        {activeCount > 0 && (
          <span className="todo-toggle__badge">{activeCount}</span>
        )}
        <span style={{ fontSize: 16 }}>✓</span>
        <span className="todo-toggle__label">Tasks</span>
      </button>

      {/* Overlay */}
      <div
        className={`todo-overlay${open ? " todo-overlay--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`todo-sidebar${open ? " todo-sidebar--open" : ""}`}
        role="complementary"
        aria-label="To-do list"
      >
        {/* Header */}
        <div className="todo-header">
          <div className="todo-header__left">
            <span className="todo-header__title">To-Do List</span>
            <span className="todo-header__sub">
              {activeCount} remaining · {doneCount} done
            </span>
          </div>
          <button className="todo-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Filter tabs */}
        <div className="todo-filters">
          {["all", "active", "done"].map((f) => (
            <button
              key={f}
              className={`todo-filter${filter === f ? " todo-filter--active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "all"    && tasks.length > 0    && ` (${tasks.length})`}
              {f === "active" && activeCount > 0     && ` (${activeCount})`}
              {f === "done"   && doneCount > 0       && ` (${doneCount})`}
            </button>
          ))}
        </div>

        {/* Add task */}
        <div className="todo-add">
          <div className="todo-add__row">
            <input
              ref={inputRef}
              className="todo-add__input"
              placeholder="Add a task…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={120}
            />
            <button
              className="todo-add__btn"
              onClick={addTask}
              aria-label="Add task"
              disabled={!title.trim()}
            >
              +
            </button>
          </div>
          <div className="todo-add__meta">
            <select
              className="todo-add__select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="high">🔴 High priority</option>
              <option value="medium">🟡 Medium priority</option>
              <option value="low">🟢 Low priority</option>
            </select>
            <input
              className="todo-add__date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              title="Due date"
            />
          </div>
        </div>

        {/* Task list */}
        <div className="todo-list">
          {sorted.length === 0 ? (
            <div className="todo-empty">
              <span className="todo-empty__icon">
                {filter === "done" ? "🎉" : "📋"}
              </span>
              <span className="todo-empty__text">
                {filter === "done"
                  ? "Nothing completed yet"
                  : filter === "active"
                  ? "All caught up!"
                  : "No tasks yet"}
              </span>
              <span className="todo-empty__sub">
                {filter === "all" && "Type above and press Enter to add one"}
              </span>
            </div>
          ) : (
            sorted.map((task) => {
              const due = formatDue(task.due);
              return (
                <div
                  key={task.id}
                  className={[
                    "todo-item",
                    `todo-item--${task.priority}`,
                    task.done ? "todo-item--done" : "",
                  ].join(" ")}
                >
                  {/* Checkbox */}
                  <button
                    className={`todo-check${task.done ? " todo-check--checked" : ""}`}
                    onClick={() => toggleDone(task.id)}
                    aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                  >
                    {task.done && "✓"}
                  </button>

                  {/* Body */}
                  <div className="todo-item__body">
                    <div className="todo-item__title">{task.title}</div>
                    <div className="todo-item__meta">
                      <span className={`todo-priority todo-priority--${task.priority}`}>
                        {task.priority}
                      </span>
                      {due && (
                        <span className={`todo-due${due.overdue ? " todo-due--overdue" : ""}`}>
                          {due.overdue ? "⚠ " : "📅 "}{due.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    className="todo-delete"
                    onClick={() => deleteTask(task.id)}
                    aria-label="Delete task"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="todo-footer">
            <span className="todo-footer__stat">
              {activeCount} task{activeCount !== 1 ? "s" : ""} left
            </span>
            {doneCount > 0 && (
              <button className="todo-footer__clear" onClick={clearCompleted}>
                Clear completed
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}