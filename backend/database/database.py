from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# DATABASE_URL tells SQLAlchemy where the database file lives.
# sqlite:///./scheduler.db means a file called scheduler.db
# in the same folder where you run the server.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./scheduler.db")

# connect_args is required for SQLite only — it allows the same
# connection to be used across multiple threads (FastAPI uses threads).
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# SessionLocal is a factory. Each call to SessionLocal() creates a
# brand new database session (think of it as an open connection).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class all your models will inherit from.
Base = declarative_base()

# This is a FastAPI dependency. It opens a session, yields it to
# the route handler, then closes it after the request finishes.
# The try/finally ensures the session always closes even on errors.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()