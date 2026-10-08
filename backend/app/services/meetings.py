from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    ActionItem,
    Meeting,
    MeetingParticipant,
    Participant,
    Summary,
    Topic,
    TranscriptSegment,
    User,
)
from app.services.transcript_parser import parse_transcript

AUDIO_PATH = "/sample.wav"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_or_create_user(db: Session) -> User:
    user = db.scalar(select(User).limit(1))
    if user is None:
        user = User(name="Maya Chen", email="maya@example.com")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def meeting_query():
    return select(Meeting).options(
        selectinload(Meeting.links).selectinload(MeetingParticipant.participant),
        selectinload(Meeting.segments),
        selectinload(Meeting.summary),
        selectinload(Meeting.topics),
        selectinload(Meeting.action_items),
    )


def get_meeting(db: Session, meeting_id: int) -> Meeting | None:
    return db.scalar(meeting_query().where(Meeting.id == meeting_id))


def list_meetings(db: Session, q: str | None, start, end, sort: str) -> list[Meeting]:
    user = get_or_create_user(db)
    stmt = select(Meeting).options(
        selectinload(Meeting.links).selectinload(MeetingParticipant.participant)
    ).where(Meeting.user_id == user.id)
    if q and q.strip():
        like = f"%{q.strip()}%"
        participant_match = (
            select(MeetingParticipant.meeting_id)
            .join(Participant, Participant.id == MeetingParticipant.participant_id)
            .where(Participant.name.ilike(like))
        )
        segment_match = select(TranscriptSegment.meeting_id).where(TranscriptSegment.text.ilike(like))
        summary_match = select(Summary.meeting_id).where(Summary.body.ilike(like))
        topic_match = select(Topic.meeting_id).where(Topic.title.ilike(like))
        action_match = select(ActionItem.meeting_id).where(ActionItem.text.ilike(like))
        stmt = stmt.where(
            or_(
                Meeting.title.ilike(like),
                Meeting.id.in_(participant_match),
                Meeting.id.in_(segment_match),
                Meeting.id.in_(summary_match),
                Meeting.id.in_(topic_match),
                Meeting.id.in_(action_match),
            )
        )
    if start is not None:
        stmt = stmt.where(Meeting.started_at >= datetime.combine(start, time.min, timezone.utc))
    if end is not None:
        stmt = stmt.where(
            Meeting.started_at < datetime.combine(end + timedelta(days=1), time.min, timezone.utc)
        )
    order = Meeting.started_at.asc() if sort == "oldest" else Meeting.started_at.desc()
    return list(db.scalars(stmt.order_by(order).limit(100)))


def replace_participants(db: Session, meeting: Meeting, names: list[str]) -> None:
    cleaned: list[str] = []
    seen: set[str] = set()
    for name in names:
        value = " ".join(name.split())
        if not value:
            continue
        key = value.casefold()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(value)
    meeting.links.clear()
    db.flush()
    for position, name in enumerate(cleaned):
        existing = db.scalar(select(Participant).where(func.lower(Participant.name) == name.casefold()))
        if existing is None:
            existing = Participant(name=name)
            db.add(existing)
            db.flush()
        meeting.links.append(
            MeetingParticipant(participant=existing, position=position)
        )


def inferred_duration(duration_seconds: int, segments: list[dict]) -> int:
    if duration_seconds > 0:
        return duration_seconds
    if not segments:
        return 0
    last = segments[-1]
    end = last["end_seconds"] if last["end_seconds"] is not None else last["start_seconds"]
    return max(0, int(end))


def add_children(
    meeting: Meeting,
    segments: list[dict],
    summary: str | None,
    topics: list[dict],
    action_items: list[dict],
) -> None:
    for segment in segments:
        meeting.segments.append(TranscriptSegment(**segment))
    if summary and summary.strip():
        meeting.summary = Summary(body=summary.strip())
    for position, topic in enumerate(topics):
        meeting.topics.append(
            Topic(
                title=topic["title"].strip(),
                start_seconds=topic.get("start_seconds"),
                position=position,
            )
        )
    for position, item in enumerate(action_items):
        meeting.action_items.append(
            ActionItem(text=item["text"].strip(), is_done=bool(item.get("is_done", False)), position=position)
        )


def create_meeting(db: Session, payload: dict) -> Meeting:
    user = get_or_create_user(db)
    segments: list[dict] = []
    if payload.get("transcript_text"):
        segments = parse_transcript(payload["transcript_text"], payload["transcript_format"])
    now = utcnow()
    meeting = Meeting(
        user_id=user.id,
        title=payload["title"].strip(),
        started_at=as_utc(payload["started_at"]),
        duration_seconds=inferred_duration(payload.get("duration_seconds") or 0, segments),
        audio_path=AUDIO_PATH,
        created_at=now,
        updated_at=now,
    )
    db.add(meeting)
    db.flush()
    replace_participants(db, meeting, payload.get("participant_names") or [])
    add_children(
        meeting,
        segments,
        payload.get("summary"),
        payload.get("topics") or [],
        payload.get("action_items") or [],
    )
    db.commit()
    return get_meeting(db, meeting.id)


