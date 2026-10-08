from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Meeting, MeetingQuestion
from app.schemas import QuestionCreate
from app.services import ask
from app.services.meetings import get_meeting, utcnow

router = APIRouter(prefix="/meetings", tags=["questions"])


@router.get("/{meeting_id}/questions")
def list_questions(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return [question_payload(item) for item in meeting.questions]


@router.post("/{meeting_id}/questions", status_code=201)
def ask_question(meeting_id: int, payload: QuestionCreate, db: Session = Depends(get_db)):
    meeting = get_meeting(db, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if not meeting.segments:
        raise HTTPException(status_code=400, detail="This meeting has no transcript to ask about")
    if not ask.has_model_key():
        raise HTTPException(status_code=503, detail="Add GROQ_API_KEY or GEMINI_API_KEY to backend/.env to ask questions")
    result = ask.answer_question(meeting, payload.question)
    if result is None:
        raise HTTPException(status_code=502, detail="The model could not answer right now. Try again.")
    answer, provider = result
    item = MeetingQuestion(
        meeting_id=meeting.id,
        question=payload.question,
        answer=answer,
        provider=provider,
        created_at=utcnow(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return question_payload(item)


def question_payload(item: MeetingQuestion) -> dict:
    return {
        "id": item.id,
        "question": item.question,
        "answer": item.answer,
        "provider": item.provider,
        "created_at": item.created_at.isoformat(),
    }
