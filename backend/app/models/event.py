from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, default="personal")
    start = Column(String, nullable=False)
    end = Column(String, nullable=False)
    location = Column(String, default="")
    repeat = Column(String, default="none")
    repeat_until = Column(String, default="")
    recurring_id = Column(String, default=None, nullable=True)
    countdown = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="events")