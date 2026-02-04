"""Pytest configuration for API tests."""

import os
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

# Add the api directory to the Python path so tests can import main, core, etc.
sys.path.insert(0, str(Path(__file__).parent))


@pytest.fixture(scope="module")
def anyio_backend():
    """Use asyncio for all async tests."""
    return "asyncio"


@pytest_asyncio.fixture
async def db_session():
    """Provide a database session for testing.

    This fixture requires DATABASE_URL to be set. Tests using this fixture
    should be marked with skipif for DATABASE_URL not set.

    Creates a new engine per test to avoid event loop conflicts.
    """
    if not os.environ.get("DATABASE_URL"):
        pytest.skip("DATABASE_URL not set")

    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlalchemy.orm import sessionmaker

    database_url = os.environ.get("DATABASE_URL")
    engine = create_async_engine(database_url, echo=False, pool_pre_ping=True)
    _sync_session_class = sessionmaker(expire_on_commit=False)
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        sync_session_class=_sync_session_class,
    )

    async with session_factory() as session:
        yield session
        # Rollback any uncommitted changes
        await session.rollback()

    await engine.dispose()


@pytest_asyncio.fixture
async def async_client():
    """Provide an async HTTP client for testing.

    Resets the global database engine before each test to avoid event loop issues.
    """
    from core.database import reset_engine
    from main import app

    # Reset the global engine to work with this test's event loop
    await reset_engine()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    # Clean up after test
    await reset_engine()


@pytest_asyncio.fixture(autouse=False)
async def register_listeners():
    """Register audit listeners before tests.

    Not autouse - tests that need this should explicitly request it.
    """
    from models import register_all_audit_listeners

    register_all_audit_listeners()
    yield


@pytest_asyncio.fixture
async def test_city(db_session):
    """Ensure a test city exists for foreign key constraints."""
    # Check if city with id=1 exists, create if not
    result = await db_session.execute(text("SELECT id FROM city WHERE id = 1"))
    if not result.scalar_one_or_none():
        await db_session.execute(
            text("INSERT INTO city (id, code, name) VALUES (1, 'TST', 'Test City')")
        )
        await db_session.commit()
    yield 1


@pytest_asyncio.fixture
async def cleanup_work_orders(db_session):
    """Clean up test work orders after each test.

    Note: audit_log records cannot be deleted due to database immutability trigger.
    We only clean up work_order records.
    """
    yield
    # Delete test work orders (those with WO-TEST- prefix)
    # Note: audit_log records are immutable by design
    await db_session.execute(
        text("DELETE FROM work_order WHERE work_order_number LIKE 'WO-TEST-%'")
    )
    await db_session.commit()
