from __future__ import annotations

import json
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Lesson, LessonStep


def _as_i18n(value: object) -> dict[str, str]:
    if isinstance(value, dict):
        return {
            "es": str(value.get("es", value.get("en", ""))),
            "en": str(value.get("en", value.get("es", ""))),
        }
    text = str(value or "")
    return {"es": text, "en": text}


async def seed_lessons(session: AsyncSession, content_dir: Path) -> None:
    if not content_dir.exists():
        return

    files = sorted(content_dir.glob("*.json"))
    for path in files:
        raw = json.loads(path.read_text(encoding="utf-8"))
        lesson_id = UUID(str(raw["id"]))
        existing = await session.get(Lesson, lesson_id)
        if existing is None:
            existing = Lesson(id=lesson_id, slug=raw["slug"], title={}, status="draft", summary={})
            session.add(existing)

        existing.slug = raw["slug"]
        existing.title = _as_i18n(raw.get("title"))
        existing.status = raw.get("status", "draft")
        existing.summary = _as_i18n(raw.get("summary"))

        result = await session.execute(
            select(LessonStep).where(LessonStep.lesson_id == lesson_id)
        )
        for step in result.scalars().all():
            await session.delete(step)

        for position, step in enumerate(raw.get("steps", [])):
            session.add(
                LessonStep(
                    id=step["id"],
                    lesson_id=lesson_id,
                    position=position,
                    kind=step["kind"],
                    title=_as_i18n(step.get("title")),
                    narration=_as_i18n(step.get("narration")),
                    visual=step.get("visual") or {},
                )
            )

    await session.commit()
