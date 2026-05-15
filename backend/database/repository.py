"""
backend/db/repository.py
The DB-to-RL bridge. Everything the env needs is here.
"""
from datetime import datetime, timedelta
from sqlalchemy import select, desc, and_, func
from sqlalchemy.orm import Session
from .models import (
    Task, TaskStatus, EnergyLog, ProductivityScore, FocusSession,
    Recommendation, TrackingEvent,
)

MAX_TASKS_IN_STATE = 8  # matches your env's action_size = 9 (8 + break)


def get_candidate_tasks(db: Session, user_id: str, limit: int = MAX_TASKS_IN_STATE):
    """The exact 8 tasks the agent will see. Sorted by deadline, then priority."""
    stmt = (
        select(Task)
        .where(Task.user_id == user_id, Task.status == TaskStatus.pending)
        .order_by(Task.deadline.asc().nullslast(), Task.priority.desc())
        .limit(limit)
    )
    return list(db.execute(stmt).scalars())


def get_current_energy(db: Session, user_id: str, default: int = 3) -> int:
    row = db.execute(
        select(EnergyLog.energy_level)
        .where(EnergyLog.user_id == user_id)
        .order_by(desc(EnergyLog.reported_at))
        .limit(1)
    ).scalar()
    return row if row is not None else default


def get_recent_productivity(db: Session, user_id: str, hours: int = 2) -> float:
    """Productivity score over the last `hours` hours. Falls back to 0.5."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    row = db.execute(
        select(func.avg(ProductivityScore.score))
        .where(
            ProductivityScore.user_id == user_id,
            ProductivityScore.window_end >= cutoff,
        )
    ).scalar()
    return float(row) if row is not None else 0.5


def build_state(db: Session, user_id: str):
    """
    Returns the dict the env consumes. Convert to numpy in the env.
    Shape: 8 tasks x 4 features + 4 global = 36 dims.
    """
    tasks = get_candidate_tasks(db, user_id)
    now = datetime.utcnow()
    task_rows = []
    for t in tasks:
        days_to_deadline = ((t.deadline - now).total_seconds() / 86400.0
                            if t.deadline else 30.0)
        task_rows.append({
            "priority": t.priority,                            # 1..5
            "effort_min": t.estimated_effort_min,
            "days_to_deadline": max(-30.0, min(30.0, days_to_deadline)),
            "category": t.category.value,
        })
    # pad to 8 with neutral filler so state shape stays fixed
    while len(task_rows) < MAX_TASKS_IN_STATE:
        task_rows.append({"priority": 0, "effort_min": 0,
                          "days_to_deadline": 0.0, "category": "other"})
    return {
        "tasks": task_rows,
        "current_hour": now.hour,
        "day_of_week": now.weekday(),
        "energy": get_current_energy(db, user_id),
        "productivity_score": get_recent_productivity(db, user_id),
    }


def log_recommendation(db: Session, **kwargs) -> Recommendation:
    rec = Recommendation(**kwargs)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def attach_reward(db: Session, rec_id: str, reward: float, breakdown: dict):
    """Called after the user finishes (or skips) the recommended task."""
    rec = db.get(Recommendation, rec_id)
    rec.reward = reward
    rec.reward_breakdown = breakdown
    rec.resolved_at = datetime.utcnow()
    db.commit()