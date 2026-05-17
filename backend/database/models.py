from sqlalchemy import (
    create_engine, Column, Integer, String,
    Float, Boolean, DateTime, ForeignKey, JSON, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime

Base = declarative_base()


# ---------- TASKS ----------
# Matches the dict shape used by env.tasks in baselines.py / task_env.py:
#   {"deadline_days": int, "priority": int, ...}
# Plus the fields the web app and weekly report need.

class Task(Base):
    __tablename__ = "tasks"
    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String, nullable=False)
    category      = Column(String, default="admin")          # admin/deep_work/creative/etc
    priority      = Column(Integer, default=2)               # 1=low 2=medium 3=high
    effort        = Column(Integer, default=2)               # Pomodoro slots
    deadline_days = Column(Integer, default=7)               # days until deadline
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
# Real-world version of what env simulates per slot.
# Feeds the focus_session_bonus and context_switch_penalty reward terms.

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id            = Column(Integer, primary_key=True, index=True)
    task_id       = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    started_at    = Column(DateTime, default=datetime.utcnow)
    ended_at      = Column(DateTime, nullable=True)
    duration_sec  = Column(Integer, nullable=True)
    was_completed = Column(Boolean, default=False)           # finished the full slot?
    interruptions = Column(Integer, default=0)               # tab switches mid-session

    task = relationship("Task")


# ---------- DECISIONS ----------
# One row per call to act() — from RL agent OR baselines.
# Single table + strategy column = comparison is a GROUP BY query.

class Decision(Base):
    __tablename__ = "decisions"
    id            = Column(Integer, primary_key=True, index=True)
    strategy      = Column(String, nullable=False)           # rl_dqn / deadline_only / priority_only
    action_index  = Column(Integer, nullable=False)          # 0..8 (8 = break)
    task_id       = Column(Integer, ForeignKey("tasks.id"), nullable=True)  # NULL if break
    state_vector  = Column(JSON)                             # the 36-dim numpy array as list
    q_values      = Column(JSON, nullable=True)              # 9 Q-values (rl_dqn only)
    was_accepted  = Column(Boolean, nullable=True)           # user clicked start vs dismissed
    reward        = Column(Float, nullable=True)             # filled when session ends
    reward_parts  = Column(JSON, nullable=True)              # explainability breakdown
    decided_at    = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task")


# Index for the comparison query: avg reward by strategy in the last N days
Index("ix_decisions_strategy_time", Decision.strategy, Decision.decided_at)


# ---------- ENGINE / SESSION ----------

engine = create_engine(
    "sqlite:///tasks.db",
    connect_args={"check_same_thread": False}
)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)


def get_db():
    """FastAPI dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()