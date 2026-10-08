import json
from pathlib import Path

from app.models import Meeting, TranscriptSegment

DATA_PATH = Path(__file__).parent / "data" / "scaler_youtube_lines.json"
SCALER_TITLE = "How the Scaler ecosystem is going global"


def scaler_youtube_lines() -> list[tuple[str, float, float, str]]:
    items = json.loads(DATA_PATH.read_text())
    return [(item["speaker"], item["start"], item["end"], item["text"]) for item in items]


def replace_meeting_transcript(meeting: Meeting, lines: list[tuple[str, float, float, str]]) -> None:
    meeting.segments.clear()
    for index, (speaker, start, end, text) in enumerate(lines):
        meeting.segments.append(
            TranscriptSegment(
                speaker_name=speaker,
                start_seconds=float(start),
                end_seconds=float(end),
                text=text,
                position=index,
            )
        )
    if lines:
        meeting.duration_seconds = max(meeting.duration_seconds, int(lines[-1][2]))


def resync_scaler_transcripts(db) -> None:
    lines = scaler_youtube_lines()
    meetings = db.query(Meeting).filter(Meeting.title == SCALER_TITLE).all()
    for meeting in meetings:
        replace_meeting_transcript(meeting, lines)
    if meetings:
        db.commit()
