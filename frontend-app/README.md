# Schedula

A full-stack AI-powered timetable app built for students. Schedule lectures, track deadlines, manage your week — with natural language event creation powered by Google Gemini.

**Live:** [schedula-xi.vercel.app](https://schedula-xi.vercel.app)

---

## Features

- **AI event creation** — describe an event in plain English ("Gym every Tuesday at 6pm for 1 hour") etc and Gemini parses it into a structured event automatically
- **Weekly & monthly views** — a precise time-grid week view and a full monthly overview
- **Recurring events** — set daily, weekly, or monthly repeating events with an optional end date; edit one or the whole series
- **Conflict detection** — overlapping events are flagged with a visual warning in real time
- **Integrated to-do list** — a slide-out task panel with priority levels (high/medium/low) and due dates
- **Colour-coded categories** — lectures, assignments, societies, and personal events each with distinct colours
- **Countdown timers** — toggle a countdown on any upcoming event
- **Mobile responsive** — single-day swipeable view on mobile with a date-strip, swipe gestures, floating add button, and hamburger navigation
- **JWT authentication** — secure sign-up, sign-in, and session management
- **Dark & light themes**

---

## Tech Stack

**Frontend**
- React + Vite
- React Router
- CSS custom properties (design tokens), DM Sans, glassmorphic UI

**Backend**
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL via Supabase
- JWT authentication (python-jose, passlib/bcrypt)
- Google Gemini API (natural language event parsing)
- httpx for async HTTP

**Deployment**
- Frontend → Vercel
- Backend → Render

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Supabase PostgreSQL database
- A Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
DATABASE_URL=postgresql://...
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
GEMINI_API_KEY=your_gemini_key
```

Start the server:

```bash
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend-app
npm install
npm run dev
```

Create a `.env` file in `frontend-app/`:

```
VITE_API_URL=http://127.0.0.1:8000
```

---

## Project Structure

```
Schedula/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy models (User, Event, Task)
│   │   ├── routers/       # FastAPI routers (auth, events, tasks, ai)
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── auth.py        # JWT logic
│   │   ├── database.py    # DB connection
│   │   └── main.py        # App entry point
│   └── requirements.txt
└── frontend-app/
    └── src/
        ├── components/    # EventModal, WeeklyCalendarGrid, MonthlyCalendarGrid, TodoSidebar, MobileDayView
        ├── hooks/         # useIsMobile
        ├── pages/         # Landing, Auth
        ├── services/      # api.js
        └── styles/        # CSS per component + mobile.css
```

---

## Author

David Ajidagba — [LinkedIn](https://www.linkedin.com/in/david-ajidagba/) · [GitHub](https://github.com/DavidAji06)