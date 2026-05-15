from sqlalchemy import (
    create_engine, Column, Integer, String,
    Float, Boolean, DateTime, ForeignKey, JSON, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime

Base = declarative_base()


class Task(Base):
    __tablename__ = "tasks"
    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String, nullable=False)
    category      = Column(String, default="admin")
    priority      = Column(Integer, default=2)        # 1=low 2=medium 3=high
    effort        = Column(Integer, default=2)        # Pomodoro slots needed
    deadline_days = Column(Integer, default=7)
    status        = Column(String, default="pending") # pending / done
    created_at    = Column(DateTime, default=datetime.utcnow)
    completed_at  = Column(DateTime, nullable=True)   # NEW: for on-time rate
    actual_effort = Column(Integer, nullable=True)    # NEW: pomodoros actually used


class TimeLog(Base):
    __tablename__ = "timelogs"
    id               = Column(Integer, primary_key=True, index=True)
    hostname         = Column(String)
    duration_seconds = Column(Integer)
    category         = Column(String)   # productive / distracting / neutral
    start_timestamp  = Column(Float)
    logged_at        = Column(DateTime, default=datetime.utcnow)


class EnergyLog(Base):
    __tablename__ = "energylogs"
    id           = Column(Integer, primary_key=True, index=True)
    energy_level = Column(Integer)   # 1 to 5
    logged_at    = Column(DateTime, default=datetime.utcnow)


# ---------- NEW ----------

class FocusSession(Base):
    """One row per work session on a task. Source of reward signals."""
    __tablename__ = "focus_sessions"
    id            = Column(Integer, primary_key=True, index=True)
    task_id       = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    started_at    = Column(DateTime, default=datetime.utcnow)
    ended_at      = Column(DateTime, nullable=True)
    duration_sec  = Column(Integer, nullable=True)
    was_completed = Column(Boolean, default=False)   # finished a full pomodoro?
    interruptions = Column(Integer, default=0)       # tab switches mid-session

    task = relationship("Task")


class Decision(Base):
    """
    One row per scheduling decision from ANY strategy (RL or baseline).
    This is how you produce the comparison required by the deliverables.
    """
    __tablename__ = "decisions"
    id            = Column(Integer, primary_key=True, index=True)
    strategy      = Column(String, nullable=False)   # rl_dqn / deadline_only / priority_only
    action_index  = Column(Integer, nullable=False)  # 0..8 (8 = take a break)
    task_id       = Column(Integer, ForeignKey("tasks.id"), nullable=True)  # null if break
    state_vector  = Column(JSON)                     # 36-dim input, for replay/explainability
    q_values      = Column(JSON, nullable=True)      # 9 Q-values (rl_dqn only)
    was_accepted  = Column(Boolean, nullable=True)   # did the user actually start it?
    reward        = Column(Float, nullable=True)     # filled in after the next step
    reward_parts  = Column(JSON, nullable=True)      # {task_value, overdue_penalty, focus_bonus, switch_penalty}
    decided_at    = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task")


# index for the comparison query: "avg reward per strategy in the last 7 days"
Index("ix_decisions_strategy_time", Decision.strategy, Decision.decided_at)


# Creates tasks.db file automatically on first run
engine = create_engine(
    "sqlite:///tasks.db",
    connect_args={"check_same_thread": False}
)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)


def get_db():
    """Provides a database session for each API request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()