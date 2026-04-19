from pydantic import BaseModel

class TaskCreate(BaseModel):
    title: str
    priority: str = "medium"
    due: str | None = None
    done: bool = False

class TaskOut(TaskCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: str | None = None
    priority: str | None = None
    due: str | None = None
    done: bool | None = None