def update_meeting(db: Session, meeting: Meeting, payload: dict) -> Meeting:
    if "title" in payload and payload["title"] is not None:
        meeting.title = payload["title"].strip()
    if "started_at" in payload and payload["started_at"] is not None:
        meeting.started_at = as_utc(payload["started_at"])
    if "duration_seconds" in payload and payload["duration_seconds"] is not None:
        meeting.duration_seconds = payload["duration_seconds"]
    if "participant_names" in payload and payload["participant_names"] is not None:
        replace_participants(db, meeting, payload["participant_names"])
    meeting.updated_at = utcnow()
    db.commit()
    return get_meeting(db, meeting.id)


def delete_meeting(db: Session, meeting: Meeting) -> None:
    db.delete(meeting)
    db.commit()


def participant_payload(meeting: Meeting) -> list[dict]:
    return [
        {"id": link.participant.id, "name": link.participant.name}
        for link in meeting.links
    ]


def card_payload(meeting: Meeting, snippet: str | None = None) -> dict:
    card = {
        "id": meeting.id,
        "title": meeting.title,
        "started_at": as_utc(meeting.started_at).isoformat(),
        "duration_seconds": meeting.duration_seconds,
        "participants": participant_payload(meeting),
    }
    if snippet:
        card["snippet"] = snippet
    return card


def _clip(text: str, needle: str) -> str:
    clean = " ".join(text.split())
    index = clean.casefold().find(needle.casefold())
    limit = 140
    if index < 0 or len(clean) <= limit:
        return clean[:limit]
    start = max(0, index - 40)
    end = min(len(clean), start + limit)
    prefix = "…" if start else ""
    suffix = "…" if end < len(clean) else ""
    return f"{prefix}{clean[start:end]}{suffix}"


def search_snippets(db: Session, meeting_ids: list[int], needle: str) -> dict[int, str]:
    if not meeting_ids or not needle.strip():
        return {}
    like = f"%{needle.strip()}%"
    found: dict[int, str] = {}
    segments = db.scalars(
        select(TranscriptSegment)
        .where(TranscriptSegment.meeting_id.in_(meeting_ids), TranscriptSegment.text.ilike(like))
        .order_by(TranscriptSegment.meeting_id, TranscriptSegment.position)
    )
    for segment in segments:
        found.setdefault(segment.meeting_id, _clip(f"{segment.speaker_name}: {segment.text}", needle))
    remaining = [meeting_id for meeting_id in meeting_ids if meeting_id not in found]
    if not remaining:
        return found
    for summary in db.scalars(select(Summary).where(Summary.meeting_id.in_(remaining), Summary.body.ilike(like))):
        found.setdefault(summary.meeting_id, _clip(summary.body, needle))
    remaining = [meeting_id for meeting_id in meeting_ids if meeting_id not in found]
    if not remaining:
        return found
    for topic in db.scalars(select(Topic).where(Topic.meeting_id.in_(remaining), Topic.title.ilike(like))):
        found.setdefault(topic.meeting_id, _clip(topic.title, needle))
    remaining = [meeting_id for meeting_id in meeting_ids if meeting_id not in found]
    if not remaining:
        return found
    for item in db.scalars(select(ActionItem).where(ActionItem.meeting_id.in_(remaining), ActionItem.text.ilike(like))):
        found.setdefault(item.meeting_id, _clip(item.text, needle))
    return found


def detail_payload(meeting: Meeting) -> dict:
    return {
        **card_payload(meeting),
        "audio_path": meeting.audio_path,
        "youtube_video_id": meeting.youtube_video_id,
        "summary": {"body": meeting.summary.body} if meeting.summary else None,
        "topics": [
            {
                "id": topic.id,
                "title": topic.title,
                "start_seconds": topic.start_seconds,
                "position": topic.position,
            }
            for topic in meeting.topics
        ],
        "action_items": [
            {
                "id": item.id,
                "text": item.text,
                "is_done": item.is_done,
                "position": item.position,
            }
            for item in meeting.action_items
        ],
        "segments": [
            {
                "id": segment.id,
                "speaker_name": segment.speaker_name,
                "start_seconds": segment.start_seconds,
                "end_seconds": segment.end_seconds,
                "text": segment.text,
                "position": segment.position,
            }
            for segment in meeting.segments
        ],
    }
