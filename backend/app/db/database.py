import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

configured_database_url = os.getenv("DATABASE_URL", "sqlite:///./dialycore_demo.db")
if configured_database_url.startswith("sqlite:///./"):
    relative_database_path = configured_database_url.removeprefix("sqlite:///./")
    database_path = (BACKEND_DIR / relative_database_path).resolve()
    DATABASE_URL = f"sqlite:///{database_path.as_posix()}"
else:
    DATABASE_URL = configured_database_url

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite specific
    echo=False,
)


# Enable FK enforcement for every SQLite connection
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
