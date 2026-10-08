from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class TopicIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    start_seconds: float | None = Field(default=None, ge=0)

    @field_validator("title")
    @classmethod
    def title_must_have_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("topic title cannot be blank")
        return value


class ActionIn(BaseModel):
    text: str = Field(min_length=1)
    is_done: bool = False

    @field_validator("text")
    @classmethod
    def text_must_have_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("action item text cannot be blank")
        return value


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    started_at: datetime
    duration_seconds: int = Field(default=0, ge=0)
    participant_names: list[str] = []
    transcript_format: Literal["txt", "vtt", "json"] | None = None
    transcript_text: str | None = None
    summary: str | None = None
    topics: list[TopicIn] = []
    action_items: list[ActionIn] = []

    @field_validator("title")
    @classmethod
    def title_must_have_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("meeting title cannot be blank")
        return value

    @model_validator(mode="after")
    def transcript_needs_a_format(self):
        if self.transcript_text and self.transcript_text.strip() and not self.transcript_format:
            raise ValueError("transcript_format is required when transcript_text is set")
        return self


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    started_at: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    participant_names: list[str] | None = None

    @field_validator("title")
    @classmethod
    def title_must_have_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("meeting title cannot be blank")
        return value


class ActionCreate(BaseModel):
    text: str = Field(min_length=1)

    @field_validator("text")
    @classmethod
    def text_must_have_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("action item text cannot be blank")
        return value


class ActionUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1)
    is_done: bool | None = None

    @field_validator("text")
    @classmethod
    def text_must_have_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("action item text cannot be blank")
        return value
