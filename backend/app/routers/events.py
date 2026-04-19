from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.event import Event
from app.schemas.event import EventCreate, EventOut, EventUpdate
from typing import List

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/", response_model=List[EventOut])
def get_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Event).filter(Event.user_id == current_user.id).all()

@router.post("/", response_model=EventOut, status_code=201)
def create_event(event: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_event = Event(**event.model_dump(), user_id=current_user.id)
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, updated: EventUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in updated.model_dump(exclude_unset=True).items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()

@router.delete("/series/{recurring_id}", status_code=204)
def delete_series(recurring_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Event).filter(Event.recurring_id == recurring_id, Event.user_id == current_user.id).delete()
    db.commit()