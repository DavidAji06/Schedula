from pydantic import BaseModel

class EventCreate(BaseModel):
    title: str
    category: str = "personal"
    start: str
    end: str
    location: str = ""
    repeat: str = "none"
    repeat_until: str = ""
    recurring_id: str | None = None
    countdown: bool = False

class EventOut(EventCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class EventUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    start: str | None = None
    end: str | None = None
    location: str | None = None
    repeat: str | None = None
    repeat_until: str | None = None
    countdown: bool | None = None