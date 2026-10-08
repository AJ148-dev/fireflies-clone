from datetime import date

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import MeetingCreate, MeetingUpdate
from app.services.meetings import (
    card_payload,
    create_meeting,
    delete_meeting,
    detail_payload,
    get_meeting,
    list_meetings,
    update_meeting,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("")
def read_meetings(
    q: str | None = None,
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    sort: str = "recent",
    db: Session = Depends(get_db),
):
    if sort not in {"recent", "oldest"}:
        raise HTTPException(status_code=400, detail="expected sort to be recent or oldest")
    meetings = list_meetings(db, q, from_date, to_date, sort)
    return [card_payload(meeting) for meeting in meetings]


@router.post("", status_code=201)
def post_meeting(payload: MeetingCreate, db: Session = Depends(get_db)):
    try:
        meeting = create_meeting(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return detail_payload(meeting)


@router.post("/import", status_code=201)
async def import_meeting(
    file: UploadFile = File(...),
    title: str = Form(...),
    started_at: str = Form(...),
    participant_names: str = Form(""),
    duration_seconds: int = Form(0),
    db: Session = Depends(get_db),
):
    extension = _extension(file.filename or "")
    if extension not in {"txt", "vtt", "json"}:
        raise HTTPException(status_code=400, detail="expected a .txt, .vtt, or .json file")
    raw = (await file.read()).decode("utf-8-sig")
    try:
        started = MeetingCreate(title=title, started_at=started_at, duration_seconds=duration_seconds)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="expected a valid title and started_at") from exc
    names = [part.strip() for part in participant_names.split(",") if part.strip()]
    try:
        meeting = create_meeting(
            db,
            {
                "title": started.title,
                "started_at": started.started_at,
                "duration_seconds": started.duration_seconds,
                "participant_names": names,
                "transcript_format": extension,
                "transcript_text": raw,
                "summary": None,
                "topics": [],
                "action_items": [],
            },
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return detail_payload(meeting)


@router.get("/{meeting_id}")
def read_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return detail_payload(meeting)


@router.patch("/{meeting_id}")
def patch_meeting(meeting_id: int, payload: MeetingUpdate, db: Session = Depends(get_db)):
    meeting = get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    updated = update_meeting(db, meeting, payload.model_dump(exclude_unset=True))
    return detail_payload(updated)


@router.delete("/{meeting_id}", status_code=204)
def remove_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    delete_meeting(db, meeting)


def _extension(filename: str) -> str:
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()
