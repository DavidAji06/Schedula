from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, events, tasks, ai

app = FastAPI(title="Schedula API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://schedula-xi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(tasks.router)
app.include_router(ai.router)

@app.get("/")
def root():
    return {"message": "Schedula API is running"}