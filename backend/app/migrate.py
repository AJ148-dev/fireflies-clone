from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.models import Meeting

SCALER_VIDEO_ID = "JH2lZdxS59c"
SCALER_TITLE = "How the Scaler ecosystem is going global"


def ensure_meeting_columns(engine: Engine) -> None:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if "meetings" not in tables:
        return
    columns = {column["name"] for column in inspector.get_columns("meetings")}
    if "youtube_video_id" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE meetings ADD COLUMN youtube_video_id VARCHAR(20)"))
    if "action_items" in tables:
        columns = {column["name"] for column in inspector.get_columns("action_items")}
        if "owner" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE action_items ADD COLUMN owner VARCHAR(120)"))


def backfill_youtube_video_ids(db: Session) -> None:
    meetings = db.query(Meeting).filter(Meeting.title == SCALER_TITLE).all()
    for meeting in meetings:
        if meeting.youtube_video_id != SCALER_VIDEO_ID:
            meeting.youtube_video_id = SCALER_VIDEO_ID
    if meetings:
        db.commit()
