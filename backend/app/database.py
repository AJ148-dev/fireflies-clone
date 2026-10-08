import os
from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

engine = None
SessionLocal = None


def database_path() -> str:
    return os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "..", "fireflies.db"))


def configure() -> None:
    global engine, SessionLocal
    if engine is not None:
        engine.dispose()
    engine = create_engine(
        f"sqlite:///{database_path()}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def _enable_foreign_keys(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
