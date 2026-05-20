import os
from sqlalchemy import (
    create_engine, Column, Integer, String,
    Float, Boolean, DateTime, Date, ForeignKey, JSON, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()


# ---------- TASKS ----------
# Matches the dict shape used by env.tasks in baselines.py / task_env.py.
# Plus the fields the web app and weekly report need.

class Task(Base):
    __tablename__ = "tasks"
    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String, nullable=False)
    category      = Column(String, default="admin")          # admin/deep_work/creative/etc
    priority      = Column(Integer, default=2)               # 1=low 2=medium 3=high
    effort        = Column(Integer, default=2)               # Pomodoro slots
    deadline      = Column(Date, nullable=True)              # absolute date; convert to days at state-build time
    status        = Column(String, default="pending")        # pending / in_progress / done / cancelled
    created_at    = Column(DateTime, default=datetime.utcnow)
    completed_at  = Column(DateTime, nullable=True)          # for on-time rate
    actual_effort = Column(Integer, nullable=True)           # pomodoros actually used


# ---------- TRACKING (Chrome extension stream) ----------

class TimeLog(Base):
    __tablename__ = "timelogs"
    id               = Column(Integer, primary_key=True, index=True)
    hostname         = Column(String)
    duration_seconds = Column(Integer)
    category         = Column(String)                        # productive / distracting / neutral
    start_timestamp  = Column(Float)                         # unix epoch from the extension
    logged_at        = Column(DateTime, default=datetime.utcnow)


# ---------- ENERGY ----------

class EnergyLog(Base):
    __tablename__ = "energylogs"
    id           = Column(Integer, primary_key=True, index=True)
    energy_level = Column(Integer)                           # 1..5
    logged_at    = Column(DateTime, default=datetime.utcnow)


# ---------- FOCUS SESSIONS ----------

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id            = Column(Integer, primary_key=True, index=True)
    task_id       = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    started_at    = Column(DateTime, default=datetime.utcnow)
    ended_at      = Column(DateTime, nullable=True)
    duration_sec  = Column(Integer, nullable=True)
    was_completed = Column(Boolean, default=False)
    interruptions = Column(Integer, default=0)

    task = relationship("Task")


# ---------- DECISIONS ----------

class Decision(Base):
    __tablename__ = "decisions"
    id            = Column(Integer, primary_key=True, index=True)
    strategy      = Column(String, nullable=False)           # rl_dqn / deadline_only / priority_only
    action_index  = Column(Integer, nullable=False)          # 0..8 (8 = break)
    task_id       = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    state_vector  = Column(JSON)
    q_values      = Column(JSON, nullable=True)
    was_accepted  = Column(Boolean, nullable=True)
    reward        = Column(Float, nullable=True)
    reward_parts  = Column(JSON, nullable=True)
    decided_at    = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task")


Index("ix_decisions_strategy_time", Decision.strategy, Decision.decided_at)


# ---------- ENGINE / SESSION (must come AFTER models so create_all sees them) ----------

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Create a .env file.")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)


def get_db():
    """FastAPI dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()