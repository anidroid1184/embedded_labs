from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    pass


engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None


def configure_engine(url: str | None = None) -> async_sessionmaker[AsyncSession]:
    global engine, SessionLocal
    settings = get_settings()
    db_url = url or settings.sqlalchemy_url
    if engine is not None:
        # dispose happens in lifespan/tests explicitly
        pass
    engine = create_async_engine(db_url, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    return SessionLocal


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    if SessionLocal is None:
        configure_engine()
    assert SessionLocal is not None
    return SessionLocal


def get_engine() -> AsyncEngine:
    if engine is None:
        configure_engine()
    assert engine is not None
    return engine


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    factory = get_session_factory()
    async with factory() as session:
        yield session
