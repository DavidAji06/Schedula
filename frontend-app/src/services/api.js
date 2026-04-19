const BASE_URL = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// Auth
export async function registerUser(username, email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "", email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json(); // { access_token, token_type }
}

// Events
export async function fetchEvents() {
  const res = await fetch(`${BASE_URL}/events/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function createEvent(event) {
  const res = await fetch(`${BASE_URL}/events/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

export async function updateEvent(id, event) {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
}

export async function deleteEvent(id) {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete event");
}

export async function deleteSeries(recurringId) {
  const res = await fetch(`${BASE_URL}/events/series/${recurringId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete series");
}

// Tasks
export async function fetchTasks() {
  const res = await fetch(`${BASE_URL}/tasks/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(task) {
  const res = await fetch(`${BASE_URL}/tasks/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(id, task) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete task");
}