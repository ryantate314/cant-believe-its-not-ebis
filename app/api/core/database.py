"""Async database session management."""

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/cirrus_mro",
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set True for SQL logging in development
    pool_pre_ping=True,
)

# Create sync session class for event listeners
# Events need sync session access even in async context
_sync_session_class = sessionmaker(expire_on_commit=False)

# Create async session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    sync_session_class=_sync_session_class,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
