from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False)


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False, unique=True)


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (Index("ix_meetings_user_started", "user_id", "started_at"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    duration_seconds = Column(Integer, nullable=False, default=0)
    audio_path = Column(String(255), nullable=False, default="/sample.wav")
    youtube_video_id = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User")
    links = relationship(
        "MeetingParticipant",
        cascade="all, delete-orphan",
        order_by="MeetingParticipant.position",
    )
    segments = relationship(
        "TranscriptSegment",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.position",
    )
    summary = relationship(
        "Summary",
        cascade="all, delete-orphan",
        uselist=False,
    )
    topics = relationship(
        "Topic",
        cascade="all, delete-orphan",
        order_by="Topic.position",
    )
    action_items = relationship(
        "ActionItem",
        cascade="all, delete-orphan",
        order_by="ActionItem.position",
    )
    questions = relationship(
        "MeetingQuestion",
        cascade="all, delete-orphan",
        order_by="MeetingQuestion.id",
    )


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True)
    participant_id = Column(ForeignKey("participants.id"), primary_key=True)
    position = Column(Integer, nullable=False, default=0)

    meeting = relationship("Meeting", back_populates="links")
    participant = relationship("Participant")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"
    __table_args__ = (
        Index("ix_segments_meeting_position", "meeting_id", "position"),
        Index("ix_segments_meeting_start", "meeting_id", "start_seconds"),
    )

    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    speaker_name = Column(String(120), nullable=False)
    start_seconds = Column(Float, nullable=False)
    end_seconds = Column(Float, nullable=True)
    text = Column(Text, nullable=False)
    position = Column(Integer, nullable=False)

    meeting = relationship("Meeting", back_populates="segments")
    comments = relationship(
        "SegmentComment",
        cascade="all, delete-orphan",
        order_by="SegmentComment.id",
    )
    highlight = relationship(
        "SegmentHighlight",
        cascade="all, delete-orphan",
        uselist=False,
    )


class SegmentComment(Base):
    __tablename__ = "segment_comments"

    id = Column(Integer, primary_key=True)
    segment_id = Column(ForeignKey("transcript_segments.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)

    segment = relationship("TranscriptSegment", back_populates="comments")


class SegmentHighlight(Base):
    __tablename__ = "segment_highlights"

    id = Column(Integer, primary_key=True)
    segment_id = Column(ForeignKey("transcript_segments.id", ondelete="CASCADE"), nullable=False, unique=True)

    segment = relationship("TranscriptSegment", back_populates="highlight")


class Summary(Base):
    __tablename__ = "summaries"
    __table_args__ = (UniqueConstraint("meeting_id"),)

    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    body = Column(Text, nullable=False)

    meeting = relationship("Meeting", back_populates="summary")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    start_seconds = Column(Float, nullable=True)
    position = Column(Integer, nullable=False)

    meeting = relationship("Meeting", back_populates="topics")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    owner = Column(String(120), nullable=True)
    is_done = Column(Boolean, nullable=False, default=False)
    position = Column(Integer, nullable=False)

    meeting = relationship("Meeting", back_populates="action_items")


class MeetingQuestion(Base):
    __tablename__ = "meeting_questions"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    provider = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)

    meeting = relationship("Meeting", back_populates="questions")
