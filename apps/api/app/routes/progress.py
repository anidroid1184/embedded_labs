from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Lesson, LessonStep, Progress
from app.schemas import ProgressItem, ProgressResponse, UpsertProgressRequest

router = APIRouter(prefix="/api/v1")

GUEST_HEADER = "x-guest-id"


def _parse_guest(raw: str | None) -> UUID | None:
    if not raw:
        return None
    try:
        return UUID(raw)
    except ValueError:
        return None


async def _load_items(db: AsyncSession, guest_id: UUID) -> list[ProgressItem]:
    result = await db.execute(
        select(Progress, Lesson.slug)
        .join(Lesson, Lesson.id == Progress.lesson_id)
        .where(Progress.guest_id == guest_id)
        .order_by(Lesson.slug, Progress.step_id)
    )
    items: list[ProgressItem] = []
    for progress, slug in result.all():
        items.append(
            ProgressItem(
                lessonSlug=slug,
                stepId=progress.step_id,
                completed=progress.completed,
            )
        )
    return items


def _attach_guest_headers(response: Response, guest_id: UUID, issued: bool) -> None:
    response.headers[GUEST_HEADER] = str(guest_id)
    if issued:
        response.headers["set-cookie"] = (
            f"guest_id={guest_id}; Path=/; SameSite=Lax; Max-Age=31536000"
        )


@router.get("/progress", response_model=ProgressResponse)
async def get_progress(
    response: Response,
    db: AsyncSession = Depends(get_db),
    x_guest_id: str | None = Header(default=None, alias="X-Guest-Id"),
) -> ProgressResponse:
    parsed = _parse_guest(x_guest_id)
    issued = parsed is None
    guest_id = parsed or uuid4()
    items = [] if issued else await _load_items(db, guest_id)
    _attach_guest_headers(response, guest_id, issued)
    return ProgressResponse(guestId=guest_id, items=items)


@router.put("/progress", response_model=ProgressResponse)
async def upsert_progress(
    payload: UpsertProgressRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    x_guest_id: str | None = Header(default=None, alias="X-Guest-Id"),
) -> ProgressResponse:
    if not payload.lesson_slug.strip() or not payload.step_id.strip():
        raise HTTPException(status_code=400, detail="lessonSlug and stepId are required")

    parsed = _parse_guest(x_guest_id)
    issued = parsed is None
    guest_id = parsed or uuid4()

    lesson_result = await db.execute(select(Lesson).where(Lesson.slug == payload.lesson_slug))
    lesson = lesson_result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=404, detail=f"lesson '{payload.lesson_slug}' not found")

    step_result = await db.execute(
        select(LessonStep).where(
            LessonStep.lesson_id == lesson.id,
            LessonStep.id == payload.step_id,
        )
    )
    if step_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=404,
            detail=f"step '{payload.step_id}' not found in lesson '{payload.lesson_slug}'",
        )

    existing = await db.get(Progress, (guest_id, lesson.id, payload.step_id))
    if existing is None:
        db.add(
            Progress(
                guest_id=guest_id,
                lesson_id=lesson.id,
                step_id=payload.step_id,
                completed=payload.completed,
            )
        )
    else:
        existing.completed = payload.completed

    await db.commit()
    items = await _load_items(db, guest_id)
    _attach_guest_headers(response, guest_id, issued)
    return ProgressResponse(guestId=guest_id, items=items)
