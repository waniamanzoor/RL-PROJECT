"""
backend/db/queries.py

Bridges the database to the existing RL code:

  - `get_env_tasks(db)` returns the same (tasks, task_status) shape that
    baselines.py reads from env.tasks / env.task_status, so deadline_only and
    priority_only work unchanged on real data.

  - `log_decision(db, ...)` records every action from any strategy.
  - `attach_reward(db, ...)` fills in the reward once the focus session ends.
  - `current_energy(db)` and `recent_productivity(db)` feed the global features
    of the state vector.
"""
from datetime import datetime, timedelta
from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from .models import Task, EnergyLog, TimeLog, Decision, FocusSession

# matches env.action_space.n - 1 in task_env.py (8 task slots + 1 break)
MAX_TASK_SLOTS = 8


def get_env_tasks(db: Session):
    """
    Returns (tasks, task_status) in the same shape the env uses:
        tasks       = [{"priority": int, "effort": int,
                        "deadline_days": int, "category": str}, ...]
        task_status = ["pending" | "done", ...]
    Padded to MAX_TASK_SLOTS with neutral filler.
    """
    rows = (
        db.query(Task)
        .filter(Task.status != "cancelled")
        .order_by(Task.deadline_days.asc(), Task.priority.desc())
        .limit(MAX_TASK_SLOTS)
        .all()
    )

    tasks, task_status, task_ids = [], [], []
    for r in rows:
        tasks.append({
            "priority":      r.priority,
            "effort":        r.effort,
            "deadline_days": r.deadline_days,
            "category":      r.category,
        })
        task_status.append("done" if r.status == "done" else "pending")
        task_ids.append(r.id)

    # pad so the state vector shape stays fixed at 36
    while len(tasks) < MAX_TASK_SLOTS:
        tasks.append({"priority": 0, "effort": 0,
                      "deadline_days": 0, "category": "admin"})
        task_status.append("done")   # treat padding as already-done so agent ignores it
        task_ids.append(None)

    return tasks, task_status, task_ids


def current_energy(db: Session, default: int = 3) -> int:
    row = (db.query(EnergyLog.energy_level)
             .order_by(desc(EnergyLog.logged_at)).first())
    return row[0] if row else default


def recent_productivity(db: Session, hours: int = 2) -> float:
    """Fraction of tracked time in the last `hours` that was 'productive'."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    rows = (db.query(TimeLog.category,
                     func.coalesce(func.sum(TimeLog.duration_seconds), 0))
              .filter(TimeLog.logged_at >= cutoff)
              .group_by(TimeLog.category).all())
    totals = {cat: sec for cat, sec in rows}
    total = sum(totals.values())
    if total == 0:
        return 0.5
    return totals.get("productive", 0) / total


def log_decision(db: Session, *, strategy: str, action_index: int,
                 task_id, state_vector, q_values=None) -> Decision:
    rec = Decision(
        strategy=strategy,
        action_index=action_index,
        task_id=task_id,
        state_vector=state_vector,
        q_values=q_values,
    )
    db.add(rec); db.commit(); db.refresh(rec)
    return rec


def attach_reward(db: Session, decision_id: int,
                  reward: float, parts: dict, accepted: bool):
    rec = db.get(Decision, decision_id)
    rec.reward = reward
    rec.reward_parts = parts
    rec.was_accepted = accepted
    db.commit()


# ---------- comparison query for the "RL vs baselines" report ----------

def avg_reward_by_strategy(db: Session, days: int = 7) -> dict:
    cutoff = datetime.utcnow() - timedelta(days=days)
    rows = (db.query(Decision.strategy, func.avg(Decision.reward))
              .filter(Decision.decided_at >= cutoff,
                      Decision.reward.isnot(None))
              .group_by(Decision.strategy).all())
    return {strat: float(avg) for strat, avg in rows}