from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SegmentComment, SegmentHighlight, TranscriptSegment
from app.schemas import CommentCreate
from app.services.meetings import utcnow

router = APIRouter(tags=["comments"])


@router.post("/segments/{segment_id}/comments", status_code=201)
def add_comment(segment_id: int, payload: CommentCreate, db: Session = Depends(get_db)):
    segment = db.get(TranscriptSegment, segment_id)
    if segment is None:
        raise HTTPException(status_code=404, detail="Transcript line not found")
    comment = SegmentComment(segment_id=segment_id, body=payload.body, created_at=utcnow())
    segment.meeting.updated_at = utcnow()
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {"id": comment.id, "body": comment.body}


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.get(SegmentComment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()


@router.put("/segments/{segment_id}/highlight")
def highlight_segment(segment_id: int, db: Session = Depends(get_db)):
    segment = db.get(TranscriptSegment, segment_id)
    if segment is None:
        raise HTTPException(status_code=404, detail="Transcript line not found")
    if segment.highlight is None:
        db.add(SegmentHighlight(segment_id=segment_id))
        segment.meeting.updated_at = utcnow()
        db.commit()
    return {"highlighted": True}


@router.delete("/segments/{segment_id}/highlight", status_code=204)
def clear_highlight(segment_id: int, db: Session = Depends(get_db)):
    segment = db.get(TranscriptSegment, segment_id)
    if segment is None:
        raise HTTPException(status_code=404, detail="Transcript line not found")
    if segment.highlight is not None:
        db.delete(segment.highlight)
        segment.meeting.updated_at = utcnow()
        db.commit()
