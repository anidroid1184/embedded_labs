from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


Locale = Literal["es", "en"]


class LessonSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: UUID
    slug: str
    title: str
    status: str
    summary: str


class LessonStepOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    kind: str
    title: str
    narration: str
    visual: dict[str, Any]


class LessonDetail(LessonSummary):
    steps: list[LessonStepOut]


class ProgressItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    lesson_slug: str = Field(alias="lessonSlug")
    step_id: str = Field(alias="stepId")
    completed: bool


class ProgressResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    guest_id: UUID = Field(alias="guestId")
    items: list[ProgressItem]


class UpsertProgressRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lesson_slug: str = Field(alias="lessonSlug")
    step_id: str = Field(alias="stepId")
    completed: bool
