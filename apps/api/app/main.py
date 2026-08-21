from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import Base, configure_engine, get_engine, get_session_factory
from app.routes import health, lessons, progress
from app.services.seed import seed_lessons


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    configure_engine()
    eng = get_engine()
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    content_dir = Path(settings.content_dir)
    if not content_dir.is_absolute():
        content_dir = (Path.cwd() / content_dir).resolve()

    factory = get_session_factory()
    async with factory() as session:
        await seed_lessons(session, content_dir)

    yield
    await eng.dispose()


def create_app(*, with_lifespan: bool = True) -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Embedded Labs API",
        version="0.2.0",
        lifespan=lifespan if with_lifespan else None,
    )

    origins = [settings.cors_origin] if settings.cors_origin not in ("", "*") else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins != ["*"] else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Guest-Id"],
    )

    app.include_router(health.router)
    app.include_router(lessons.router)
    app.include_router(progress.router)
    return app


app = create_app()
