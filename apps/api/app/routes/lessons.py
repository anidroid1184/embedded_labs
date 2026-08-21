from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.i18n import normalize_locale, pick_locale
from app.models import Lesson
from app.schemas import LessonDetail, LessonStepOut, LessonSummary, Locale

router = APIRouter(prefix="/api/v1")


@router.get("/lessons", response_model=list[LessonSummary])
async def list_lessons(
    locale: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[LessonSummary]:
    loc: Locale = normalize_locale(locale)
    result = await db.execute(select(Lesson).order_by(Lesson.slug.asc()))
    lessons = result.scalars().all()
    return [
        LessonSummary(
            id=lesson.id,
            slug=lesson.slug,
            title=pick_locale(lesson.title, loc),
            status=lesson.status,
            summary=pick_locale(lesson.summary, loc),
        )
        for lesson in lessons
    ]


@router.get("/lessons/{slug}", response_model=LessonDetail)
async def get_lesson(
    slug: str,
    locale: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> LessonDetail:
    loc: Locale = normalize_locale(locale)
    result = await db.execute(
        select(Lesson)
        .where(Lesson.slug == slug)
        .options(selectinload(Lesson.steps))
    )
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=404, detail=f"lesson '{slug}' not found")

    steps = sorted(lesson.steps, key=lambda s: s.position)
    return LessonDetail(
        id=lesson.id,
        slug=lesson.slug,
        title=pick_locale(lesson.title, loc),
        status=lesson.status,
        summary=pick_locale(lesson.summary, loc),
        steps=[
            LessonStepOut(
                id=step.id,
                kind=step.kind,
                title=pick_locale(step.title, loc),
                narration=pick_locale(step.narration, loc),
                visual=step.visual,
            )
            for step in steps
        ],
    )
