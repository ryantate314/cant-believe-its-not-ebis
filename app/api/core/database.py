"""Async database session management."""

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/cirrus_mro",
)

# Global engine and session factory (lazily initialized)
_engine = None
_async_session_factory = None


def _get_engine():
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            DATABASE_URL,
            echo=False,  # Set True for SQL logging in development
            pool_pre_ping=True,
        )
    return _engine


def _get_session_factory():
    """Get or create the async session factory."""
    global _async_session_factory
    if _async_session_factory is None:
        # Create sync session class for event listeners
        # Events need sync session access even in async context
        _sync_session_class = sessionmaker(expire_on_commit=False)
        _async_session_factory = async_sessionmaker(
            bind=_get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            sync_session_class=_sync_session_class,
        )
    return _async_session_factory


# Backwards-compatible aliases
@property
def engine():
    return _get_engine()


def async_session_factory():
    return _get_session_factory()()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a database session."""
    factory = _get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def reset_engine():
    """Reset the engine (useful for testing between event loops)."""
    global _engine, _async_session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _async_session_factory = None
