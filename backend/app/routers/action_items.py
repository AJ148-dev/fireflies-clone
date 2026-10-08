from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ActionItem, Meeting
from app.schemas import ActionCreate, ActionUpdate
from app.services.meetings import utcnow

router = APIRouter(tags=["action-items"])


def _item_payload(item: ActionItem) -> dict:
    return {
        "id": item.id,
        "text": item.text,
        "is_done": item.is_done,
        "position": item.position,
    }


@router.post("/meetings/{meeting_id}/action-items", status_code=201)
def add_action_item(meeting_id: int, payload: ActionCreate, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    position = db.scalar(
        select(func.coalesce(func.max(ActionItem.position), -1)).where(ActionItem.meeting_id == meeting_id)
    )
    item = ActionItem(
        meeting_id=meeting_id,
        text=payload.text.strip(),
        is_done=False,
        position=position + 1,
    )
    meeting.updated_at = utcnow()
    db.add(item)
    db.commit()
    db.refresh(item)
    return _item_payload(item)


@router.patch("/action-items/{item_id}")
def update_action_item(item_id: int, payload: ActionUpdate, db: Session = Depends(get_db)):
    item = db.get(ActionItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Action item not found")
    changes = payload.model_dump(exclude_unset=True)
    if "text" in changes and changes["text"] is not None:
        item.text = changes["text"].strip()
    if "is_done" in changes and changes["is_done"] is not None:
        item.is_done = changes["is_done"]
    item.meeting.updated_at = utcnow()
    db.commit()
    db.refresh(item)
    return _item_payload(item)


@router.delete("/action-items/{item_id}", status_code=204)
def delete_action_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(ActionItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Action item not found")
    db.delete(item)
    db.commit()
