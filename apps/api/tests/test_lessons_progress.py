from __future__ import annotations

import os
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

CONTENT = str((Path(__file__).resolve().parents[3] / "content" / "lessons"))

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["CONTENT_DIR"] = CONTENT
os.environ["CORS_ORIGIN"] = "*"

from app.config import get_settings
from app.db import Base, configure_engine, get_db, get_engine, get_session_factory
from app.main import create_app
from app.services.seed import seed_lessons

get_settings.cache_clear()


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    get_settings.cache_clear()
    configure_engine("sqlite+aiosqlite:///:memory:")
    eng = get_engine()
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = get_session_factory()
    async with factory() as session:
        await seed_lessons(session, Path(CONTENT))

    app = create_app(with_lifespan=False)

    async def _override_db() -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = _override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    await eng.dispose()
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_c01_health_ok(client: AsyncClient) -> None:
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_c02_ready_ok(client: AsyncClient) -> None:
    res = await client.get("/ready")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"


@pytest.mark.asyncio
async def test_c03_list_lessons(client: AsyncClient) -> None:
    res = await client.get("/api/v1/lessons")
    assert res.status_code == 200
    body = res.json()
    slugs = {item["slug"] for item in body}
    assert "bitwise-basics" in slugs
    assert "registers-and-memory" in slugs
    by_slug = {item["slug"]: item for item in body}
    assert by_slug["bitwise-basics"]["status"] == "published"
    assert by_slug["registers-and-memory"]["status"] == "draft"


@pytest.mark.asyncio
async def test_c04_lesson_locale_en(client: AsyncClient) -> None:
    res = await client.get("/api/v1/lessons/bitwise-basics", params={"locale": "en"})
    assert res.status_code == 200
    body = res.json()
    assert body["title"] == "Bitwise Basics"
    assert "Learn AND" in body["summary"]
    assert body["steps"][0]["title"].startswith("AND")


@pytest.mark.asyncio
async def test_c05_lesson_locale_es(client: AsyncClient) -> None:
    res = await client.get("/api/v1/lessons/bitwise-basics", params={"locale": "es"})
    assert res.status_code == 200
    body = res.json()
    assert body["title"] == "Fundamentos bitwise"
    assert "Aprende AND" in body["summary"]
    assert "sobreviven" in body["steps"][0]["title"]


@pytest.mark.asyncio
async def test_c06_c07_c08_progress(client: AsyncClient) -> None:
    res = await client.put(
        "/api/v1/progress",
        json={"lessonSlug": "bitwise-basics", "stepId": "step-and", "completed": True},
    )
    assert res.status_code == 200
    guest = res.headers.get("x-guest-id")
    assert guest
    body = res.json()
    assert body["guestId"] == guest
    assert any(i["stepId"] == "step-and" and i["completed"] for i in body["items"])

    res = await client.put(
        "/api/v1/progress",
        headers={"X-Guest-Id": guest},
        json={"lessonSlug": "bitwise-basics", "stepId": "step-or", "completed": True},
    )
    assert res.status_code == 200

    res = await client.get("/api/v1/progress", headers={"X-Guest-Id": guest})
    assert res.status_code == 200
    items = res.json()["items"]
    assert any(i["stepId"] == "step-and" and i["completed"] for i in items)
    assert any(i["stepId"] == "step-or" and i["completed"] for i in items)
