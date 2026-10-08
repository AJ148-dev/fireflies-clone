from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import ActionItem, Meeting, Summary, Topic, TranscriptSegment, User
from app.services.meetings import add_children, replace_participants

AUDIO = "/sample.wav"


def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value).replace(tzinfo=timezone.utc)


def seed_if_empty(db: Session) -> None:
    if db.query(Meeting).first() is not None:
        return
    user = db.query(User).first()
    if user is None:
        user = User(name="Maya Chen", email="maya@example.com")
        db.add(user)
        db.flush()
    now = datetime.now(timezone.utc)
    for spec in MEETINGS:
        meeting = Meeting(
            user_id=user.id,
            title=spec["title"],
            started_at=_dt(spec["started_at"]),
            duration_seconds=spec["duration_seconds"],
            audio_path=AUDIO,
            created_at=now,
            updated_at=now,
        )
        db.add(meeting)
        db.flush()
        replace_participants(db, meeting, spec["participants"])
        add_children(
            meeting,
            [
                {
                    "speaker_name": speaker,
                    "start_seconds": float(start),
                    "end_seconds": float(end),
                    "text": text,
                    "position": index,
                }
                for index, (speaker, start, end, text) in enumerate(spec["lines"])
            ],
            spec["summary"],
            spec["topics"],
            spec["action_items"],
        )
    db.commit()


def _line(speaker: str, start: int, text: str, span: int = 6):
    return (speaker, start, start + span, text)


MEETINGS = [
    {
        "title": "Q4 roadmap review",
        "started_at": "2026-10-01T15:00:00",
        "duration_seconds": 75,
        "participants": ["Maya Chen", "Ava Shah", "Noah Kim"],
        "summary": (
            "The group walked the Q4 roadmap and agreed the billing rewrite stays in October, "
            "while the mobile offline mode moves to November. Noah will send revised dates today, "
            "and Ava will confirm the design capacity for the checkout refresh."
        ),
        "topics": [
            {"title": "October scope", "start_seconds": 4},
            {"title": "What slips", "start_seconds": 28},
            {"title": "Owners", "start_seconds": 52},
        ],
        "action_items": [
            {"text": "Send the revised Q4 dates", "is_done": False},
            {"text": "Confirm design capacity for checkout", "is_done": False},
            {"text": "Drop offline mode from the October board", "is_done": False},
        ],
        "lines": [
            _line("Maya Chen", 4, "Let's lock the roadmap before Friday's planning."),
            _line("Ava Shah", 12, "Checkout is the one flow customers still bounce on."),
            _line("Noah Kim", 20, "Billing rewrite is staffed. I would not add scope there."),
            _line("Ava Shah", 28, "Offline mode needs another design pass. It should slip."),
            _line("Maya Chen", 36, "Then October is billing plus the checkout refresh."),
            _line("Noah Kim", 44, "I can publish revised dates by the end of the day."),
            _line("Ava Shah", 52, "I'll confirm whether design can cover checkout this month."),
            _line("Maya Chen", 64, "Good. We'll review the board again on Monday."),
        ],
    },
    {
        "title": "Acme discovery call",
        "started_at": "2026-09-28T18:30:00",
        "duration_seconds": 70,
        "participants": ["Maya Chen", "Priya Nair"],
        "summary": (
            "Priya described Acme's rollout across three regions and a hard requirement for "
            "invoice export before procurement will sign. Maya will send a sample export and a "
            "security packet. Pricing stays out of this conversation until legal reviews the packet."
        ),
        "topics": [
            {"title": "Rollout", "start_seconds": 3},
            {"title": "Invoice export", "start_seconds": 24},
            {"title": "Next step", "start_seconds": 48},
        ],
        "action_items": [
            {"text": "Send Acme a sample invoice export", "is_done": False},
            {"text": "Share the security packet with Priya", "is_done": False},
            {"text": "Hold pricing until legal reviews the packet", "is_done": False},
        ],
        "lines": [
            _line("Priya Nair", 3, "We are rolling this out in three regions, starting with London."),
            _line("Maya Chen", 12, "What has to be true before procurement will sign?"),
            _line("Priya Nair", 24, "Invoice export is the blocker. Finance will not move without it."),
            _line("Maya Chen", 34, "We can generate a CSV of paid invoices. Would that unblock them?"),
            _line("Priya Nair", 42, "Yes, if it includes tax and the account owner."),
            _line("Maya Chen", 48, "I'll send a sample export and our security packet tomorrow."),
            _line("Priya Nair", 58, "Please keep pricing out of the thread until legal reads that packet."),
        ],
    },
    {
        "title": "Sprint retro",
        "started_at": "2026-09-24T10:00:00",
        "duration_seconds": 68,
        "participants": ["Maya Chen", "Noah Kim", "Leo Martins"],
        "summary": (
            "The sprint shipped the search filter, but review waited on flaky end-to-end tests. "
            "The team will quarantine the flaky suite and keep retro notes in the meeting page "
            "instead of a side doc. Noah already filed the test ticket."
        ),
        "topics": [
            {"title": "What shipped", "start_seconds": 2},
            {"title": "Flaky tests", "start_seconds": 22},
            {"title": "Working agreement", "start_seconds": 46},
        ],
        "action_items": [
            {"text": "Quarantine the flaky end-to-end suite", "is_done": True},
            {"text": "Keep retro notes on the meeting page", "is_done": False},
            {"text": "Cut the next sprint a day earlier", "is_done": False},
        ],
        "lines": [
            _line("Leo Martins", 2, "Search filter shipped. That was the sprint goal."),
            _line("Noah Kim", 14, "Review sat for two days on tests that fail only at night."),
            _line("Maya Chen", 22, "Let's quarantine that suite so it stops blocking merge."),
            _line("Noah Kim", 32, "I filed the ticket this morning. It's the done item."),
            _line("Leo Martins", 46, "Can we stop pasting retro notes into a doc nobody opens?"),
            _line("Maya Chen", 54, "Yes. Action items live here, and we cut scope a day earlier."),
        ],
    },
    {
        "title": "Design critique",
        "started_at": "2026-09-18T16:15:00",
        "duration_seconds": 60,
        "participants": ["Ava Shah", "Leo Martins"],
        "summary": (
            "Ava walked the meeting page: transcript on the left, summary on the right, player "
            "along the bottom. Leo asked for a stronger active line and initials instead of photos. "
            "The empty search state still needs a sentence, which Ava will add."
        ),
        "topics": [
            {"title": "Layout", "start_seconds": 2},
            {"title": "Active line", "start_seconds": 20},
            {"title": "Empty state", "start_seconds": 40},
        ],
        "action_items": [
            {"text": "Strengthen the active transcript line", "is_done": True},
            {"text": "Use initials for participants", "is_done": False},
            {"text": "Write the empty search sentence", "is_done": False},
        ],
        "lines": [
            _line("Ava Shah", 2, "Transcript stays in the main column. Summary sits on the right."),
            _line("Leo Martins", 12, "The player should stay pinned so scrubbing never covers a line."),
            _line("Ava Shah", 20, "The active line is too quiet. It needs the purple bar."),
            _line("Leo Martins", 30, "Use initials. We don't have photos for most guests."),
            _line("Ava Shah", 40, "Empty search currently looks blank. I'll add one sentence."),
            _line("Leo Martins", 50, "That's the pass. We can critique color after the sync works."),
        ],
    },
]
